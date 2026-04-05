# GuruCortex - Active Cognitive Learning OS

**A fully local, privacy-first AI learning companion powered by Ollama + Mistral-7B**

GuruCortex transforms how you learn by combining RAG-powered Q&A, adaptive quizzes, mastery tracking, code execution, podcast-style audio lessons, and gamification - all running 100% on your machine with zero cloud dependencies.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![Ollama](https://img.shields.io/badge/Ollama-Mistral--7B-blue)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)



---

## Features

### Chat & RAG Pipeline
- Upload PDFs, DOCX, PPTX, TXT files and ask questions about them
- Context-aware responses with source citations
- Auto-generated Mermaid diagrams for visual explanations
- Conversation history with context window management

### Adaptive Assessments
- AI-generated quizzes from your study materials
- Multiple choice, true/false, short answer question types
- Difficulty levels: easy, medium, hard, mixed
- Detailed results with per-question feedback

### Learning Analytics & Mastery
- SM-2 spaced repetition algorithm for optimal review scheduling
- Topic mastery tracking across all study sessions
- Performance trends, quiz history, accuracy breakdowns
- Personalized study recommendations

### Code Sandbox
- Execute Python code directly in the browser
- Built-in templates (Fibonacci, sorting, math, statistics)
- Execution history saved per session
- Security-sandboxed with dangerous import blocking

### Protege Effect (Teach-Back Mode)
- AI plays a confused student - you teach the concept
- Evaluated on clarity, accuracy, engagement, depth, examples
- Letter grade (A-D) with specific feedback
- Strengthens understanding through active recall

### Podcast-Style Audio Learning
- AI generates HOST/EXPERT dialogue scripts from your materials
- Browser-based text-to-speech playback with different voices
- Interactive transcript with clickable segments
- Multiple styles: conversational, academic, storytelling

### Study Planner
- Create and manage study plans with scheduling
- Auto-generate plans from spaced repetition data
- Track completion status (pending, in progress, completed, skipped)
- Duration tracking and daily overview

### Gamification
- 12 achievement badges across 5 categories
- Level progression system based on activity
- Streak tracking for daily engagement
- Categories: upload, quiz, streak, mastery, exploration

### Attention Monitoring
- Webcam-based attention detection using MediaPipe
- Real-time engagement scoring
- Smart intervention suggestions when attention drifts
- WebSocket streaming for live monitoring

### Accessibility
- OpenDyslexic font toggle for dyslexia support
- High contrast mode (black/white/yellow)
- Adjustable font sizes (normal, large, extra-large)
- Reduced motion mode

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | Ollama + Mistral-7B (local GPU) |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) |
| **Vector DB** | ChromaDB |
| **Database** | SQLite (aiosqlite) |
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS |
| **Animations** | Framer Motion |
| **Diagrams** | Mermaid.js |
| **Attention** | OpenCV + MediaPipe |
| **TTS** | pyttsx3 + Browser SpeechSynthesis API |

---

## Architecture

```
                    +------------------+
                    |   Browser        |
                    |   localhost:3000  |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   Next.js 14     |
                    |   (Frontend)     |
                    +--------+---------+
                             |  Axios
                    +--------v---------+
                    |   FastAPI        |
                    |   localhost:8000  |
                    +---+----+----+----+
                        |    |    |
              +---------+  +-+    +----------+
              |            |                 |
     +--------v---+  +----v------+  +-------v-------+
     |  ChromaDB  |  |  SQLite   |  |    Ollama     |
     | (Vectors)  |  | (13 tbl)  |  | (Mistral-7B)  |
     +------------+  +-----------+  +---------------+
```

---

## Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Ollama** - [Download](https://ollama.com/download)
- **NVIDIA GPU** recommended (works on CPU too, slower)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ABHISHEK-DBZ/gurucortex.git
cd gurucortex

# 2. Install Ollama and pull the model
ollama pull mistral:7b

# 3. Install backend dependencies
cd backend
pip install -r requirements.txt
cp .env.example .env

# 4. Install frontend dependencies
cd ../frontend
npm install
```

### Run

**Option A: One-click (Windows)**
```
Double-click start.bat
```

**Option B: Manual**
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

Open **http://localhost:3000/dashboard**

### Stop
```
Double-click stop.bat
```

---

## API Endpoints

### Chat & Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/query` | Send question to RAG pipeline |
| `GET` | `/chat/health` | System health check |
| `POST` | `/documents/upload` | Upload study material |
| `GET` | `/documents/count` | Count indexed chunks |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/conversations` | List all conversations |
| `POST` | `/conversations` | Create new conversation |
| `GET` | `/conversations/{id}` | Get conversation with messages |
| `PATCH` | `/conversations/{id}` | Update title/archive |
| `DELETE` | `/conversations/{id}` | Delete conversation |

### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/assessments/generate` | Generate quiz from documents |
| `GET` | `/assessments/quizzes` | List all quizzes |
| `POST` | `/assessments/sessions` | Start quiz session |
| `POST` | `/assessments/sessions/{id}/submit` | Submit answer |
| `POST` | `/assessments/sessions/{id}/complete` | Finish quiz |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/stats` | Overall learning statistics |
| `GET` | `/analytics/mastery` | Topic mastery levels |
| `GET` | `/analytics/mastery/review` | Topics due for review |
| `GET` | `/analytics/recommendations` | Study recommendations |

### Code Execution
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/code/execute` | Run Python code (sandboxed) |
| `GET` | `/code/history` | Execution history |

### Protege Effect
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/protege/start` | Start teach-back session |
| `POST` | `/protege/respond` | AI responds as student |
| `POST` | `/protege/evaluate` | Grade teaching quality |

### Podcast
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/podcast/generate-script` | Generate audio script |
| `POST` | `/podcast/synthesize` | Convert to audio |

