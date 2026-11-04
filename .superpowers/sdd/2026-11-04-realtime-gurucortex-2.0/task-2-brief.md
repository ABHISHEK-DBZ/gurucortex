# Task 2 Brief: Real-Time SSE Endpoints in Visual & Coach Routers

## Files
- Modify: `backend/app/routers/visual_intelligence.py`
- Modify: `backend/app/routers/coach.py`
- Test: `backend/tests/test_streaming_endpoints.py`

## Requirements
Implement two real-time Server-Sent Events (SSE) endpoints using FastAPI's `StreamingResponse(media_type="text/event-stream")`:

### 1. `POST /api/v1/visual/reality/stream` in `backend/app/routers/visual_intelligence.py`
- Body: Pydantic model with `concept: str` and `depth: Optional[str] = "comprehensive"` (or dictionary).
- Streams tokens from `LLMClient.stream_generate(prompt=..., system_prompt=...)` wrapped as SSE frames:
  ```python
  async def event_generator():
      async for token in llm_client.stream_generate(prompt, system_prompt):
          yield f"data: {token}\n\n"
      yield "data: [DONE]\n\n"
  return StreamingResponse(event_generator(), media_type="text/event-stream")
  ```

### 2. `POST /api/v1/coach/stream` in `backend/app/routers/coach.py`
- Body: Pydantic model with `student_id: Optional[str] = "default_student"` and `query: str`.
- Streams customized strategy guidance and actionable cognitive advice using `LLMClient.stream_generate()` formatted as SSE frames:
  ```python
  async def event_generator():
      async for token in llm_client.stream_generate(prompt, system_prompt):
          yield f"data: {token}\n\n"
      yield "data: [DONE]\n\n"
  return StreamingResponse(event_generator(), media_type="text/event-stream")
  ```

### 3. Verification & Tests
Create `backend/tests/test_streaming_endpoints.py`:
```python
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
```
Run `python -m pytest backend/tests/test_streaming_endpoints.py -v` and ensure it passes.

### 4. Commit
```bash
git add backend/app/routers/visual_intelligence.py backend/app/routers/coach.py backend/tests/test_streaming_endpoints.py
git commit -m "feat(backend): add POST /reality/stream and POST /coach/stream SSE endpoints"
```

