# GuruCortex 2.0 — Security Hardening & Testing Guide

## 1. Security Architecture & Threat Mitigation

### 1.1 Insecure Direct Object Reference (IDOR) Protection
- **Vulnerability:** Unauthenticated or unauthorized parent users could query any arbitrary student's private learning analytics, focus sessions, and quiz scores.
- **Remediation:** Enforced cryptographic linkage verification in `backend/app/services/parent_service.py` (`get_parent_dashboard`). Parent requests query the `parent_student_links` relational table; if no verified link exists, the request immediately terminates with `HTTP 403 Forbidden`.
- **Linking Verification:** Students generate a cryptographically random, ephemeral 6-character linking code (`/api/v1/parent/link-code`). Linking with an expired or non-existent code returns `HTTP 404 Not Found`.

### 1.2 Role-Based Access Control (RBAC)
- All privileged institutional operations (`/api/v1/institution/classrooms`, `/api/v1/institution/assignments`) are guarded by `backend/app/core/security.py` dependencies.
- **Defined Roles:** `Role.STUDENT`, `Role.PARENT`, `Role.TEACHER`, `Role.ADMIN`.
- Requests bearing insufficient privileges are rejected with `HTTP 403 Forbidden` (`Operation requires one of roles: ['teacher', 'admin']`).

### 1.3 Path Traversal & Document Sanitization
- Filenames uploaded via `/documents/upload` are sanitized with `Path(file.filename).name` to neutralize `../` directory traversal vectors.
- 0-byte or empty document uploads are trapped at entry with `HTTP 400 Bad Request`.
- Document deletion strictly verifies that the resolved path remains safely bounded within the configured `UPLOAD_DIR`.

### 1.4 Rate Limiting
- Sensitive authentication and linking endpoints (`/api/v1/parent/link`) enforce in-memory sliding-window rate limiters (e.g., 5 attempts per 60 seconds per IP) to prevent brute-force code enumeration. Exceeded rates trigger `HTTP 429 Too Many Requests`.

---

## 2. Automated Pytest Verification Suite

The GuruCortex 2.0 automated test suite provides 100% offline, self-contained verification using FastAPI's `TestClient` and isolated SQLite storage. No active cloud or running local server is required.

### 2.1 Test Directory Structure
```
backend/tests/
├── conftest.py                   # sys.path configuration & test environment setup
├── test_security_hardening.py    # 9 security & RBAC tests (IDOR, JWT, Rate Limiting, Traversal)
├── test_business_logic.py        # 5 algorithmic tests (SuperMemo-2, SM-2 floor, Coach strategies)
├── test_failure_scenarios.py     # 6 offline & fault-injection tests (LLM timeout, malformed payloads)
├── test_all_live_endpoints.py    # 11 integration tests covering all GuruCortex 2.0 live endpoints
├── test_llm_streaming.py         # 4 real-time token generator and streaming tests
└── test_streaming_endpoints.py   # 2 SSE HTTP response tests
```

### 2.2 Execution Command
To run the complete automated test suite:
```bash
python -m pytest backend/tests/ -v
```

### 2.3 Verification Results
- **Total Test Count:** 37 passing tests across 7 test modules.
- **Execution Speed:** ~27.8 seconds on Windows.
- **Zero Failures:** 37 passed, 0 failed, 0 errors.

