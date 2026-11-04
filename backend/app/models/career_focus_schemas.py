from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Career & Skills Models
class CareerPathway(BaseModel):
    id: str
    title: str
    description: str
    related_subjects: List[str]
    industries: List[str]
    required_qualifications: List[str]
    technical_skills: List[str]
    recommended_certifications: List[str]
    higher_education_options: List[str]
    average_salary_range: Optional[str] = None

class SkillGapAnalysis(BaseModel):
    pathway_title: str
    existing_strengths: List[str]
    skills_to_develop: List[str]
    missing_knowledge: List[str]
    recommended_projects: List[str]
    learning_resources: List[Dict[str, str]]
    next_milestone: str

class CareerRoadmapMilestone(BaseModel):
    step_number: int
    milestone_title: str
    target_skills: List[str]
    recommended_project: str
    suggested_timeline: str
    verification_check: str

class CareerRoadmapResponse(BaseModel):
    id: str
    pathway_title: str
    industry: str
    overview: str
    milestones: List[CareerRoadmapMilestone]
    alternative_pathways: List[str]
    created_at: str

# Focus Intelligence Models
class FocusSessionStart(BaseModel):
    subject: str
    target_duration_minutes: int = 25
    study_goals: Optional[str] = None

class FocusSessionEnd(BaseModel):
    session_id: str
    actual_duration_seconds: int
    distraction_count: int = 0
    distraction_notes: List[str] = Field(default_factory=list)
    reflection: Optional[str] = None
    productivity_rating: Optional[int] = 5

class FocusSessionResponse(BaseModel):
    id: str
    subject: str
    target_duration_minutes: int
    actual_duration_seconds: int
    distraction_count: int
    study_goals: Optional[str] = None
    distraction_notes: List[str] = Field(default_factory=list)
    reflection: Optional[str] = None
    productivity_rating: Optional[int] = None
    started_at: str
    ended_at: Optional[str] = None

class WellnessLogCreate(BaseModel):
    log_date: str
    bedtime: str
    wake_time: str
    sleep_duration_hours: float
    energy_level: int
    study_readiness: int
    notes: Optional[str] = None

class WellnessLogResponse(WellnessLogCreate):
    id: str
    created_at: str

class FocusDashboardResponse(BaseModel):
    total_sessions_count: int
    total_study_minutes: int
    average_focus_rating: float
    total_distractions_avoided: int
    recent_sessions: List[FocusSessionResponse]
    recent_wellness_logs: List[WellnessLogResponse]
    wellness_advice: List[str]
