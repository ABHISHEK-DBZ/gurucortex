try:
    from pydantic_settings import BaseSettings
except ImportError:
    # Fallback for pydantic v1
    from pydantic import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    """Application configuration with local-first architecture"""

    # Application
    APP_NAME: str = "Guru-Agent (Project Cortex)"
    VERSION: str = "0.1.0-phase1"
    DEBUG: bool = True

    # Paths (relative to backend root)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    VECTOR_DB_DIR: Path = DATA_DIR / "vectordb"
    CACHE_DIR: Path = DATA_DIR / "cache"

    # LLM Configuration
    LLM_PROVIDER: str = "groq"  # "groq" or "ollama"
    GROQ_API_KEY: str = ""  # Set via GROQ_API_KEY environment variable or .env
    GROQ_MODEL: str = "openai/gpt-oss-120b"  # Best reasoning/thinking model on Groq LPU
    GROQ_FALLBACK_MODEL: str = "openai/gpt-oss-20b"
    INCLUDE_THINKING_IN_CHAT: bool = True

    # Local LLM Configuration (Ollama)
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434" if os.environ.get("WSL_DISTRO_NAME") else "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "mistral:7b"  # Fallback local model

    # Embedding Model (Local via sentence-transformers)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Offline-first runtime behavior  
    OFFLINE_MODE: bool = True  # Allow online downloads when needed
    LOCAL_MODEL_ONLY: bool = True  # Allow downloading embedding models when needed

    # ChromaDB
    CHROMA_COLLECTION_NAME: str = "guru_agent_knowledge"

    # Document Processing
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_UPLOAD_SIZE_MB: int = 50

    # RAG Configuration
    TOP_K_RETRIEVAL: int = 2  # Reduced from 4 for faster response generation
    SIMILARITY_THRESHOLD: float = 0.3

    # Phase 3: Conversation Storage
    CONVERSATION_DB_PATH: Path = BASE_DIR / "data" / "conversations.db"
    DATABASE_PATH: Path = BASE_DIR / "data" / "conversations.db"  # Alias for Phase 4

    # Phase 3: Context Window Management
    MAX_CONTEXT_TOKENS: int = 1500  # Reduced from 3000 for faster processing
    CONVERSATION_WINDOW_MESSAGES: int = 5  # Reduced from 10 for speed
    SUMMARIZATION_TRIGGER: int = 20  # messages
    TOKEN_ESTIMATION_RATIO: float = 4.0  # chars per token

    # Phase 3: Query Rewriting
    ENABLE_QUERY_REWRITING: bool = False  # Disabled for faster responses
    QUERY_REWRITE_CONTEXT_MESSAGES: int = 3

    # Phase 4: Assessment & Analytics
    QUIZ_DEFAULT_QUESTIONS: int = 10
    QUIZ_MIN_QUESTIONS: int = 5
    QUIZ_MAX_QUESTIONS: int = 50
    QUIZ_DIFFICULTY_LEVELS: list = ['easy', 'medium', 'hard', 'mixed']

    # Topic extraction
    TOPIC_EXTRACTION_CONFIDENCE: float = 0.6
    MIN_TOPIC_MENTIONS: int = 2

    # Mastery levels
    MASTERY_THRESHOLD_BEGINNER: float = 0.3
    MASTERY_THRESHOLD_INTERMEDIATE: float = 0.6
    MASTERY_THRESHOLD_ADVANCED: float = 0.9

    # Spaced repetition
    SR_INTERVAL_BASE: int = 1  # days
    SR_INTERVAL_MULTIPLIER: float = 2.5
    SR_MIN_EASINESS: float = 1.3

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
