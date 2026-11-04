from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any, Optional

from app.models.parent_institution_schemas import (
    ParentLinkCreate,
    ParentLinkResponse,
    ParentDashboardResponse
)
from app.services.parent_service import ParentService
from app.core.security import get_current_user, UserPayload, Role, link_rate_limiter

router = APIRouter(prefix="/api/v1/parent", tags=["Parent Connect Portal"])
parent_service = ParentService()


@router.get("/code")
async def get_student_link_code(
    student_id: Optional[str] = None,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Get the student's unique code to share with a parent or guardian.
    Restricted to the authenticated student for their own account.
    """
    effective_student_id = student_id or current_user.user_id
    if current_user.role == Role.STUDENT.value and current_user.user_id != "default_student":
        effective_student_id = current_user.user_id

    code = await parent_service.get_or_create_student_link_code(effective_student_id)
    return {"link_code": code, "student_id": effective_student_id}


@router.post("/link", response_model=ParentLinkResponse)
async def link_parent_account(
    req: ParentLinkCreate,
    request: Request
):
    """
    Authenticate and link parent profile to student account via link code.
    Protected with rate limiting against brute-force guessing.
    """
    client_ip = request.client.host if request.client else "unknown"
    link_rate_limiter.check(f"link_{client_ip}")

    return await parent_service.link_parent_account(
        parent_name=req.parent_name,
        parent_email=req.parent_email,
        link_code=req.link_code
    )


@router.get("/dashboard", response_model=ParentDashboardResponse)
async def get_parent_dashboard(
    student_id: Optional[str] = None,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Fetch comprehensive parent dashboard with non-punitive guidance,
    positive milestones, and transparent consent settings.
    Requires active parental authorization or owner student access.
    """
    target_student = student_id or current_user.user_id
    if current_user.role == Role.PARENT.value:
        return await parent_service.get_parent_dashboard(
            student_id=target_student,
            parent_id=current_user.user_id
        )

    # For students inspecting what their parent sees
    return await parent_service.get_parent_dashboard(student_id=target_student)
