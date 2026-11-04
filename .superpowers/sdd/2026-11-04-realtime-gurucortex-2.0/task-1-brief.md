# Task 1 Brief: Server-Sent Events (SSE) Streaming in LLMClient

## Files
- Modify: `backend/app/services/llm_client.py`
- Test: `backend/tests/test_llm_streaming.py`

## Requirements
Implement `stream_generate` method in `LLMClient`:
```python
async def stream_generate(
    self,
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.4,
    max_tokens: int = 1500
) -> AsyncGenerator[str, None]:
```

It must:
1. Support Groq streaming (`stream=True`) parsing `data: {"choices": [{"delta": {"content": "..."}}]}`.
2. If Groq fails or is not configured, support Ollama streaming (`/api/generate` with `stream=True`).
3. If both fail or when running offline without keys, yield realistic cognitive breakdown tokens from an async cognitive response generator with realistic async pacing (e.g., `asyncio.sleep(0.02)`), so offline tests and environments stream reliably.
4. Yield individual string tokens (`str`).

## Verification Steps
1. Create `backend/tests/test_llm_streaming.py`:
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
2. Run `python -m pytest backend/tests/test_llm_streaming.py -v` and ensure it passes.
3. Commit the changes:
`git add backend/app/services/llm_client.py backend/tests/test_llm_streaming.py`
`git commit -m "feat(backend): add stream_generate to LLMClient with Groq and cognitive fallback"`

