"""
End-to-End Live Automated Verification Suite for GuruCortex 2.0
Executes against the live application and SQLite database without external mock requirements.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token, Role


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_visual_reality_stream_endpoint(client):
    res = client.post("/api/v1/visual/reality/stream", json={"concept": "Semiconductor Physics", "depth": "advanced"})
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]
    assert "data: " in res.text
    assert "data: [DONE]" in res.text


def test_visual_reality_connection_endpoint(client):
    res = client.post("/api/v1/visual/reality/Semiconductor%20Physics")
    assert res.status_code == 200
    data = res.json()
    assert data["topic_name"] == "Semiconductor Physics"
    assert "industries" in data
    assert len(data.get("industries", [])) > 0


def test_revision_dashboard_and_due_flashcards(client):
    res = client.get("/api/v1/revision/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "due_flashcards_count" in data
    assert "exam_countdowns" in data

    due_res = client.get("/api/v1/revision/flashcards/due")
    assert due_res.status_code == 200
    assert isinstance(due_res.json(), list)


def test_coach_recommendations_and_identity(client):
    recs_res = client.get("/api/v1/coach/recommendations?student_id=student_live_test")
    assert recs_res.status_code == 200
    recs = recs_res.json()
    assert len(recs) > 0
    assert "strategy_name" in recs[0]

    ident_res = client.get("/api/v1/coach/identity?student_id=student_live_test")
    assert ident_res.status_code == 200
    identity = ident_res.json()
    assert identity["student_id"] == "student_live_test"
    assert "acquired_skills" in identity
    assert "overall_progress_score" in identity


def test_coach_streaming_advice(client):
    res = client.post("/api/v1/coach/stream", json={
        "student_id": "student_live_test",
        "query": "How can I improve my recall on semiconductor circuit diagrams?"
    })
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]
    assert "data: " in res.text
    assert "data: [DONE]" in res.text


def test_student_project_creation_and_persistence(client):
    project_payload = {
        "title": "Quantum Hall Effect Simulator",
        "subject": "Physics",
        "description": "Built interactive Python simulation of discrete Landau levels.",
        "skills_demonstrated": ["Python", "Physics", "Differential Equations"]
    }
    res = client.post("/api/v1/coach/projects?student_id=student_live_test", json=project_payload)
    assert res.status_code == 200
    created = res.json()
    assert created["title"] == project_payload["title"]
    assert created["student_id"] == "student_live_test"


def test_career_pathways_retrieval(client):
    res = client.get("/api/v1/career/pathways/electronics")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "title" in data[0]
    assert len(data[0].get("technical_skills", [])) > 0


def test_focus_dashboard_and_session_logging(client):
    res = client.get("/api/v1/focus/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "total_sessions_count" in data
    assert "total_study_minutes" in data

    start_res = client.post("/api/v1/focus/session/start", json={
        "subject": "Quantum Mechanics",
        "target_duration_minutes": 25,
        "study_goals": "Master potential well calculations"
    })
    assert start_res.status_code == 200
    started = start_res.json()
    assert started["subject"] == "Quantum Mechanics"
    assert "id" in started


def test_parent_portal_flow(client):
    # 1. Student generates link code
    student_token = create_access_token({"sub": "student_portal_flow", "role": Role.STUDENT.value})
    code_res = client.get("/api/v1/parent/code", headers={"Authorization": f"Bearer {student_token}"})
    assert code_res.status_code == 200
    link_code = code_res.json()["link_code"]

    # 2. Parent links account
    link_res = client.post("/api/v1/parent/link", json={
        "parent_name": "Sarah Parent",
        "parent_email": "sarah.parent.portal@gurucortex.edu",
        "link_code": link_code
    })
    assert link_res.status_code == 200
    parent_id = link_res.json()["id"]

    # 3. View Dashboard as linked parent
    parent_token = create_access_token({"sub": parent_id, "role": Role.PARENT.value})
    dash_res = client.get(
        "/api/v1/parent/dashboard?student_id=student_portal_flow",
        headers={"Authorization": f"Bearer {parent_token}"}
    )
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "student_name" in dash_data
    assert "subjects_studied" in dash_data


def test_institution_dashboard_and_classroom_creation(client):
    dash_res = client.get("/api/v1/institution/dashboard")
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert "total_classrooms" in data

    teacher_token = create_access_token({"sub": "teacher_id_101", "role": Role.TEACHER.value})
    create_res = client.post("/api/v1/institution/classrooms", json={
        "name": "Electromagnetism 201",
        "subject": "Physics",
        "teacher_name": "Prof. Maxwell"
    }, headers={"Authorization": f"Bearer {teacher_token}"})
    assert create_res.status_code == 200
    assert create_res.json()["name"] == "Electromagnetism 201"
