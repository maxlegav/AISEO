"""
Audit endpoint — Complete GEO audit pipeline.

Orchestrates: prompt generation → AI querying → mention detection →
scoring → HTML scanning → GEO Score → MongoDB write.
"""

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from auth import verify_bearer_token
import config as app_config
from models.business import AuditRequest
from models.audit import (
    BusinessSnapshot,
    CitationStats,
    EngineResult,
    GeneratedPrompt,
    PromptResult,
    ResultsBlob,
)
from models.business import LocalityTier
from services.prompt_generator import generate_prompts
from services.ai_executor import execute_all_engines
from services.mention_detector import detect_mention
from services.locality_classifier import classify_locality_tier
from services.scoring import (
    calculate_prompt_score,
    calculate_category_scores,
    calculate_level_scores,
    calculate_audit_engine_score,
    calculate_discoverability_threshold,
    calculate_geo_score,
    calculate_citation_stats,
    score_competitor,
)
from services.html_scanner import scan_website
from services.gsc_analyzer import fetch_gsc_data
from services.google_reviews import fetch_google_reviews

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Audit"])


def _build_location_context(request: AuditRequest) -> dict | None:
    """Build per-engine location context based on locality tier.

    Returns None for GLOBAL businesses (no location bias).
    For HYPER_LOCAL: neighborhood + city + country.
    For NATIONAL: country (+ region if available).
    """
    if request.localityTier == LocalityTier.GLOBAL:
        return None

    # Build human-readable text hint (for ChatGPT / Claude message prefix)
    parts: list[str] = []
    perplexity_loc: dict = {}

    if request.localityTier == LocalityTier.HYPER_LOCAL:
        if request.neighborhood:
            parts.append(request.neighborhood)
        if request.city:
            parts.append(request.city)
            perplexity_loc["city"] = request.city
        if request.region:
            parts.append(request.region)
            perplexity_loc["region"] = request.region
        if request.country:
            parts.append(request.country)
            perplexity_loc["country"] = request.country

    elif request.localityTier == LocalityTier.NATIONAL:
        if request.region:
            parts.append(request.region)
            perplexity_loc["region"] = request.region
        if request.country:
            parts.append(request.country)
            perplexity_loc["country"] = request.country

    if not parts:
        return None

    return {
        "text_hint": ", ".join(parts),
        "perplexity_options": {"user_location": perplexity_loc} if perplexity_loc else None,
    }


def _create_business_snapshot(request: AuditRequest) -> BusinessSnapshot:
    """Capture all business metadata at audit time (snapshot pattern)."""
    return BusinessSnapshot(
        name=request.businessName,
        primaryUrl=request.businessUrl,
        subUrls=request.subUrls,
        competitorUrls=request.competitorUrls,
        competitorNames=request.competitorNames,
        category=request.category,
        description=request.description,
        targetKeywords=request.targetKeywords,
        businessType=request.businessType,
        localityTier=request.localityTier.value if request.localityTier else None,
        allMetadata=request.model_dump(exclude={"auditId", "businessId", "userId"}),
    )


async def _phase1_generate_prompts(audit_id: str, oid: ObjectId, request: AuditRequest):
    """Phase 1: classify locality, build snapshot, generate prompts, pause for approval.

    Writes prompts + originalRequest to DB and sets status = awaiting_prompt_approval.
    """
    db = app_config.get_db()

    # 1b. Auto-classify locality tier if not provided
    if request.localityTier is None:
        request.localityTier = classify_locality_tier(
            request.businessType, request.city, request.country,
        )
    logger.info(f"[{audit_id}] Locality tier: {request.localityTier.value}")

    # 2. Create business snapshot
    snapshot = _create_business_snapshot(request)

    # 3. Generate 100 prompts
    logger.info(f"[{audit_id}] Generating prompts...")
    prompts = await generate_prompts(request)

    # Write prompts + originalRequest to DB, then pause for manual approval
    await db.audits.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "awaiting_prompt_approval",
                "businessName": request.businessName,
                "schemaVersion": 2,
                "results.businessSnapshot": snapshot.model_dump(),
                "results.localityTier": request.localityTier.value if request.localityTier else None,
                "results.generatedPrompts": [p.model_dump() for p in prompts],
                "results.originalRequest": request.model_dump(),
            }
        },
    )
    logger.info(f"[{audit_id}] {len(prompts)} prompts generated — awaiting prompt approval")


