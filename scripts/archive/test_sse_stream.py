"""Assert the SSE endpoints keep valid event framing even when tokens contain newlines."""
from fastapi.testclient import TestClient

from app.main import app


def collect(path: str, payload: dict) -> str:
    with TestClient(app) as client:
        with client.stream("POST", path, json=payload) as res:
            assert res.status_code == 200
            assert res.headers["content-type"].startswith("text/event-stream")
            assert res.headers.get("cache-control") == "no-cache"
            return "".join(res.iter_text())


def test_sse_framing() -> None:
    for path, payload in [
        ("/api/v1/visual/reality/stream", {"concept": "PN Junction"}),
        ("/api/v1/coach/stream", {"query": "I forget formulas"}),
    ]:
        text = collect(path, payload)
        assert "data: [DONE]" in text, f"{path} never sent [DONE]"
        for event in text.split("\n\n"):
            if not event:
                continue
            for line in event.split("\n"):
                assert line.startswith("data: "), f"{path} bad SSE line: {line!r}"


if __name__ == "__main__":
    test_sse_framing()
    print("SSE framing OK")
