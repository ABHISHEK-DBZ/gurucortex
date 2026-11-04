import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app

def test_visual_reality_streaming_endpoint():
    client = TestClient(app)
    response = client.post("/api/v1/visual/reality/stream", json={"concept": "Quantum Tunneling", "depth": "advanced"})
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    assert "data: " in response.text
    assert "data: [DONE]" in response.text

def test_coach_streaming_endpoint():
    client = TestClient(app)
    response = client.post("/api/v1/coach/stream", json={"student_id": "test_user", "query": "How do I overcome procrastination?"})
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    assert "data: " in response.text
    assert "data: [DONE]" in response.text