async def _phase2_execute_audit(audit_id: str, oid: ObjectId):
    """Phase 2: read approved prompts from DB, run AI + scoring, write final results.

    Reads whatever prompts are currently in the DB (allows manual edits between phases).
    """
    db = app_config.get_db()
    start_time = time.time()

    # 1. Load audit document and reconstruct objects from stored data
    doc = await db.audits.find_one({"_id": oid}, {"results": 1})
    if not doc:
        raise ValueError(f"Audit {audit_id} not found when starting Phase 2")

    stored_results = doc.get("results", {})
    stored_prompts = stored_results.get("generatedPrompts", [])
    stored_request = stored_results.get("originalRequest", {})
    stored_snapshot = stored_results.get("businessSnapshot", {})

    # 2. Reconstruct objects
    request = AuditRequest(**stored_request)
    snapshot = BusinessSnapshot(**stored_snapshot)
    prompts = [GeneratedPrompt(**p) for p in stored_prompts]

    logger.info(f"[{audit_id}] Phase 2 starting with {len(prompts)} prompts")

    # 4. Execute AI queries + HTML scan + optional GSC in parallel
    location_context = _build_location_context(request)
    if location_context:
        logger.info(f"[{audit_id}] Location context: {location_context['text_hint']}")

    ai_task = execute_all_engines(prompts, location_context, target_url=request.businessUrl)
    html_task = scan_website(request.businessUrl, request.subUrls, request.language)

    gsc_token = request.gscAccessToken
    gsc_task = (
        fetch_gsc_data(
            access_token=gsc_token,
            site_url=request.gscSiteUrl or request.businessUrl,
            primary_url=request.businessUrl,
            locality_tier=request.localityTier.value if request.localityTier else None,
            country=request.country,
        )
        if gsc_token
        else asyncio.sleep(0)
    )

    if gsc_token:
        logger.info(f"[{audit_id}] GSC analysis enabled for {request.gscSiteUrl or request.businessUrl}")

    google_reviews_enabled = bool(app_config.GOOGLE_PLACES_API_KEY) or app_config.MOCK_GOOGLE_REVIEWS
    google_reviews_task = (
        fetch_google_reviews(
            business_name=request.businessName,
            city=request.city,
            country=request.country,
            place_id=request.googlePlaceId,
        )
        if google_reviews_enabled
        else asyncio.sleep(0)
    )

    if google_reviews_enabled:
        logger.info(f"[{audit_id}] Google Reviews analysis enabled for {request.businessName}")

    gathered = await asyncio.gather(
        ai_task,
        html_task,
        gsc_task,
        google_reviews_task,
        return_exceptions=True,
    )

    # Unpack AI results (mandatory — re-raise if failed)
    if isinstance(gathered[0], BaseException):
        raise gathered[0]
    ai_results_tuple = gathered[0]

    # Unpack HTML results (optional — graceful degradation)
    if isinstance(gathered[1], BaseException):
        logger.warning(f"[{audit_id}] HTML scan failed: {gathered[1]}")
        html_result = None
    else:
        html_result = gathered[1]

    # Unpack GSC results (optional — graceful degradation)
    if gsc_token and not isinstance(gathered[2], BaseException):
        gsc_result = gathered[2]
        logger.info(f"[{audit_id}] GSC analysis complete — errors: {len(gsc_result.errors)}")
    else:
        if gsc_token and isinstance(gathered[2], BaseException):
            logger.warning(f"[{audit_id}] GSC analysis failed: {gathered[2]}")
        gsc_result = None

    # Unpack Google Reviews results (optional — graceful degradation)
    if google_reviews_enabled and not isinstance(gathered[3], BaseException):
        google_reviews_result = gathered[3]
        logger.info(f"[{audit_id}] Google Reviews complete — rating: {google_reviews_result.rating}, reviews: {google_reviews_result.totalReviews}")
    else:
        if google_reviews_enabled and isinstance(gathered[3], BaseException):
            logger.warning(f"[{audit_id}] Google Reviews failed: {gathered[3]}")
        google_reviews_result = None

    engine_results, engines_used, engines_succeeded = ai_results_tuple

    # 5. Detect mentions for each prompt × each engine
    logger.info(f"[{audit_id}] Detecting mentions...")
    prompt_results: list[PromptResult] = []

    for prompt in prompts:
        engines_data: dict[str, EngineResult] = {}

        for engine_name in engine_results:
            engine_prompt_results = engine_results[engine_name]
            engine_prompt_result = next(
                (r for r in engine_prompt_results if r["promptId"] == prompt.id),
                None,
            )

            if engine_prompt_result is None or engine_prompt_result.get("error"):
                engines_data[engine_name] = EngineResult(
                    error=engine_prompt_result.get("error") if engine_prompt_result else "No result",
                    responseTime=engine_prompt_result.get("responseTime", 0) if engine_prompt_result else 0,
                )
                continue

            mention_result = detect_mention(
                engine_prompt_result["rawResponse"],
                request.businessName,
                request.businessUrl,
            )
            mention_result.responseTime = engine_prompt_result.get("responseTime", 0)
            mention_result.citations = engine_prompt_result.get("citations", [])
            mention_result.targetCited = engine_prompt_result.get("targetCited", False)
            engines_data[engine_name] = mention_result

        prompt_score, mention_rate = calculate_prompt_score(engines_data)

        prompt_results.append(PromptResult(
            promptId=prompt.id,
            level=prompt.level,
            category=prompt.category,
            question=prompt.question,
            engines=engines_data,
            promptScore=prompt_score,
            mentionRate=mention_rate,
        ))

    # 6. Calculate all scores
    logger.info(f"[{audit_id}] Calculating scores...")
    cat_scores = calculate_category_scores(prompt_results)
    lvl_scores = calculate_level_scores(prompt_results)
    engine_score = calculate_audit_engine_score(cat_scores)
    threshold = calculate_discoverability_threshold(lvl_scores)
    html_scanner_score = html_result.htmlScannerScore if html_result else None
    citation_stats, citation_visibility_score = calculate_citation_stats(
        prompt_results, request.businessUrl
    )
    geo_score = calculate_geo_score(engine_score, html_scanner_score, citation_visibility_score)

    # 6.5 Phase A: Detect issues (deterministic, $0)
    from services.issue_detector import detect_issues
    detected_issues, issues_summary = detect_issues(
        html_result, cat_scores, lvl_scores, engine_score, threshold,
    )
    logger.info(f"[{audit_id}] Phase A: {issues_summary.totalCount} issues detected")

    # 6.6 Phase B: Extract prompt gaps (deterministic, $0)
    from services.prompt_gap_extractor import extract_prompt_gaps
    prompt_gaps, prompt_gaps_summary = extract_prompt_gaps(prompt_results, cat_scores)
    logger.info(f"[{audit_id}] Phase B: {prompt_gaps_summary.totalGaps} gaps, {prompt_gaps_summary.prioritizedCount} prioritized")

    # 7. Score competitors
    logger.info(f"[{audit_id}] Scoring {len(request.competitorNames)} competitors...")
    competitor_results = []
    for comp_name, comp_url in zip(request.competitorNames, request.competitorUrls):
        comp_result = score_competitor(prompt_results, comp_name, comp_url)
        competitor_results.append(comp_result)

    # 7b. Generate LLM hijack prompt + llms.txt in parallel (non-blocking)
    logger.info(f"[{audit_id}] Generating LLM hijack prompt + llms.txt...")

    async def _gen_hijack():
        from services.llm_hijack_generator import generate_llm_hijack_prompt
        return await generate_llm_hijack_prompt(
            snapshot=snapshot,
            category_scores=cat_scores,
            level_scores=lvl_scores,
            audit_engine_score=engine_score,
            discoverability_threshold=threshold,
            competitor_results=competitor_results,
            html_scan=html_result,
        )

    async def _gen_llms_txt():
        from services.llms_txt_generator import generate_llms_txt
        lang = request.language if hasattr(request, "language") and request.language else "fr"
        return await generate_llms_txt(snapshot, language=lang)

    hijack_task = asyncio.create_task(_gen_hijack())
    llms_txt_task = asyncio.create_task(_gen_llms_txt())

    gen_results = await asyncio.gather(hijack_task, llms_txt_task, return_exceptions=True)

    if isinstance(gen_results[0], BaseException):
        logger.warning(f"[{audit_id}] LLM hijack generation failed (non-blocking): {gen_results[0]}")
        llm_hijack_prompt = None
    else:
        llm_hijack_prompt = gen_results[0]

    if isinstance(gen_results[1], BaseException):
        logger.warning(f"[{audit_id}] llms.txt generation failed (non-blocking): {gen_results[1]}")
        llms_txt_content = None
    else:
        llms_txt_content = gen_results[1]

    # 8. Calculate totals
    processing_time = int((time.time() - start_time) * 1000)
    total_responses = sum(
        1 for pr in prompt_results
        for er in pr.engines.values()
        if er.error is None
    )

    # 9. Build ResultsBlob and write to MongoDB (schema v2)
    logger.info(f"[{audit_id}] Writing results to MongoDB...")
    results_blob = ResultsBlob(
        businessSnapshot=snapshot,
        localityTier=request.localityTier.value if request.localityTier else None,
        generatedPrompts=prompts,
        promptResults=prompt_results,
        categoryScores=cat_scores,
        levelScores=lvl_scores,
        auditEngineScore=engine_score,
        htmlScan=html_result,
        htmlScannerScore=html_scanner_score,
        gscData=gsc_result,
        googleReviews=google_reviews_result,
        citationStats=citation_stats,
        citationVisibilityScore=citation_visibility_score,
        issues=detected_issues,
        issuesSummary=issues_summary,
        promptGaps=prompt_gaps,
        promptGapsSummary=prompt_gaps_summary,
        llmsTxtContent=llms_txt_content,
        discoverabilityThreshold=threshold,
        competitorResults=competitor_results,
        llmHijackPrompt=llm_hijack_prompt,
        enginesUsed=engines_used,
        enginesSucceeded=engines_succeeded,
        totalPromptsProcessed=len(prompts),
        totalResponsesReceived=total_responses,
        processingTimeMs=processing_time,
    )

    await db.audits.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "review_pending",
                "businessName": request.businessName,
                "geoScore": geo_score,
                "schemaVersion": 2,
                "results": results_blob.model_dump(),
                "completedAt": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    logger.info(
        f"[{audit_id}] Audit complete — GEO Score: {geo_score}, "
        f"Engine: {engine_score}, HTML: {html_scanner_score}, "
        f"Citations: {citation_visibility_score}, "
        f"Time: {processing_time}ms"
    )


