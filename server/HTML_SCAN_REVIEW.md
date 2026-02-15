# HTML Scan API — Critical Review

**Date**: 2026-02-12
**Endpoint tested**: `POST /html-scan`
**Server**: AISEO Scraping Service v0.2.0 (Docker)

---

## Test Summary

20 tests performed covering:

| Category | Tests | Result |
|---|---|---|
| Authentication (no token, wrong token) | 2 | PASS |
| Real-world scan (example.com) | 1 | PASS |
| Real-world scan with sub-URLs (lemonde.fr) | 1 | PASS |
| SSRF attacks (localhost, 127.0.0.1, ::1, 0.0.0.0, decimal IP, file://) | 6 | PASS |
| Input validation (missing fields, XSS in URL, 10KB URL) | 4 | PASS |
| Abuse / DoS (50 sub-URLs) | 1 | WARN |
| Method enforcement (GET on POST route) | 1 | PASS |
| Sub-URL SSRF injection | 1 | PARTIAL |
| Health check (with auth) | 1 | PASS |
| Docker healthcheck (without auth) | 1 | FAIL |

---

## What Works Well

- **SSRF protection is solid** — All bypass attempts (decimal IP, IPv6 loopback, `0.0.0.0`, private ranges, `file://`) are correctly blocked.
- **Auth works correctly** — 401 for missing token, 403 for wrong token.
- **Pydantic validation** — Missing `url` field returns clean 422 errors.
- **Fault tolerance** — Sub-URL failures don't crash the primary scan.
- **W3C validation works** — `vnu.jar` runs correctly, detected 296 errors on lemonde.fr.
- **Meta tag analysis is thorough** — Covers title, description, canonical, OpenGraph, Twitter Cards with completeness scoring.
- **Heading analysis is useful** — Catches skipped levels and multiple H1s.
- **Schema.org extraction works** — Found `NewsMediaOrganization` on lemonde.fr via extruct.

---

## Critical Issues

### 1. Lychee link checker is completely broken

**Severity**: CRITICAL — 10% of the score is based on a tool that never runs.

The Dockerfile downloads `lychee-x86_64-unknown-linux-gnu.tar.gz`. This binary only works on x86 architecture. On Apple Silicon (ARM) and any ARM-based deployment, it fails silently:

```
rosetta error: failed to open elf at /lib64/ld-linux-x86-64.so.2
```

The code catches the error gracefully and returns `{"total": 0, "successful": 0, "failed": 0}`, which then scores as 50/100 (neutral). The user has no indication that link checking was skipped entirely.

**Impact**: Link health is never actually evaluated. The score is inflated or deflated by a phantom 50-point neutral score on 10% of the total.

**Fix**: Use a multi-arch Lychee build, detect architecture at build time, or replace with a Python-based link checker (e.g., `aiohttp` + crawl).

---

### 2. Health endpoint requires auth — Docker healthcheck is permanently broken

**Severity**: CRITICAL — Container orchestration is broken.

The `/health` endpoint requires a Bearer token, but the Docker `HEALTHCHECK` command runs a bare `curl` without authentication:

```dockerfile
HEALTHCHECK ... CMD curl -f http://localhost:8080/health || exit 1
```

The container will **never** report as healthy:
```
INFO: 127.0.0.1:36918 - "GET /health HTTP/1.1" 401 Unauthorized
```

**Impact**: Docker health status is always `unhealthy`. Breaks orchestration tools, load balancers, `depends_on` with `condition: service_healthy`, and container auto-restart policies.

**Fix**: Remove `verify_bearer_token` dependency from the `/health` route. Health checks should be unauthenticated — they only confirm the service is up, not expose data.

---

### 3. No rate limiting or request size limits

**Severity**: CRITICAL — Easy denial-of-service vector.

Test results:
- 50 sub-URLs were all accepted and processed sequentially (no cap).
- A 10KB URL was accepted and attempted to fetch.
- No request body size limit enforced.
- No per-IP or per-token rate limiting.

A single request with 100 sub-URLs could keep the server busy for 30+ minutes (each URL has a 30s fetch timeout plus analysis time).

**Fix**:
- Add a `max_sub_urls` limit (5-10 is reasonable).
- Add URL length validation (max 2048 chars).
- Add request rate limiting (e.g., via `slowapi` or middleware).
- Add a global request timeout at the endpoint level.

---

### 4. SSRF protection has a TOCTOU (Time-of-Check-Time-of-Use) vulnerability

**Severity**: HIGH — DNS rebinding can bypass SSRF protection.

The URL is validated by resolving DNS and checking the IP. Then `httpx` makes a **separate** HTTP request that resolves DNS again independently:

```python
# Step 1: Validates URL — resolves DNS, checks IP is not private
await asyncio.to_thread(_validate_url, url)

# Step 2: Fetches URL — resolves DNS AGAIN, could get a different IP
async with httpx.AsyncClient(...) as client:
    response = await client.get(url)
```

An attacker using DNS rebinding (a domain that alternates between a public IP and `127.0.0.1`) could pass validation on the first resolution and then have the fetch hit an internal service on the second resolution.

**Fix**: Resolve DNS once, pin the IP, and pass it directly to httpx (e.g., via a custom transport or by replacing the hostname with the resolved IP in the URL).

---

### 5. Error responses leak implementation details

**Severity**: MEDIUM — Information disclosure aids attackers.

SSRF-blocked URLs return:
```json
{"scanErrors": ["Failed to fetch website: ValueError"]}
```

Other failures leak error class names:
- `ConnectError` — tells the attacker the host exists but refused connection
- `HTTPStatusError` — tells the attacker the host responded
- `ValueError` — tells the attacker the URL was blocked by validation

**Fix**: Return a generic `"Failed to scan URL"` message for all fetch failures. Log the detailed error server-side only.

---

### 6. Sub-URL SSRF attempts return HTTP 200 with `"success": true`

**Severity**: MEDIUM — Misleading response status.

When a sub-URL like `http://localhost:8080/health` is submitted, the SSRF protection blocks it correctly — but the overall response is still:

```json
{
  "success": true,
  "data": {
    "htmlScannerScore": 53.7,
    "scanErrors": ["Sub-URL http://localhost:8080/health: ValueError"]
  }
}
```

The scan "succeeds" with a score, and the SSRF error is buried in `scanErrors`. An attacker probing internal infrastructure gets a 200 OK, which may confuse monitoring/alerting systems.

**Fix**: Consider returning 400 if any sub-URL is a blocked SSRF attempt, or at minimum clearly flag it as a security rejection rather than a scan error.

---

## Medium Issues

### 7. Score gives a false sense of accuracy when tools are unavailable

When `vnu.jar` or Lychee are missing/broken, the score defaults to 50 (neutral). A scan running on a broken setup still produces a "reasonable-looking" score with no clear indication that major analysis components were skipped.

**Fix**: Include a `scanCompleteness` field (e.g., `{"w3c": true, "links": false, ...}`) so consumers know what actually ran. Consider scoring only components that successfully executed.

---

### 8. Keyword extraction produces noise, not insights

`extract_keywords` uses simple term frequency. The top keywords for lemonde.fr were:

```
["article", "reserve", "abonnes", "monde", "plus"]
```

These are navigation/boilerplate terms, not content keywords. While `<nav>`, `<footer>`, and `<header>` are decomposed, paywalled overlays, cookie banners, repeated UI elements, and sidebar widgets still pollute results.

**Fix**: Consider extracting keywords from `<main>` or `<article>` tags only, or use TF-IDF across the primary + sub-pages (now that multiple pages are scanned).

---

### 9. Schema.org scoring is unrealistically harsh

The "recommended" set is hardcoded as:
```python
{"Organization", "WebSite", "BreadcrumbList", "FAQPage", "Product", "LocalBusiness"}
```

Expecting all 6 types is unrealistic. Most businesses won't have both `Product` AND `LocalBusiness` AND `FAQPage`. Le Monde scored **16.7%** on schema despite having proper `NewsMediaOrganization` markup — because it doesn't match the hardcoded list.

**Fix**: Make the recommended types contextual based on the `businessType` or `category` from the request. A news site should be evaluated against `NewsMediaOrganization`, `WebSite`, `BreadcrumbList`, not `Product` and `LocalBusiness`.

---

### 10. Image alt text compliance is misleading for edge cases

- **Zero images = 100% compliance**: `example.com` (no images) gets a perfect alt text score. Empty/minimal sites appear flawless.
- **Decorative images penalized**: Intentionally empty `alt=""` (correct per WCAG for decorative images) is counted as `emptyAlt` and excluded from `withAlt`, reducing the compliance percentage.

**Fix**: Return `null` or `N/A` for compliance when there are 0 images. Count `alt=""` as compliant (it follows WCAG 2.1 spec for decorative images).

---

### 11. Page analysis runs sequentially instead of in parallel

In `_scan_single_page`, all analysis steps run one after another:

```python
w3c_result = await asyncio.to_thread(validate_html_w3c, html)    # blocking
link_result = await asyncio.to_thread(check_links_lychee, url)    # blocking
schema_result = extract_schema_org(html, url)                      # sync, blocks event loop
meta_result = analyze_meta_tags(html)                              # sync, blocks event loop
heading_result = analyze_headings(html)                            # sync, blocks event loop
alt_result = audit_images(html)                                    # sync, blocks event loop
keyword_result = extract_keywords(html, language)                  # sync, blocks event loop
```

Only W3C and Lychee use `asyncio.to_thread()`. The rest (especially extruct and NLTK) block the event loop and run sequentially.

**Fix**: Wrap all CPU-bound analysis in `asyncio.to_thread()` and run them concurrently with `asyncio.gather()`:

```python
w3c, links, schema, meta, headings, alt, keywords = await asyncio.gather(
    asyncio.to_thread(validate_html_w3c, html),
    asyncio.to_thread(check_links_lychee, url),
    asyncio.to_thread(extract_schema_org, html, url),
    asyncio.to_thread(analyze_meta_tags, html),
    asyncio.to_thread(analyze_headings, html),
    asyncio.to_thread(audit_images, html),
    asyncio.to_thread(extract_keywords, html, language),
)
```

---

## Minor Issues

| Issue | Details |
|---|---|
| Docs disabled for no benefit | `docs_url=None, redoc_url=None` — the service is already behind auth, disabling Swagger just makes dev/testing harder |
| `url` field is `str` not `HttpUrl` | Pydantic's `HttpUrl` type would reject obvious non-URLs at validation time instead of at fetch time |
| No endpoint-level timeout | A single request scanning multiple slow sites could block for 10+ minutes |
| `linkCheck` always returns zeros | Even if Lychee worked, it only scans the URL itself — it doesn't extract and check links from the HTML content |
| `language` parameter underused | Only affects keyword extraction stopwords — meta analysis doesn't adjust by language (e.g., `og:locale` recommendation) |

---

## Test Output Samples

### example.com scan result
```
Score: 53.7
W3C errors: 0
Schema types: [] (none)
Meta completeness: 8.3%
Headings: 1x H1, no issues
Images: 0 (100% compliance)
Keywords: 11 extracted
```

### lemonde.fr scan result (with /international/ sub-URL)
```
Score: 56.9 (primary: ~60.4, sub-page: 53.4)
W3C errors: 296
Schema types: [NewsMediaOrganization]
Meta completeness: 100%
Meta issues: description too long (171 chars)
Heading issues: skipped H1 -> H3
Images: 190 total, 63.7% alt compliance
Keywords: 30 extracted (mostly boilerplate)
```

---

## Recommended Priority Order

1. **Fix health endpoint auth** (5 min fix, unblocks Docker orchestration)
2. **Fix Lychee architecture** (use multi-arch or replace — link checking is 100% broken)
3. **Add rate limiting + sub-URL cap** (DoS protection)
4. **Fix SSRF TOCTOU** (DNS rebinding vulnerability)
5. **Parallelize analysis** (performance — easy win with `asyncio.gather`)
6. **Sanitize error messages** (information disclosure)
7. **Improve scoring when tools are unavailable** (accuracy)
8. **Make schema recommendations contextual** (relevance)
9. **Improve keyword extraction** (quality)
10. **Fix alt text edge cases** (correctness)
