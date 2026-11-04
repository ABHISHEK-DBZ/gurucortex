"""
SQLite database initialization and connection management for conversation storage.
"""
import aiosqlite
from pathlib import Path
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Database schema
SCHEMA_SQL = """
-- Conversations (Sessions)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    metadata TEXT
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    token_count INTEGER,
    metadata TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Conversation-Document Links
CREATE TABLE IF NOT EXISTS conversation_documents (
    conversation_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    first_referenced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, document_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Uploaded Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    chunks_created INTEGER,
    total_pages INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Context Summaries (for long conversations)
CREATE TABLE IF NOT EXISTS context_summaries (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    covers_message_range TEXT,
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Phase 4: Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    document_ids TEXT,
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    question_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

-- Phase 4: Questions
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('multiple_choice', 'true_false', 'short_answer')),
    difficulty TEXT,
    topic TEXT,
    options TEXT,
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Phase 4: Quiz Sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    conversation_id TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    score INTEGER,
    max_score INTEGER,
    time_taken INTEGER,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- Phase 4: Quiz Responses
CREATE TABLE IF NOT EXISTS quiz_responses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    time_taken INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Phase 4: Topics (for knowledge tracking)
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    document_ids TEXT,
    concept_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase 4: Topic Mastery
CREATE TABLE IF NOT EXISTS topic_mastery (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    conversation_id TEXT,
    mastery_level REAL DEFAULT 0.0,
    questions_answered INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP,
    next_review TIMESTAMP,
    easiness_factor REAL DEFAULT 2.5,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Phase 5: Badges & Achievements
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT CHECK(category IN ('streak', 'mastery', 'quiz', 'upload', 'exploration')),
    requirement_type TEXT,
    requirement_value INTEGER,
    earned_at TIMESTAMP
);

-- Phase 5: Study Plans
CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,
    topic_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date TEXT,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- Phase 3: Code Executions
CREATE TABLE IF NOT EXISTS code_executions (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    code TEXT NOT NULL,
    language TEXT DEFAULT 'python',
    output TEXT,
    error TEXT,
    execution_time REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_conv_role_ts ON messages(conversation_id, role, timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(is_archived, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_conversation ON context_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_quiz ON quiz_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session ON quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic ON topic_mastery(topic_id);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_study_plans_date ON study_plans(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_code_executions_conv ON code_executions(conversation_id);

-- GuruCortex 2.0: Concepts & Document Intelligence
CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    page_number INTEGER,
    section_title TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    summary TEXT,
    key_terms TEXT,
    formulas TEXT,
    dependencies TEXT,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- GuruCortex 2.0: Visual Explanations & Animation Scene Specs
CREATE TABLE IF NOT EXISTS visual_explanations (
    id TEXT PRIMARY KEY,
    concept_id TEXT NOT NULL,
    title TEXT NOT NULL,
    learning_objective TEXT,
    subject TEXT,
    scene_spec TEXT NOT NULL,
    multi_level_explanations TEXT,
    real_world_analogy TEXT,
    formulas_definitions TEXT,
    knowledge_check TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

-- GuruCortex 2.0: Concept-to-Reality Connections
CREATE TABLE IF NOT EXISTS reality_connections (
    id TEXT PRIMARY KEY,
    concept_id TEXT,
    topic_name TEXT NOT NULL,
    concept_summary TEXT,
    why_developed TEXT,
    real_world_uses TEXT,
    industries TEXT,
    products TEXT,
    research_applications TEXT,
    problems_solved TEXT,
    limitations TEXT,
    future_developments TEXT,
    mini_project TEXT,
    case_studies TEXT,
    citations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GuruCortex 2.0: Flashcards & Spaced Repetition (SM-2)
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    concept_id TEXT,
    topic_id TEXT,
    front_prompt TEXT NOT NULL,
    back_answer TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    repetition_count INTEGER DEFAULT 0,
    interval_days INTEGER DEFAULT 1,
    ease_factor REAL DEFAULT 2.5,
    last_reviewed TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GuruCortex 2.0: Cognitive Coach Recommendations
CREATE TABLE IF NOT EXISTS coach_recommendations (
    id TEXT PRIMARY KEY,
    student_id TEXT DEFAULT 'default_student',
    strategy_name TEXT NOT NULL,
    rationale TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    recommended_duration_mins INTEGER DEFAULT 15,
    evaluation_criteria TEXT,
    evidence_source TEXT,
    status TEXT CHECK(status IN ('suggested', 'in_progress', 'completed', 'dismissed')) DEFAULT 'suggested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GuruCortex 2.0: Student Growth & Project Portfolio
CREATE TABLE IF NOT EXISTS student_projects (
    id TEXT PRIMARY KEY,
    student_id TEXT DEFAULT 'default_student',
    title TEXT NOT NULL,
    subject TEXT,
    related_concept TEXT,
    description TEXT,
    skills_demonstrated TEXT,
    project_url TEXT,
    status TEXT DEFAULT 'completed',
    reflections TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GuruCortex 2.0: FuturePath Career & Skills Roadmaps
CREATE TABLE IF NOT EXISTS career_roadmaps (
    id TEXT PRIMARY KEY,
    student_id TEXT DEFAULT 'default_student',
    pathway_title TEXT NOT NULL,
    related_subjects TEXT,
    industries TEXT,
    required_qualifications TEXT,
    technical_skills TEXT,
    certifications TEXT,
    skill_gap_analysis TEXT,
    learning_roadmap TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GuruCortex 2.0: Focus Intelligence & Wellness Logs
CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY,
    subject TEXT,
    target_duration_minutes INTEGER NOT NULL,
    actual_duration_seconds INTEGER DEFAULT 0,
    distraction_count INTEGER DEFAULT 0,
    study_goals TEXT,
    distraction_notes TEXT,
    reflection TEXT,
    productivity_rating INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wellness_logs (
    id TEXT PRIMARY KEY,
    log_date TEXT NOT NULL,
    bedtime TEXT,
    wake_time TEXT,
    sleep_duration_hours REAL,
    energy_level INTEGER,
    study_readiness INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GuruCortex 2.0: Parent Connect & Transparency
CREATE TABLE IF NOT EXISTS parent_profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_student_links (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL,
    student_id TEXT NOT NULL DEFAULT 'default_student',
    link_code TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('pending', 'active', 'revoked')) DEFAULT 'active',
    consent_weekly_summary BOOLEAN DEFAULT 1,
    consent_exam_alerts BOOLEAN DEFAULT 1,
    consent_missed_session_alerts BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parent_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parent_guidance (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    observation TEXT NOT NULL,
    supporting_evidence TEXT NOT NULL,
    potential_root_cause TEXT,
    suggested_conversation_starter TEXT NOT NULL,
    actionable_assistance TEXT NOT NULL,
    suggested_follow_up TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_notifications (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parent_profiles(id) ON DELETE CASCADE
);

-- GuruCortex 2.0: Institutional / Teacher Mode
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    class_code TEXT UNIQUE NOT NULL,
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classroom_assignments (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    title TEXT NOT NULL,
    topic TEXT,
    document_id TEXT,
    due_date TEXT,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_concepts_doc ON concepts(document_id);
CREATE INDEX IF NOT EXISTS idx_visual_concept ON visual_explanations(concept_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start ON focus_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications ON parent_notifications(parent_id, is_read);
CREATE INDEX IF NOT EXISTS idx_classrooms_code ON classrooms(class_code);

"""