### Study Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/planner/plans` | Get study plans |
| `POST` | `/planner/plans` | Create plan |
| `PATCH` | `/planner/plans/{id}` | Update plan status |
| `POST` | `/planner/generate` | Auto-generate plans |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/gamification/badges` | All badges with status |
| `POST` | `/gamification/check-badges` | Check & award badges |
| `GET` | `/gamification/stats` | Level, streak, stats |

### Multimodal
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/multimodal/analyze-attention` | Analyze webcam frame |
| `POST` | `/multimodal/transcribe-voice` | Voice to text |
| `POST` | `/multimodal/synthesize-speech` | Text to speech |
| `WS` | `/multimodal/attention-stream` | Real-time attention |

Full interactive API docs at **http://localhost:8000/docs**

---

## Project Structure

```
gurucortex/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── config.py                  # Settings & configuration
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic models
│   │   ├── routers/
│   │   │   ├── chat.py                # RAG query endpoints
│   │   │   ├── documents.py           # Document upload & processing
│   │   │   ├── conversations.py       # Conversation management
│   │   │   ├── assessments.py         # Quiz generation & sessions
│   │   │   ├── analytics.py           # Learning analytics & mastery
│   │   │   ├── code_execution.py      # Sandboxed Python execution
│   │   │   ├── podcast.py             # Audio script generation
│   │   │   ├── protege.py             # Teach-back evaluation
│   │   │   ├── study_planner.py       # Study plan CRUD
│   │   │   ├── gamification.py        # Badges & achievements
│   │   │   └── multimodal.py          # Attention, voice, TTS
│   │   └── services/
│   │       ├── rag_engine.py          # RAG orchestration
│   │       ├── vector_store.py        # ChromaDB operations
│   │       ├── llm_client.py          # Ollama API client
│   │       ├── document_processor.py  # Text extraction & chunking
│   │       ├── database.py            # SQLite schema (13 tables)
│   │       ├── conversation_manager.py
│   │       ├── context_window_manager.py
│   │       ├── assessment_generator.py
│   │       ├── quiz_manager.py
│   │       ├── topic_extractor.py
│   │       ├── mastery_tracker.py
│   │       ├── analytics_engine.py
│   │       ├── attention_tracker.py
│   │       ├── voice_input.py
│   │       └── text_to_speech.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # Landing page
│   │   ├── layout.tsx                 # Root layout
│   │   ├── globals.css                # Styles + accessibility
│   │   └── dashboard/
│   │       └── page.tsx               # Main dashboard (10 tabs)
│   ├── components/
│   │   ├── ChatInterface.tsx          # RAG chat
│   │   ├── DocumentUploader.tsx       # File upload
│   │   ├── CodeSandbox.tsx            # Python editor
│   │   ├── AssessmentHub.tsx          # Quiz management
│   │   ├── QuizInterface.tsx          # Quiz taking
│   │   ├── LearningDashboard.tsx      # Analytics
│   │   ├── PodcastPlayer.tsx          # Audio lessons
│   │   ├── ProtegeMode.tsx            # Teach-back
│   │   ├── StudyPlanner.tsx           # Study plans
│   │   ├── BadgesDisplay.tsx          # Gamification
│   │   ├── AttentionMonitor.tsx       # Focus tracking
│   │   ├── VoiceInput.tsx             # Voice input
│   │   ├── AccessibilityToggle.tsx    # Accessibility
│   │   └── MermaidRenderer.tsx        # Diagram rendering
│   ├── lib/api-client.ts             # API wrapper
│   ├── types/                         # TypeScript definitions
│   ├── public/fonts/                  # Bundled fonts (offline)
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml
├── start.bat                          # Windows startup
├── stop.bat                           # Windows shutdown
├── deploy.sh                          # Linux/Mac deploy
└── deploy.bat                         # Windows Docker deploy
```

---

## Database Schema

SQLite with 13 tables:

| Table | Purpose |
|-------|---------|
| `conversations` | Chat sessions with metadata |
| `messages` | Individual chat messages |
| `conversation_documents` | Document-conversation links |
| `context_summaries` | Compressed conversation context |
| `quizzes` | Generated quiz definitions |
| `questions` | Quiz questions with answers |
| `quiz_sessions` | Active quiz attempts |
| `quiz_responses` | Student answers per session |
| `topics` | Extracted learning topics |
| `topic_mastery` | SM-2 spaced repetition state |
| `badges` | Earned achievement badges |
| `study_plans` | Scheduled study sessions |
| `code_executions` | Code sandbox history |

---

## Configuration

Edit `backend/.env`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RETRIEVAL=4
SIMILARITY_THRESHOLD=0.3
```

---

## Docker Deployment

```bash
# Start Ollama on host first
ollama serve

# Build and run
docker compose up -d --build

# Check status
docker compose ps

# Stop
docker compose down
```

---

## Supported File Formats

| Format | Extension |
|--------|-----------|
| PDF | `.pdf` |
| Word | `.docx` |
| PowerPoint | `.pptx` |
| Plain Text | `.txt` |

---

## Privacy & Security

- **100% offline** - No data leaves your machine
- **No telemetry** - Zero tracking or analytics
- **Local LLM** - Ollama runs entirely on your hardware
- **Local embeddings** - sentence-transformers cached locally
- **Sandboxed code** - Dangerous imports blocked
- **No accounts** - No login required

---

## License

MIT
## Support

If you find GuruCortex useful, consider supporting the project:

<a href="https://buymeacoffee.com/abhishekjhadbz" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50"></a>

---

Built with Ollama, FastAPI, Next.js, and ChromaDB.
