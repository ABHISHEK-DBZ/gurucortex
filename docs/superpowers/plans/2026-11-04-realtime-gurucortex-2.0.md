# GuruCortex 2.0 Real-Time & Live Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement true real-time Server-Sent Events (SSE) token streaming, live persistent SQLite database transactions, responsive streaming UI components, and a comprehensive automated test suite for GuruCortex 2.0.

**Architecture:** Extend `LLMClient` with `stream_generate` to stream tokens from Groq/Ollama with cognitive fallback. Expose FastAPI SSE endpoints in `visual_intelligence` and `coach` routers. Equip `api-client.ts` with SSE frame stream decoders, wire streaming state into `ConceptRealityNavigator` and `CognitiveCoach`, and build an end-to-end `pytest` verification suite across all 11 live endpoints.

**Tech Stack:** FastAPI, Python 3.10+, aiosqlite, httpx, pytest, Next.js 14, React 18, TypeScript, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-04-realtime-gurucortex-design.md`

## Global Constraints
- Preserve existing database schema definitions in `backend/app/services/database.py` without breaking column name changes.
- Streaming responses must use standard W3C SSE media type `text/event-stream` with `data: <token>\n\n` frames and `data: [DONE]\n\n` termination.
- All tests must pass in offline / credential-free environments using the cognitive fallback generator.
- Next.js production build (`npm run build`) must pass with zero TypeScript or linting errors.

## Review Focus
- Groq / Ollama stream interruption or network drop falls back gracefully to cognitive token generator without crashing the HTTP connection.
- SSE chunks containing partial UTF-8 sequences are decoded safely via `TextDecoder({ stream: true })`.
- Frontend stream reader handles unexpected disconnection or stream termination cleanly.
- Database records for flashcards, coach recommendations, and student projects persist across test client runs in SQLite.
- Concurrent requests to `/api/v1/visual/reality/stream` do not deadlock `aiosqlite` or `LLMClient`.

---

### Task 1: Server-Sent Events (SSE) Streaming in `LLMClient`

**Files:**
- Modify: `backend/app/services/llm_client.py`
- Test: `backend/tests/test_llm_streaming.py`

**Interfaces:**
- Produces: `async def stream_generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.4, max_tokens: int = 1500) -> AsyncGenerator[str, None]`

- [ ] **Step 1: Write the failing test for `stream_generate`**

Create `backend/tests/test_llm_streaming.py`:
```python
import pytest
from app.services.llm_client import LLMClient

@pytest.mark.asyncio
async def test_llm_client_stream_generate():
    client = LLMClient()
    tokens = []
    async for token in client.stream_generate(prompt="Explain Newton's third law"):
        tokens.append(token)
    full_text = "".join(tokens)
    assert len(tokens) > 0
    assert len(full_text.strip()) > 10
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_llm_streaming.py -v`  
Expected: FAIL (AttributeError: 'LLMClient' object has no attribute 'stream_generate')

- [ ] **Step 3: Implement `stream_generate` in `backend/app/services/llm_client.py`**

Add `stream_generate` yielding tokens from Groq (`stream=True`), Ollama (`stream=True`), or the cognitive fallback token generator with realistic async pauses.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_llm_streaming.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/llm_client.py backend/tests/test_llm_streaming.py
git commit -m "feat(backend): add stream_generate to LLMClient with Groq and cognitive fallback"
```

---

### Task 2: Real-Time SSE Endpoints in Visual & Coach Routers

**Files:**
- Modify: `backend/app/routers/visual_intelligence.py`
- Modify: `backend/app/routers/coach.py`
- Test: `backend/tests/test_streaming_endpoints.py`

**Interfaces:**
- Consumes: `LLMClient.stream_generate`
- Produces:
  - `POST /api/v1/visual/reality/stream`: returns `StreamingResponse` (media_type: `text/event-stream`)
  - `POST /api/v1/coach/stream`: returns `StreamingResponse` (media_type: `text/event-stream`)

- [ ] **Step 1: Write the failing test for SSE endpoints**

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

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_streaming_endpoints.py -v`  
Expected: FAIL (404 or 405 Method Not Allowed)

- [ ] **Step 3: Implement streaming endpoints in routers**

In `backend/app/routers/visual_intelligence.py`:
Add `POST /reality/stream` generating `data: <token>\n\n` SSE events using `StreamingResponse`.

In `backend/app/routers/coach.py`:
Add `POST /stream` generating `data: <token>\n\n` SSE events using `StreamingResponse`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_streaming_endpoints.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/visual_intelligence.py backend/app/routers/coach.py backend/tests/test_streaming_endpoints.py
git commit -m "feat(backend): add POST /reality/stream and POST /coach/stream SSE endpoints"
```

---

### Task 3: Frontend Real-Time Stream Consumer in API Client

**Files:**
- Modify: `frontend/lib/api-client.ts`

**Interfaces:**
- Produces:
  - `streamRealityExplanation(concept: string, onToken: (token: string) => void): Promise<void>`
  - `streamCoachAdvice(query: string, onToken: (token: string) => void): Promise<void>`