async def _run_audit_background(audit_id: str, oid: ObjectId, request: AuditRequest):
    """Phase 1 background wrapper: generate prompts and pause for approval."""
    try:
        await _phase1_generate_prompts(audit_id, oid, request)
    except Exception as e:
        logger.error(f"[{audit_id}] Phase 1 (prompt generation) failed: {e}", exc_info=True)
        try:
            db = app_config.get_db()
            await db.audits.update_one(
                {"_id": oid},
                {
                    "$set": {
                        "status": "failed",
                        "error": str(e),
                        "completedAt": datetime.now(timezone.utc).isoformat(),
                    },
                },
            )
        except Exception as db_err:
            logger.critical(f"[{audit_id}] Could not write failed status: {db_err}")


async def _run_phase2_background(audit_id: str, oid: ObjectId):
    """Phase 2 background wrapper: execute AI queries, score, write final results."""
    try:
        await _phase2_execute_audit(audit_id, oid)
    except Exception as e:
        logger.error(f"[{audit_id}] Phase 2 (AI execution) failed: {e}", exc_info=True)
        try:
            db = app_config.get_db()
            await db.audits.update_one(
                {"_id": oid},
                {
                    "$set": {
                        "status": "failed",
                        "error": str(e),
                        "completedAt": datetime.now(timezone.utc).isoformat(),
                    },
                },
            )
        except Exception as db_err:
            logger.critical(f"[{audit_id}] Could not write failed status: {db_err}")


