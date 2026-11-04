from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

from app.models.career_focus_schemas import (
    CareerPathway,
    SkillGapAnalysis,
    CareerRoadmapResponse
)
from app.services.career_engine import CareerEngine

router = APIRouter(prefix="/api/v1/career", tags=["FuturePath Career & Skills Guidance"])
career_engine = CareerEngine()

@router.get("/pathways/{subject}", response_model=List[CareerPathway])
async def get_career_pathways(subject: str = "electronics"):
    """
    Discover high-impact career pathways mapped to academic subject interests.
    """
    return await career_engine.get_pathways_for_subject(subject)

@router.get("/gap-analysis", response_model=SkillGapAnalysis)
async def analyze_skill_gap(pathway_title: str, student_id: str = "default_student"):
    """
    Perform deep technical skill gap analysis comparing demonstrated student skills with industry standards.
    """
    return await career_engine.analyze_skill_gap(pathway_title, student_id)

@router.post("/roadmap", response_model=CareerRoadmapResponse)
async def generate_career_roadmap(pathway_title: str, student_id: str = "default_student"):
    """
    Generate a personalized, multi-stage project milestone roadmap for the selected career pathway.
    """
    return await career_engine.generate_career_roadmap(pathway_title, student_id)
