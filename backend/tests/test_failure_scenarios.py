"""
Failure Scenario Tests
Verifies graceful degradation when LLM services timeout or are unavailable,
rejection of malformed requests, and appropriate error handling.
"""
import pytest
from unittest.mock import patch, AsyncMock
import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.services.llm_client import LLMClient


@pytest.fixture
def client():
    return TestClient(app)


def test_malformed_json_request_rejected(client):
    """Sending invalid JSON payload returns 422 Unprocessable Entity"""
    response = client.post(
        "/api/v1/visual/reality/stream",
        content="This is not JSON",
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422


def test_missing_required_fields_rejected(client):
    """Missing required fields in request body returns 422 with descriptive error"""
    response = client.post("/api/v1/coach/stream", json={"student_id": "alice"})
    # 'query' is required
    assert response.status_code == 422
    assert "query" in response.text


def test_unsupported_document_extension_rejected(client):
    """Uploading an executable or unsupported file extension returns 400"""
    files = {"file": ("malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")}
    response = client.post("/documents/upload", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_llm_client_handles_network_timeout():
    """When remote LLM network times out, stream_generate falls back gracefully to cognitive generator"""
    client = LLMClient()
    
    with patch("httpx.AsyncClient.stream", side_effect=httpx.ConnectTimeout("Network unreachable")):
        tokens = []
        async for token in client.stream_generate(prompt="Explain semiconductor bandgaps"):
            tokens.append(token)
            
        full_text = "".join(tokens)
        assert len(tokens) > 0
        assert "physical equilibrium" in full_text or len(full_text) > 20


@pytest.mark.asyncio
async def test_llm_client_handles_http_500_error():
    """When remote LLM provider raises an error, generate returns a message without crashing"""
    client = LLMClient()
    
    with patch.object(client, "_call_groq", side_effect=Exception("Internal Server Error")):
        result = await client.generate(prompt="Test prompt")
        assert result is not None
        assert len(result) > 0


def test_nonexistent_flashcard_review_404(client):
    """Reviewing a non-existent flashcard returns 404 cleanly"""
    response = client.post("/api/v1/revision/flashcards/nonexistent-card-id-12345/review", json={"grade": 5})
    assert response.status_code == 404
