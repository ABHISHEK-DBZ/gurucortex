from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.models.coach_schemas import (
    CoachStrategyRecommendation,
    StudentProjectBase,
    StudentProjectResponse,
    LearningIdentityResponse
)
from app.services.cognitive_coach import CognitiveCoach
from app.services.llm_client import LLMClient

router = APIRouter(prefix="/api/v1/coach", tags=["Cognitive Learning Coach"])
coach_service = CognitiveCoach()
llm_client = LLMClient()

class CoachStreamRequest(BaseModel):
    student_id: Optional[str] = "default_student"
    query: str

@router.get("/recommendations", response_model=List[CoachStrategyRecommendation])
async def get_coach_recommendations(student_id: str = "default_student"):
    """
    Get personalized cognitive learning strategies based on observed difficulties.
    """
    return await coach_service.get_or_generate_recommendations(student_id)

@router.post("/recommendations/{recommendation_id}/status")
async def update_recommendation_status(recommendation_id: str, status: str):
    """
    Update status of a strategy recommendation (in_progress, completed, dismissed).
    """
    success = await coach_service.update_recommendation_status(recommendation_id, status)
    return {"status": "ok", "updated": success}

@router.get("/identity", response_model=LearningIdentityResponse)
async def get_student_learning_identity(student_id: str = "default_student"):
    """
    Fetch comprehensive 'My Learning Identity' growth profile:
    - Subject strengths & knowledge gaps
    - Acquired skills & project portfolio
    - Revision consistency & study habits
    """
    return await coach_service.get_learning_identity(student_id)

@router.post("/projects", response_model=StudentProjectResponse)
async def add_student_project(project: StudentProjectBase, student_id: str = "default_student"):
    """
    Add a completed or in-progress hands-on project to the student growth portfolio.
    """
    return await coach_service.add_student_project(project.dict(), student_id)

@router.post("/stream")
async def stream_coach_advice(request: CoachStreamRequest):
    """
    Stream customized cognitive learning coach advice as Server-Sent Events (SSE).
    """
    system_prompt = (
        "You are the GuruCortex Cognitive Learning Coach. "
        "Synthesize evidence-backed cognitive science strategies (such as active recall, spaced repetition, "
        "interleaving, elaborative interrogation, and dual coding) into direct, empathetic, and actionable guidance."
    )
    prompt = (
        f"Student ID: {request.student_id}\n"
        f"Student Query / Challenge: {request.query}\n\n"
        "Provide actionable cognitive coaching advice, concrete study tactics, and a step-by-step strategy to overcome this challenge."
    )

    async def event_generator():
        async for token in llm_client.stream_generate(prompt, system_prompt):
            if not token:
                continue
            # Multi-line tokens must become one data: line each so SSE framing stays valid.
            for line in token.split("\n"):
                yield f"data: {line}\n"
            yield "\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