- [ ] **Step 1: Implement `streamRealityExplanation` and `streamCoachAdvice` in `frontend/lib/api-client.ts`**

Add SSE stream reader logic to `ApiClient`:
```typescript
async streamRealityExplanation(concept: string, onToken: (token: string) => void): Promise<void> {
  const response = await fetch(`${this.baseUrl}/api/v1/visual/reality/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, depth: 'comprehensive' }),
  });
  if (!response.ok || !response.body) throw new Error(`Streaming failed: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6).trim();
      if (data === '[DONE]') return;
      onToken(data);
    }
  }
}
```
Add similar implementation for `streamCoachAdvice(query: string, onToken: (token: string) => void)`.

- [ ] **Step 2: Typecheck frontend**

Run: `npm --prefix frontend run build`  
Expected: PASS with 0 type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api-client.ts
git commit -m "feat(frontend): add streamRealityExplanation and streamCoachAdvice to api-client"
```

---

### Task 4: Interactive Streaming UI in Reality Navigator & Cognitive Coach

**Files:**
- Modify: `frontend/components/ConceptRealityNavigator.tsx`
- Modify: `frontend/components/CognitiveCoach.tsx`

**Interfaces:**
- Consumes: `api.streamRealityExplanation`, `api.streamCoachAdvice`

- [ ] **Step 1: Wire real-time streaming in `ConceptRealityNavigator.tsx`**

When generating a reality breakdown, concurrently stream live text directly into the primary "Physical Mechanism & Intuitive Breakdown" console so tokens appear word-by-word with live typewriter animation.

- [ ] **Step 2: Wire interactive "Ask Cognitive Coach" in `CognitiveCoach.tsx`**

Add an input bar at the top of the Coach tab allowing the student to ask a learning strategy question. When submitted, stream the advice live into an active "Live Cognitive Coach Advice" stream card.

- [ ] **Step 3: Run Next.js production build to verify full compilation**

Run: `npm --prefix frontend run build`  
Expected: PASS (Exit code 0, 0 build errors)

- [ ] **Step 4: Commit**

```bash
git add frontend/components/ConceptRealityNavigator.tsx frontend/components/CognitiveCoach.tsx
git commit -m "feat(frontend): wire real-time streaming into ConceptRealityNavigator and CognitiveCoach"
```

---

### Task 5: End-to-End Live Automated Verification Suite

**Files:**
- Create: `backend/tests/test_realtime_api.py`

**Interfaces:**
- Tests all 11 live endpoints:
  1. `GET /api/v1/health`
  2. `POST /api/v1/visual/reality/{concept}`
  3. `POST /api/v1/visual/reality/stream`
  4. `GET /api/v1/revision/dashboard`
  5. `GET /api/v1/revision/flashcards/due`
  6. `POST /api/v1/revision/flashcards/{id}/review`
  7. `GET /api/v1/coach/recommendations`
  8. `POST /api/v1/coach/stream`
  9. `GET /api/v1/coach/identity`
  10. `POST /api/v1/coach/projects`
  11. `GET /api/v1/career/pathways/{domain}`
  12. `GET /api/v1/focus/dashboard`
  13. `GET /api/v1/parent/code`
  14. `GET /api/v1/parent/dashboard`
  15. `GET /api/v1/institution/dashboard`

- [ ] **Step 1: Write `backend/tests/test_realtime_api.py`**

Create comprehensive test suite validating status codes, response shapes, database persistence, and streaming data frames.

- [ ] **Step 2: Execute pytest against backend test suite**

Run: `python -m pytest backend/tests/test_realtime_api.py -v`  
Expected: ALL TESTS PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_realtime_api.py
git commit -m "test(backend): add comprehensive live verification suite covering all endpoints and streaming"
```

---

### Task 6: Repository Cleanup & Documentation Updates

**Files:**
- Delete: `backend/add_streaming_to_llm.py`
- Delete: `backend/update_main.py`
- Delete: `frontend/update_api_client.py`
- Modify: `backend/app/main.py` (clean imports without broad blanket exception masking)
- Modify: `docs/README.md` (document real-time streaming and 2.0 endpoints)

- [ ] **Step 1: Remove temporary mutation scripts**

Delete `backend/add_streaming_to_llm.py`, `backend/update_main.py`, and `frontend/update_api_client.py`.

- [ ] **Step 2: Clean `backend/app/main.py` router loading**

Replace the blanket exception with explicit, logged router inclusions.

- [ ] **Step 3: Run full backend tests and frontend build**

Run:
```bash
python -m pytest backend/tests/ -v
npm --prefix frontend run build
```
Expected: All backend tests PASS, Next.js build PASS.

- [ ] **Step 4: Update Documentation**

Update documentation with the real-time endpoints and verification guide.

- [ ] **Step 5: Final Commit**

```bash
git add backend/app/main.py docs/ README.md
git commit -m "chore: clean root scripts, tighten router registration, and update documentation"
```

