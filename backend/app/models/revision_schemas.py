from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Flashcard & Spaced Repetition Models
class FlashcardBase(BaseModel):
    front_prompt: str
    back_answer: str
    concept_id: Optional[str] = None
    topic_id: Optional[str] = None
    difficulty: str = "medium"

class FlashcardResponse(FlashcardBase):
    id: str
    repetition_count: int
    interval_days: int
    ease_factor: float
    last_reviewed: Optional[str] = None
    next_review: str
    created_at: str

class FlashcardReviewRequest(BaseModel):
    flashcard_id: str
    grade: int  # 0 to 5 (SM-2 scale: 0-2 fail, 3-5 pass)

class FlashcardGenerateRequest(BaseModel):
    document_id: Optional[str] = None
    concept_id: Optional[str] = None
    count: int = 5

# Revision Plan & Analytics Models
class TopicMasterySummary(BaseModel):
    topic_id: str
    topic_name: str
    category: str
    mastery_percentage: float
    status: str  # "strong", "needs_revision", "needs_practice", "unstudied"
    questions_answered: int
    correct_count: int
    last_reviewed: Optional[str] = None
    next_review: Optional[str] = None

class RevisionRecommendation(BaseModel):
    topic_name: str
    score_percentage: float
    message: str
    recommended_action: str
    visual_explanation_id: Optional[str] = None
    practice_question_count: int = 5
    scheduled_revision_date: str

class ExamCountdown(BaseModel):
    subject: str
    exam_date: str
    days_remaining: int
    priority: str

class RevisionDashboardResponse(BaseModel):
    overall_mastery: float
    strong_topics: List[TopicMasterySummary]
    needs_revision_topics: List[TopicMasterySummary]
    unstudied_topics: List[TopicMasterySummary]
    recommendations: List[RevisionRecommendation]
    due_flashcards_count: int
    exam_countdowns: List[ExamCountdown]
    upcoming_revision_schedule: List[Dict[str, Any]]
