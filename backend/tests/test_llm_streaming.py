import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm_client import LLMClient


@pytest.mark.asyncio
async def test_llm_client_stream_generate():
    """Verify default streaming behavior (with cognitive fallback if offline)."""
    client = LLMClient()
    tokens = []
    async for token in client.stream_generate(prompt="Explain Newton's third law"):
        tokens.append(token)
    full_text = "".join(tokens)
    assert len(tokens) > 0
    assert len(full_text.strip()) > 10


@pytest.mark.asyncio
async def test_stream_generate_groq_sse_parsing():
    """Verify Groq SSE streaming parser correctly decodes data: {...} events."""
    client = LLMClient()
    client.provider = "groq"
    client.groq_api_key = "gsk_test_valid_key_12345"

    sse_lines = [
        'data: {"choices": [{"delta": {"content": "For Every action,"}}]}',
        "",
        'data: {"choices": [{"delta": {"content": " there is an equal"}}]}',
        'data: {"choices": [{"delta": {"content": " and opposite reaction."}}]}',
        "data: [DONE]",
    ]

    async def mock_aiter_lines():
        for line in sse_lines:
            yield line

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.aiter_lines = mock_aiter_lines

    # Mock client.stream context manager
    mock_stream_ctx = AsyncMock()
    mock_stream_ctx.__aenter__.return_value = mock_response

    mock_http_client = MagicMock()
    mock_http_client.stream.return_value = mock_stream_ctx
    mock_client_ctx = AsyncMock()
    mock_client_ctx.__aenter__.return_value = mock_http_client

    with patch("httpx.AsyncClient", return_value=mock_client_ctx):
        tokens = []
        async for token in client.stream_generate(prompt="Explain Newton's third law"):
            tokens.append(token)

        assert len(tokens) == 3
        full_text = "".join(tokens)
        assert full_text == "For Every action, there is an equal and opposite reaction."


@pytest.mark.asyncio
async def test_stream_generate_ollama_parsing():
    """Verify Ollama streaming parser when Groq is not configured."""
    client = LLMClient()
    client.provider = "ollama"
    client.groq_api_key = ""

    ollama_lines = [
        '{"response": "Newton\'s ", "done": false}',
        '{"response": "Third Law ", "done": false}',
        '{"response": "States...", "done": true}',
    ]

    async def mock_aiter_lines():
        for line in ollama_lines:
            yield line

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.aiter_lines = mock_aiter_lines

    mock_stream_ctx = AsyncMock()
    mock_stream_ctx.__aenter__.return_value = mock_response

    mock_http_client = MagicMock()
    mock_http_client.stream.return_value = mock_stream_ctx
    mock_client_ctx = AsyncMock()
    mock_client_ctx.__aenter__.return_value = mock_http_client

    with patch("httpx.AsyncClient", return_value=mock_client_ctx):
        tokens = []
        async for token in client.stream_generate(prompt="Explain Newton's third law"):
            tokens.append(token)

        assert len(tokens) == 3
        assert "".join(tokens) == "Newton's Third Law States..."


@pytest.mark.asyncio
async def test_stream_generate_cognitive_fallback_on_failure():
    """Verify fallback to cognitive response generator when both providers fail."""
    client = LLMClient()
    client.provider = "groq"
    client.groq_api_key = "gsk_dummy_key"

    # Simulate network failure on any httpx call
    with patch("httpx.AsyncClient.stream", side_effect=Exception("Connection failed")):
        tokens = []
        async for token in client.stream_generate(prompt="Explain thermodynamics"):
            tokens.append(token)

        full_text = "".join(tokens)
        assert len(tokens) > 0
        assert "thermodynamics" in full_text
        assert len(full_text.strip()) > 50
