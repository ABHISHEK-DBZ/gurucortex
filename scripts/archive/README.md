# Scripts Archive

This directory stores historical, ad-hoc, and one-off mutation scripts used during earlier development sprints. In accordance with Rule 1 ("Never delete or overwrite code simply because it looks unused"), these files are preserved for provenance, auditability, and historical reference rather than deleted.

## Archived File Manifest

1. **`add_streaming_to_llm.py`**
   - **Original location:** `backend/add_streaming_to_llm.py`
   - **Purpose:** One-off text-injection script used to insert `stream_generate()` into `backend/app/services/llm_client.py`. Superseded by the permanent implementation in `llm_client.py`.

2. **`update_main.py`**
   - **Original location:** `backend/update_main.py`
   - **Purpose:** One-off text-injection script used to inject GuruCortex 2.0 master router inclusions into `backend/app/main.py`. Superseded by the modular, logged router registration system in `backend/app/main.py`.

3. **`update_api_client.py`**
   - **Original location:** `frontend/update_api_client.py`
   - **Purpose:** One-off TypeScript patch script used to append GuruCortex 2.0 REST and SSE streaming methods to `frontend/lib/api-client.ts`. Superseded by the permanent implementation in `api-client.ts`.

4. **`test_all_endpoints.py`**
   - **Original location:** `backend/test_all_endpoints.py`
   - **Purpose:** Ad-hoc manual verification script requiring an active HTTP server on port 8000. Superseded by the automated `pytest` test suite in `backend/tests/test_all_live_endpoints.py`.

5. **`test_db_schema.py`**
   - **Original location:** `backend/test_db_schema.py`
   - **Purpose:** Ad-hoc SQLite schema inspection script. Superseded by `backend/tests/test_business_logic.py` and `backend/tests/test_all_live_endpoints.py`.

6. **`test_sse_stream.py`**
   - **Original location:** `backend/test_sse_stream.py`
   - **Purpose:** Ad-hoc SSE token streaming check. Superseded by `backend/tests/test_all_live_endpoints.py::test_chat_stream_endpoint` and `backend/tests/test_streaming_endpoints.py`.

