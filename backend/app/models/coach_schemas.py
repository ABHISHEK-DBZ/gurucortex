from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CoachStrategyRecommendation(BaseModel):
    id: str
    strategy_name: str  # active_recall, spaced_repetition, interleaving, elaboration, concrete_examples, dual_coding, practice_testing, teach_back, worked_examples
    strategy_title: str
    rationale: str
    action_plan: str
    recommended_duration_mins: int
    evaluation_criteria: str
    evidence_source: str
    status: str
    created_at: str

class StudentProjectBase(BaseModel):
    title: str
    subject: str
    related_concept: Optional[str] = None
    description: str
    skills_demonstrated: List[str] = Field(default_factory=list)
    project_url: Optional[str] = None
    reflections: Optional[str] = None

class StudentProjectResponse(StudentProjectBase):
    id: str
    student_id: str
    status: str
    created_at: str

class LearningIdentityResponse(BaseModel):
    student_id: str
    overall_progress_score: float
    subject_strengths: List[Dict[str, Any]]
    knowledge_gaps: List[Dict[str, Any]]
    acquired_skills: List[str]
    projects: List[StudentProjectResponse]
    revision_consistency_rate: float
    total_study_hours: float
    active_goals: List[Dict[str, Any]]
    badges_earned: List[Dict[str, Any]]
    recent_reflections: List[str]
