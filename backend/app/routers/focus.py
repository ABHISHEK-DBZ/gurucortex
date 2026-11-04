from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

from app.models.career_focus_schemas import (
    FocusSessionStart,
    FocusSessionEnd,
    FocusSessionResponse,
    WellnessLogCreate,
    WellnessLogResponse,
    FocusDashboardResponse
)
from app.services.focus_service import FocusService

router = APIRouter(prefix="/api/v1/focus", tags=["Focus Intelligence & Study Companion"])
focus_service = FocusService()

@router.get("/dashboard", response_model=FocusDashboardResponse)
async def get_focus_dashboard():
    """
    Get aggregated focus sessions, distraction statistics, and wellness logs.
    """
    return await focus_service.get_focus_dashboard()

@router.post("/session/start")
async def start_focus_session(req: FocusSessionStart):
    """
    Start a new Pomodoro/custom focus study session.
    """
    return await focus_service.start_session(
        subject=req.subject,
        target_duration_mins=req.target_duration_minutes,
        study_goals=req.study_goals
    )

@router.post("/session/end")
async def end_focus_session(req: FocusSessionEnd):
    """
    End and record the focus session with distraction count, notes, and reflection.
    """
    return await focus_service.end_session(
        session_id=req.session_id,
        actual_duration_seconds=req.actual_duration_seconds,
        distraction_count=req.distraction_count,
        distraction_notes=req.distraction_notes,
        reflection=req.reflection,
        productivity_rating=req.productivity_rating
    )

@router.post("/wellness", response_model=WellnessLogResponse)
async def log_wellness(req: WellnessLogCreate):
    """
    Record daily self-reported sleep and study readiness log.
    """
    return await focus_service.log_wellness(
        log_date=req.log_date,
        bedtime=req.bedtime,
        wake_time=req.wake_time,
        sleep_duration_hours=req.sleep_duration_hours,
        energy_level=req.energy_level,
        study_readiness=req.study_readiness,
        notes=req.notes
    )
