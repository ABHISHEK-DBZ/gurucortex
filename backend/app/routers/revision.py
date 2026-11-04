from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

from app.models.revision_schemas import (
    FlashcardResponse,
    FlashcardReviewRequest,
    FlashcardGenerateRequest,
    RevisionDashboardResponse
)
from app.services.revision_engine import RevisionEngine

router = APIRouter(prefix="/api/v1/revision", tags=["Adaptive Revision Intelligence"])
revision_engine = RevisionEngine()

@router.get("/dashboard", response_model=RevisionDashboardResponse)
async def get_revision_dashboard():
    """
    Get full Revision Intelligence dashboard:
    - Real topic mastery estimates
    - Strong, needs_revision, and unstudied topics
    - Evidence-grounded revision recommendations
    - Due flashcards and exam countdowns
    """
    return await revision_engine.get_revision_dashboard()

@router.get("/flashcards/due", response_model=List[FlashcardResponse])
async def get_due_flashcards(limit: int = 20):
    """
    Fetch active recall flashcards scheduled for review today.
    """
    return await revision_engine.get_due_flashcards(limit=limit)

@router.post("/flashcards/generate", response_model=List[FlashcardResponse])
async def generate_flashcards(req: FlashcardGenerateRequest):
    """
    Generate active recall flashcards from an uploaded document or specific concept.
    """
    return await revision_engine.generate_flashcards(
        document_id=req.document_id,
        concept_id=req.concept_id,
        count=req.count
    )

@router.post("/flashcards/review")
async def review_flashcard(req: FlashcardReviewRequest):
    """
    Submit active recall score (grade 0-5) for SM-2 interval recalculation.
    """
    try:
        return await revision_engine.review_flashcard(req.flashcard_id, req.grade)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
