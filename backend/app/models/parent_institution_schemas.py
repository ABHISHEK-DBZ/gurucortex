from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Parent Connect Models
class ParentLinkCreate(BaseModel):
    parent_name: str
    parent_email: str
    link_code: str

class ParentLinkResponse(BaseModel):
    id: str
    parent_name: str
    parent_email: str
    student_id: str
    link_code: str
    status: str
    consent_weekly_summary: bool
    consent_exam_alerts: bool
    consent_missed_session_alerts: bool
    created_at: str

class ParentGuidanceItem(BaseModel):
    id: str
    observation: str
    supporting_evidence: str
    potential_root_cause: str
    suggested_conversation_starter: str
    actionable_assistance: str
    suggested_follow_up: str

class ParentNotificationItem(BaseModel):
    id: str
    notification_type: str
    title: str
    message: str
    is_read: bool
    created_at: str

class ParentDashboardResponse(BaseModel):
    student_name: str
    overall_progress: float
    subjects_studied: List[str]
    completed_topics_count: int
    revision_needed_topics: List[str]
    quiz_average_score: float
    revision_consistency_rate: float
    weekly_study_hours: float
    completed_goals: List[str]
    missed_sessions_count: int
    upcoming_exams: List[Dict[str, Any]]
    positive_achievements: List[str]
    guidance_recommendations: List[ParentGuidanceItem]
    notifications: List[ParentNotificationItem]
    consent_settings: Dict[str, bool]

# Institution / Teacher Mode Models
class ClassroomCreate(BaseModel):
    name: str
    subject: str
    teacher_name: str

class ClassroomResponse(BaseModel):
    id: str
    name: str
    subject: str
    teacher_name: str
    class_code: str
    student_count: int
    created_at: str

class AssignmentCreate(BaseModel):
    classroom_id: str
    title: str
    topic: Optional[str] = None
    document_id: Optional[str] = None
    due_date: str
    instructions: str

class AssignmentResponse(AssignmentCreate):
    id: str
    created_at: str

class InstitutionDashboardResponse(BaseModel):
    total_classrooms: int
    total_enrolled_students: int
    classrooms: List[ClassroomResponse]
    active_assignments: List[AssignmentResponse]
    class_mastery_overview: List[Dict[str, Any]]
