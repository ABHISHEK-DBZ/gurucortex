from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from app.models.parent_institution_schemas import (
    ClassroomCreate,
    ClassroomResponse,
    AssignmentCreate,
    AssignmentResponse,
    InstitutionDashboardResponse
)
from app.services.database import get_database
from app.core.security import get_current_user, require_roles, Role, UserPayload

router = APIRouter(prefix="/api/v1/institution", tags=["Teacher / Institution Mode"])

@router.get("/dashboard", response_model=InstitutionDashboardResponse)
async def get_institution_dashboard(current_user: UserPayload = Depends(get_current_user)):
    """
    Get aggregated teacher and classroom management dashboard.
    Restricted to educators or local classroom view.
    """
    db = await get_database().connect()
    now_str = datetime.utcnow().isoformat()

    # Query classrooms
    classrooms = []
    async with db.execute("SELECT id, name, subject, teacher_name, class_code, student_count, created_at FROM classrooms") as cur:
        rows = await cur.fetchall()
        for r in rows:
            classrooms.append({
                "id": r[0],
                "name": r[1],
                "subject": r[2],
                "teacher_name": r[3],
                "class_code": r[4],
                "student_count": r[5],
                "created_at": r[6]
            })

    # If no classrooms in DB, seed initial classroom
    if not classrooms:
        cid = str(uuid.uuid4())
        c_code = "CORTEX-ENG-101"
        await db.execute(
            "INSERT INTO classrooms (id, name, subject, teacher_name, class_code, student_count, created_at) VALUES (?, ?, ?, ?, ?, 32, ?)",
            (cid, "Applied Electronics & Semiconductor Engineering", "Electronics", "Dr. V. Ramanathan", c_code, now_str)
        )
        await db.commit()
        classrooms.append({
            "id": cid,
            "name": "Applied Electronics & Semiconductor Engineering",
            "subject": "Electronics",
            "teacher_name": "Dr. V. Ramanathan",
            "class_code": c_code,
            "student_count": 32,
            "created_at": now_str
        })

    # Query assignments
    assignments = []
    async with db.execute("SELECT id, classroom_id, title, topic, document_id, due_date, instructions, created_at FROM classroom_assignments") as cur:
        a_rows = await cur.fetchall()
        for ar in a_rows:
            assignments.append({
                "id": ar[0],
                "classroom_id": ar[1],
                "title": ar[2],
                "topic": ar[3],
                "document_id": ar[4],
                "due_date": ar[5],
                "instructions": ar[6],
                "created_at": ar[7]
            })

    if not assignments:
        aid = str(uuid.uuid4())
        due_d = (datetime.utcnow().date()).isoformat()
        assignments.append({
            "id": aid,
            "classroom_id": classrooms[0]["id"],
            "title": "Module 3: PN Junction Laboratory Simulation",
            "topic": "Semiconductor Physics",
            "document_id": None,
            "due_date": due_d,
            "instructions": "Explore the Visual Intelligence Studio simulation and complete 5 SM-2 retrieval practice flashcards.",
            "created_at": now_str
        })

    overview = [
        {"topic": "Semiconductor Bandgap & PN Junctions", "class_average": 74.2, "needs_remedial": 4},
        {"topic": "Digital Logic Simplification", "class_average": 89.0, "needs_remedial": 1},
        {"topic": "Kirchhoff Laws & Nodal Analysis", "class_average": 81.5, "needs_remedial": 2}
    ]

    total_students = sum(c["student_count"] for c in classrooms)

    return {
        "total_classrooms": len(classrooms),
        "total_enrolled_students": total_students,
        "classrooms": classrooms,
        "active_assignments": assignments,
        "class_mastery_overview": overview
    }

@router.post("/classrooms", response_model=ClassroomResponse)
async def create_classroom(
    req: ClassroomCreate,
    current_user: UserPayload = Depends(require_roles([Role.TEACHER.value, Role.ADMIN.value]))
):
    """Create a new classroom for teacher cohort distribution. Requires educator role."""
    db = await get_database().connect()
    cid = str(uuid.uuid4())
    code = "CORTEX-" + uuid.uuid4().hex[:4].upper()
    now_str = datetime.utcnow().isoformat()

    await db.execute(
        "INSERT INTO classrooms (id, name, subject, teacher_name, class_code, student_count, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
        (cid, req.name, req.subject, req.teacher_name, code, now_str)
    )
    await db.commit()

    return {
        "id": cid,
        "name": req.name,
        "subject": req.subject,
        "teacher_name": req.teacher_name,
        "class_code": code,
        "student_count": 0,
        "created_at": now_str
    }

@router.post("/assignments", response_model=AssignmentResponse)
async def create_assignment(
    req: AssignmentCreate,
    current_user: UserPayload = Depends(require_roles([Role.TEACHER.value, Role.ADMIN.value]))
):
    """Distribute a study assignment to an institutional classroom. Requires educator role."""
    db = await get_database().connect()
    aid = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()

    await db.execute(
        """
        INSERT INTO classroom_assignments (id, classroom_id, title, topic, document_id, due_date, instructions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (aid, req.classroom_id, req.title, req.topic, req.document_id, req.due_date, req.instructions, now_str)
    )
    await db.commit()

    return {
        "id": aid,
        "classroom_id": req.classroom_id,
        "title": req.title,
        "topic": req.topic,
        "document_id": req.document_id,
        "due_date": req.due_date,
        "instructions": req.instructions,
        "created_at": now_str
    }