@router.post("/audit", status_code=202)
async def run_audit(
    _token: Annotated[str, Depends(verify_bearer_token)],
    request: AuditRequest,
) -> JSONResponse:
    """
    Accept an audit request and process it in the background.

    Returns 202 immediately. The caller should poll MongoDB for results.
    """
    db = app_config.get_db()
    audit_id = request.auditId

    # Validate auditId format
    try:
        oid = ObjectId(audit_id)
    except (InvalidId, Exception):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "INVALID_AUDIT_ID",
                "message": "The provided auditId is not a valid identifier",
            },
        )

    # Verify audit document exists
    existing = await db.audits.find_one({"_id": oid}, {"_id": 1, "status": 1})
    if not existing:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": "AUDIT_NOT_FOUND",
                "message": "No audit document found with the provided auditId",
            },
        )

    # Prevent double-submission
    current_status = existing.get("status")
    if current_status in ("processing", "awaiting_prompt_approval", "review_pending", "completed"):
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "error": "AUDIT_ALREADY_PROCESSED",
                "message": f"Audit is already in '{current_status}' state",
            },
        )

    # Update status → processing
    await db.audits.update_one(
        {"_id": oid},
        {"$set": {"status": "processing"}},
    )
    logger.info(f"[{audit_id}] Audit accepted for {request.businessName}")

    # Fire-and-forget: process in background
    asyncio.create_task(_run_audit_background(audit_id, oid, request))

    return JSONResponse(
        status_code=202,
        content={
            "success": True,
            "data": {
                "auditId": audit_id,
                "status": "processing",
            },
        },
    )


