"""
Security Regression Test Suite
Verifies authorization barriers, parent-child linking integrity, RBAC enforcement,
path traversal guards, empty upload rejection, and JWT verification.
"""
import pytest
import io
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token, Role


@pytest.fixture
def client():
    return TestClient(app)


def test_jwt_valid_authentication(client):
    """Test that a valid JWT bearer token authenticates successfully"""
    token = create_access_token({"sub": "student_alice", "role": Role.STUDENT.value})
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/parent/code", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "student_alice"
    assert "link_code" in data


def test_jwt_tampered_token_rejected(client):
    """Test that a forged/tampered JWT token is rejected with 401 Unauthorized"""
    headers = {"Authorization": "Bearer forged.invalid.token"}
    response = client.get("/api/v1/parent/code", headers=headers)
    assert response.status_code == 401


def test_invalid_parent_link_code_rejected(client):
    """VULN-02 Regression: Invalid link code must return 404, NOT auto-link"""
    payload = {
        "parent_name": "Intruder Parent",
        "parent_email": "intruder@malicious.com",
        "link_code": "INVALID-CODE-999"
    }
    response = client.post("/api/v1/parent/link", json=payload)
    assert response.status_code == 404
    assert "Invalid or unassigned link code" in response.json()["detail"]


def test_unauthorized_parent_cannot_access_unlinked_student_dashboard(client):
    """VULN-01 Regression: Unlinked guardian account cannot view student dashboard"""
    # Parent token for parent_bob
    parent_token = create_access_token({"sub": "parent_bob", "role": Role.PARENT.value})
    headers = {"Authorization": f"Bearer {parent_token}"}
    
    # Attempt to view student_charlie's private analytics
    response = client.get("/api/v1/parent/dashboard?student_id=student_charlie", headers=headers)
    assert response.status_code == 403
    assert "does not have active authorized access" in response.json()["detail"]


def test_valid_parent_link_and_dashboard_flow(client):
    """End-to-end positive security flow for parent link code and dashboard"""
    # 1. Student generates link code
    student_token = create_access_token({"sub": "student_dan", "role": Role.STUDENT.value})
    code_res = client.get("/api/v1/parent/code", headers={"Authorization": f"Bearer {student_token}"})
    assert code_res.status_code == 200
    link_code = code_res.json()["link_code"]

    # 2. Parent successfully links account
    link_res = client.post("/api/v1/parent/link", json={
        "parent_name": "Dan Parent",
        "parent_email": "parent_dan@family.com",
        "link_code": link_code
    })
    assert link_res.status_code == 200
    linked_data = link_res.json()
    assert linked_data["student_id"] == "student_dan"
    assert linked_data["status"] == "active"


def test_student_cannot_create_institutional_classroom(client):
    """VULN-03 Regression: Student role is blocked from teacher classroom creation"""
    student_token = create_access_token({"sub": "student_eva", "role": Role.STUDENT.value})
    headers = {"Authorization": f"Bearer {student_token}"}
    payload = {
        "name": "Malicious Classroom",
        "subject": "Physics",
        "teacher_name": "Fake Teacher"
    }
    response = client.post("/api/v1/institution/classrooms", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_teacher_can_create_institutional_classroom(client):
    """Teacher role is authorized to create classroom"""
    teacher_token = create_access_token({"sub": "teacher_frank", "role": Role.TEACHER.value})
    headers = {"Authorization": f"Bearer {teacher_token}"}
    payload = {
        "name": "Advanced Quantum Engineering",
        "subject": "Physics",
        "teacher_name": "Prof. Frank"
    }
    response = client.post("/api/v1/institution/classrooms", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Advanced Quantum Engineering"
    assert "class_code" in data


def test_empty_document_upload_rejected(client):
    """VULN-05 Regression: Empty (0-byte) file upload must be rejected with 400"""
    file_content = io.BytesIO(b"")
    files = {"file": ("empty.txt", file_content, "text/plain")}
    response = client.post("/documents/upload", files=files)
    assert response.status_code == 400
    assert "Empty file uploaded" in response.json()["detail"]


def test_document_deletion_path_traversal_rejected(client):
    """VULN-04 Regression: Path traversal characters in document ID must be rejected with 400"""
    response = client.delete("/documents/..malicious_id")
    assert response.status_code == 400
    assert "Invalid document ID format" in response.json()["detail"]