class Database:
    """SQLite database manager for conversations"""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.CONVERSATION_DB_PATH
        self._connection: Optional[aiosqlite.Connection] = None

    async def connect(self) -> aiosqlite.Connection:
        """Get or create database connection"""
        if self._connection is None:
            self._connection = await aiosqlite.connect(str(self.db_path), timeout=30.0, check_same_thread=False)
            # Enable foreign keys
            await self._connection.execute("PRAGMA foreign_keys = ON")
            # Use WAL mode for better concurrency
            await self._connection.execute("PRAGMA journal_mode = WAL")
            # Improve performance with synchronous=NORMAL
            await self._connection.execute("PRAGMA synchronous = NORMAL")
            # Increase cache size for better performance
            await self._connection.execute("PRAGMA cache_size = 10000")
            # Set busy timeout to handle locks better
            await self._connection.execute("PRAGMA busy_timeout = 30000")
            # Enable query optimizer
            await self._connection.execute("PRAGMA optimize")
        return self._connection

    async def close(self):
        """Close database connection"""
        if self._connection:
            await self._connection.close()
            self._connection = None

    async def init_schema(self):
        """Initialize database schema - always runs to ensure new tables are created"""
        db = await self.connect()

        logger.info("Ensuring all database tables exist...")
        await db.executescript(SCHEMA_SQL)
        await db.commit()
        logger.info("✓ Database schema initialized successfully")


# Global database instance
_db_instance: Optional[Database] = None


def get_database() -> Database:
    """Get global database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance


async def init_database():
    """Initialize database on application startup"""
    db = get_database()
    await db.init_schema()
    logger.info(f"Database initialized at: {db.db_path}")
