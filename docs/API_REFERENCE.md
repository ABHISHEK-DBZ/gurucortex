# GuruCortex 2.0 — API Reference

Base URL: `http://localhost:8000` (Local) / `/api/v1`

---

## 1. System & Health

### `GET /api/v1/health`
Checks API operational status.
- **Response `200 OK`**: `{"status": "ok", "message": "API is running"}`

### `GET /health`
System-wide health probe.
- **Response `200 OK`**: `{"status": "healthy", "app": "GuruCortex"}`

---

## 2. Visual Intelligence & Reality Engine

### `POST /api/v1/visual/extract/{document_id}`
Extracts theoretical concepts and structured metadata from an ingested document.

### `GET /api/v1/visual/concepts/{document_id}`
Retrieves extracted concepts for a given document ID.

### `GET /api/v1/visual/explanation/{concept_id}`
Returns visual explanation models including equations, analogies, and Mermaid flowchart models.

### `POST /api/v1/visual/reality/{topic_name}`
Synthesizes real-world industry applications, key engineering components, and ASCII circuit schematics for a topic.

### `GET /api/v1/visual/reality/stream?topic_name={topic_name}`
Real-time Server-Sent Events (SSE) token stream delivering step-by-step cognitive reality grounding.
- **Headers:** `Content-Type: text/event-stream`
- **Output:** `data: {"token": "..."}\n\n` ending with `data: [DONE]\n\n`

---

## 3. Revision Intelligence (SuperMemo-2)

### `GET /api/v1/revision/dashboard`
Returns active flashcard counts, due count, review accuracy, and SM-2 retention curves.

### `GET /api/v1/revision/flashcards/due?limit=20`
Fetches flashcards that are scheduled for review on or before the current timestamp.

### `POST /api/v1/revision/flashcards/generate`
Generates conceptual flashcards based on document text or concept units.
- **Body:** `{"document_id": "...", "concept_id": "...", "count": 5}`

### `POST /api/v1/revision/flashcards/review`
Processes a user recall grade according to the SuperMemo-2 algorithm.
- **Body:** `{"flashcard_id": "...", "grade": 0-5}`
- **Response:** Updated SM-2 state (`ease_factor`, `interval_days`, `next_review`, `repetitions`).

---

## 4. Cognitive Learning Coach

### `GET /api/v1/coach/recommendations?student_id={student_id}`
Retrieves active learning strategies, detected cognitive bottlenecks, and actionable exercises.

### `POST /api/v1/coach/recommendations/{rec_id}/status?status={pending|in_progress|completed}`
Updates the lifecycle status of a coaching recommendation.

### `GET /api/v1/coach/identity?student_id={student_id}`
Fetches the student's persistent growth identity, verified skill ledger, and project portfolio.

### `POST /api/v1/coach/projects?student_id={student_id}`
Registers a student self-directed engineering or research project.

---

## 5. FuturePath Career & Skills Guidance

### `GET /api/v1/career/pathways/{subject}`
Returns industry career pathways, median compensation estimates, and core market competencies for an academic subject.

### `GET /api/v1/career/gap-analysis?pathway_title={pathway}&student_id={student_id}`
Compares student mastery scores against industry requirements to surface concrete skill gaps.

### `POST /api/v1/career/roadmap?pathway_title={pathway}&student_id={student_id}`
Synthesizes a phased, milestone-based career roadmap with estimated time-to-competence.

---

## 6. Focus Intelligence & Wellness

### `GET /api/v1/focus/dashboard`
Returns weekly deep-work duration, average daily focus hours, distraction counts, and focus distribution.

### `POST /api/v1/focus/session`
Logs a completed study session with focus quality metrics.
- **Body:** `{"duration_minutes": 45, "distraction_count": 1, "module_name": "SM-2 Revision", "student_id": "default_student"}`

---

## 7. Parent Connect Portal

### `GET /api/v1/parent/link-code?student_id={student_id}`
Generates an ephemeral 6-character linking code valid for 15 minutes.

### `POST /api/v1/parent/link`
Links a parent profile with a student account using a valid linking code.
- **Rate Limited:** Max 5 linking attempts per minute.
- **Body:** `{"parent_id": "...", "link_code": "..."}`

### `GET /api/v1/parent/dashboard/{student_id}`
Fetches student study time, completed revision cards, and active coach recommendations.
- **Authorization:** Requires parent to be verified and linked to the target `student_id`. Unlinked access is strictly rejected (`403 Forbidden`).

---

## 8. Institution & Teacher Mode

### `GET /api/v1/institution/dashboard?institution_id={id}`
Returns institution-level analytics, active classrooms, and total student counts.

### `POST /api/v1/institution/classrooms`
Creates a new academic classroom and roster.
- **Authorization:** Restricted to `Role.TEACHER` and `Role.ADMIN`.
- **Body:** `{"title": "Intro to Semiconductor Physics", "subject": "Electronics", "institution_id": "univ_01", "teacher_id": "prof_rao"}`

### `POST /api/v1/institution/assignments`
Publishes an assignment with a scheduled submission deadline.
- **Authorization:** Restricted to `Role.TEACHER` and `Role.ADMIN`.