@router.post("/audit/{audit_id}/approve-prompts", status_code=202)
async def approve_prompts(
    audit_id: str,
    _token: Annotated[str, Depends(verify_bearer_token)],
) -> JSONResponse:
    """
    Approve the generated prompts and kick off Phase 2 (AI execution).

    The prompts stored in DB are used as-is, allowing manual edits in MongoDB
    between prompt generation and this call.
    """
    db = app_config.get_db()

    try:
        oid = ObjectId(audit_id)
    except (InvalidId, Exception):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "INVALID_AUDIT_ID",
                "message": "The provided auditId is not a valid identifier",
            },
        )

    existing = await db.audits.find_one({"_id": oid}, {"_id": 1, "status": 1})
    if not existing:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "error": "AUDIT_NOT_FOUND",
                "message": "No audit document found with the provided auditId",
            },
        )

    current_status = existing.get("status")
    if current_status != "awaiting_prompt_approval":
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "error": "INVALID_STATUS",
                "message": f"Audit must be in 'awaiting_prompt_approval' state, currently '{current_status}'",
            },
        )

    await db.audits.update_one(
        {"_id": oid},
        {"$set": {"status": "processing"}},
    )
    logger.info(f"[{audit_id}] Prompts approved — starting Phase 2 (AI execution)")

    asyncio.create_task(_run_phase2_background(audit_id, oid))

    return JSONResponse(
        status_code=202,
        content={
            "success": True,
            "data": {
                "auditId": audit_id,
                "status": "processing",
            },
        },
    )
