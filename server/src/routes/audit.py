"""
Audit endpoint placeholder for AISEO scraping service.

Full audit processing logic will be implemented in Epic 4.
This placeholder returns 501 Not Implemented.
"""

import json
from typing import Annotated, Any
import os

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from auth import verify_bearer_token


from utils.dbal.ai_api_wrapper import call_anthropic_api, call_google_api, call_perplexity_api, call_openai_api

router = APIRouter(tags=["Audit"])


class AuditRequest(BaseModel):
    """Placeholder request model for audit endpoint."""

    auditId: str
    businessUrl: str
    businessType: str
    language: str = "en"
    callbackUrl: str | None = None
    businessName: str
    fullBusinessName: str
    street: str
    number: str
    city: str
    neighborhood: list = []
    rounding: str | None = None
    pointOfInterest: list = []



@router.post("/audit", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_audit(
    _token: Annotated[str, Depends(verify_bearer_token)],
    request: AuditRequest,
) -> JSONResponse:
    """
    Audit processing endpoint (placeholder).

    Full implementation will be added in Epic 4 (Audit Engine).
    Currently returns 501 Not Implemented.
    """

    print("GET STARTED")
    make_ai_questions(request)

    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={
            "success": False,
            "error": "NOT_IMPLEMENTED",
            "message": "Audit processing not yet available. Coming in Epic 4.",
        },
    )


def make_ai_questions(business_data):
    
    providers = [
        ("OPENAI", call_openai_api, "gpt-4.1-mini"),
        ("ANTHROPIC", call_anthropic_api, "gpt-3.5"),
        ("PERPLEXITY", call_google_api, "gpt-3.5"),
        ("GEMINI", call_perplexity_api, "gpt-3.5"),
    ]

    results = {
        "OPENAI" : {"answers": {}},
        "ANTHROPIC" : {"answers": {}},
        "PERPLEXITY" : {"answers": {}},
        "GEMINI" : {"answers": {}},
    }

    all_questions = []
    
    try:
        with open(f"utils/questions/{business_data.language}/coffee_shop.json") as f :
            generic_questions = json.load(f)
    except Exception as e:
        print(f"Got wrong answer when tried to read the generic file : {e}")
        return None

    for ai_name, ai_caller, ai_model in providers:
        print(f"AI : {ai_name}")
        for question in generic_questions["questions_coffee_shop"]:
            print(f"QUESTIONS : {question['question']}, {type(business_data)}")
            formated_question = question["question"].format(**business_data.model_dump())

            ai_answer = ai_caller(os.environ.get(f"{ai_name}_API_KEY"), formated_question, ai_model, use_web_search=True)
            print(ai_answer)

            results[ai_name]["answers"][question["id"]] = ai_answer
            break
        break
    
    with open("test.json") as f:
        print(results)
        f.write(results)
        f.write(json.load(results))
        


