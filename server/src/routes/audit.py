"""
Audit endpoint placeholder for AISEO scraping service.

Full audit processing logic will be implemented in Epic 4.
This placeholder returns 501 Not Implemented.
"""

import json
from typing import Annotated, Any
import os
from datetime import datetime
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import progressbar
import re

from auth import verify_bearer_token


from utils.dbal.ai_api_wrapper import call_anthropic_api, call_google_api, call_perplexity_api, call_openai_api

router = APIRouter(tags=["Audit"])


class coffeeShopData(BaseModel):
    """Placeholder request model for audit endpoint."""

    businessUrl: str
    businessType: str
    language: str = "en"
    businessName: str
    fullBusinessName: str
    street: str
    number: str
    city: str
    neighborhood: list = []
    rounding: str | None = None
    pointOfInterest: list = []
    coffeeType: list = []

class restaurantData(BaseModel):
    businessType: str
    language: str = "en"
    businessUrl: str
    businessName: str
    fullBusinessName: str
    street: str
    number: str
    city: str
    neighborhood: list = []
    rounding: str | None = None
    pointOfInterest: list = []
    restaurantType: list = []



@router.post("/audit", status_code=200)
async def create_audit(
    _token: Annotated[str, Depends(verify_bearer_token)],
    request,
) -> JSONResponse:
    """
    Audit processing endpoint (placeholder).

    Full implementation will be added in Epic 4 (Audit Engine).
    Currently returns 501 Not Implemented.
    """

    print("Checking the business type...")

    businessPossibleTypes = [("coffee-shop", coffeeShopData), ("restaurant", restaurantData)]


    for businessPossibleType, businessDataArchitecture  in businessPossibleTypes:
        if request["businessType"] == businessPossibleType:
            businessData = businessDataArchitecture(request)

    print(f"DATA : {businessData}")

    ai_raw_responses = make_ai_questions(businessData)

    with open(f"data/raw/{request['businessId']}_{datetime.now().strftime('%Y%m%d')}_ai_audit_results.json", "w+") as f:
        json.dump(ai_raw_responses, f, indent=2)


    if True: # TODO: Checks the answers and add check of quality of response.
        return JSONResponse(
            status_code=200,
            content="Audit completed successfully"
        )

    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "error": "AI_AUDIT_FAILED",
            "message": "AI audit failed",
        },
    )



"""
    This function is used to ask the AIs all the questions and get the answers for the business data.
    It takes business data as input and can adapt based on the business type and language.
    It returns a dictionary with the answers for each question for each AI.
"""
def make_ai_questions(business_data):
    
    providers = [
        ("OPENAI", call_openai_api, "gpt-5-nano"),
        ("ANTHROPIC", call_anthropic_api, "claude-3-haiku-20240307"),
        ("PERPLEXITY", call_perplexity_api, "auto"),
        ("GEMINI", call_google_api, "gemini-2.5-flash-lite"),
    ]

    results = {
        "OPENAI" : {"answers": {}},
        "ANTHROPIC" : {"answers": {}},
        "PERPLEXITY" : {"answers": {}},
        "GEMINI" : {"answers": {}},
    }

    print(f"Starting audit with ai agents for {business_data.businessName}...")


    questions = []

    try:
        with open(f"utils/questions/{business_data.language}/generic.json") as f :
            generic_questions = json.load(f)
        questions.extend(generic_questions)

        with open(f"utils/questions/{business_data.language}/{business_data.businessType}.json") as f :
            specific_questions = json.load(f)
        questions.extend(specific_questions)
  
    except Exception as e:
        print(f"Got wrong answer when tried to read the file with questions : {e}")
        return {
            "success": False,
            "error": "QUESTIONS_FILE_NOT_FOUND",
            "message": f"Question file not found: {e}",
        }

    for ai_name, ai_caller, ai_model in providers:
        b = progressbar.ProgressBar(maxval=len(generic_questions))
        b.start()
        c=0
        api_key = os.environ.get(f"{ai_name}_API_KEY")

        for question in generic_questions:
            
            # Checking for parameters in the question
            question_params = re.findall(r"{(\w+)}", question['question'])

            no_question_params = False
            for question_param in question_params:
                if question_param not in business_data.model_dump().keys():
                    print(f"Can't find {question_param}")
                    no_question_params = True
                    break
            if not no_question_params:
                results[ai_name]["answers"][question["id"]] = {"answers": [], "question": question["question"], "number_of_answers": 0, "success": False}
                continue
            
            answers = []

            for question_param in question_params:
                if business_data.question_param is list:
                    for business_param in business_data.question_param:
                        formated_question = question["question"].format(business_param_name=business_param, **business_data.model_dump())
                        ai_answer = ai_caller(api_key, formated_question, ai_model, use_web_search=True)
                        answers.append(ai_answer)
                else:
                    formated_question = question["question"].format(**business_data.model_dump())
                    ai_answer = ai_caller(api_key, formated_question, ai_model, use_web_search=True)
                    answers.append(ai_answer)


            results[ai_name]["answers"][question["id"]] = {"answers": answers, "question": question["question"], "number_of_answers": len(answers), "success": True}
            c += 1
            b.update(c)
        b.finish()
    return results
        


