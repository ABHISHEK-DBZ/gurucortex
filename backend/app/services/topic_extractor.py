"""
Topic Extraction Service - Automatic topic identification from content
Phase 4: Week 2
"""
import logging
import json
import re
from typing import List, Dict, Optional, Set
from datetime import datetime
import aiosqlite
import uuid

from app.config import settings
from app.services.llm_client import LLMClient

logger = logging.getLogger(__name__)


class TopicExtractor:
    """
    Extracts and manages topics from documents, questions, and conversations

    Topics are hierarchical concepts that help organize knowledge and track mastery.
    Uses LLM to identify topics from content and maintains a topic hierarchy.
    """

    def __init__(self):
        self.llm_client = LLMClient()
        self.db_path = settings.DATABASE_PATH

    async def extract_topics_from_documents(
        self,
        document_ids: List[str],
        max_topics: int = 10
    ) -> List[Dict]:
        """
        Extract main topics from a set of documents

        Args:
            document_ids: List of document IDs to analyze
            max_topics: Maximum number of topics to extract

        Returns:
            List of topic dictionaries with name, category, and confidence
        """
        try:
            # Try to get document content from vector store
            docs = []
            try:
                from app.services.vector_store import VectorStore
                vs = VectorStore()
                if document_ids:
                    for doc_id in document_ids:
                        results = vs.collection.get(
                            where={"document_id": doc_id},
                            limit=10,
                            include=["documents", "metadatas"]
                        )
                        if results and results.get("documents"):
                            for doc_text in results["documents"]:
                                docs.append({"content": doc_text})
                else:
                    # Get a sample of all documents
                    results = vs.collection.get(
                        limit=20,
                        include=["documents", "metadatas"]
                    )
                    if results and results.get("documents"):
                        for doc_text in results["documents"]:
                            docs.append({"content": doc_text})
            except Exception as vs_err:
                logger.warning(f"Vector store unavailable for topic extraction: {vs_err}")
                return []

            if not docs:
                logger.warning("No documents found for topic extraction")
                return []

            # Combine document content (sample from each to stay within token limits)
            combined_content = ""
            for doc in docs:
                content = doc['content'][:1000]  # First 1000 chars per doc
                combined_content += content + "\n\n"

            # Use LLM to extract topics
            topics = await self._llm_extract_topics(combined_content, max_topics)

            # Store topics in database
            stored_topics = []
            async with aiosqlite.connect(self.db_path) as conn:
                for topic in topics:
                    topic_id = await self._store_topic(
                        conn,
                        name=topic['name'],
                        category=topic.get('category', 'General'),
                        document_ids=document_ids
                    )

                    stored_topics.append({
                        'id': topic_id,
                        'name': topic['name'],
                        'category': topic.get('category', 'General'),
                        'confidence': topic.get('confidence', 1.0)
                    })

                await conn.commit()

            logger.info(f"Extracted {len(stored_topics)} topics from {len(docs)} documents")
            return stored_topics

        except Exception as e:
            logger.error(f"Failed to extract topics from documents: {e}")
            return []

    async def extract_topics_from_quiz(self, quiz_id: str) -> List[str]:
        """
        Extract topics from quiz questions and update question metadata

        Args:
            quiz_id: Quiz ID to analyze

        Returns:
            List of extracted topic names
        """
        try:
            async with aiosqlite.connect(self.db_path) as conn:
                conn.row_factory = aiosqlite.Row

                # Get quiz questions
                cursor = await conn.execute(
                    "SELECT id, question_text, topic FROM questions WHERE quiz_id = ?",
                    (quiz_id,)
                )
                questions = await cursor.fetchall()

            if not questions:
                return []

            # Extract topics from questions without topics
            topics_set: Set[str] = set()

            for question in questions:
                if question['topic']:
                    topics_set.add(question['topic'])
                else:
                    # Use LLM to identify topic from question text
                    topic_name = await self._identify_question_topic(question['question_text'])
                    if topic_name:
                        topics_set.add(topic_name)

                        # Update question with topic
                        async with aiosqlite.connect(self.db_path) as conn:
                            await conn.execute(
                                "UPDATE questions SET topic = ? WHERE id = ?",
                                (topic_name, question['id'])
                            )
                            await conn.commit()

            # Store new topics in topics table
            async with aiosqlite.connect(self.db_path) as conn:
                for topic_name in topics_set:
                    # Check if topic exists
                    cursor = await conn.execute(
                        "SELECT id FROM topics WHERE name = ?",
                        (topic_name,)
                    )
                    existing = await cursor.fetchone()

                    if not existing:
                        topic_id = str(uuid.uuid4())
                        await conn.execute(
                            """INSERT INTO topics (id, name, category, document_ids, concept_count)
                               VALUES (?, ?, ?, ?, ?)""",
                            (topic_id, topic_name, 'Quiz Topic', '[]', 1)
                        )

                await conn.commit()

            logger.info(f"Extracted {len(topics_set)} topics from quiz {quiz_id}")
            return list(topics_set)

        except Exception as e:
            logger.error(f"Failed to extract topics from quiz: {e}")
            return []

    async def get_all_topics(self, limit: int = 100) -> List[Dict]:
        """Get all topics with their statistics"""
        try:
            async with aiosqlite.connect(self.db_path) as conn:
                conn.row_factory = aiosqlite.Row

                cursor = await conn.execute(
                    """SELECT t.id, t.name, t.category, t.concept_count, t.created_at,
                              COUNT(DISTINCT tm.id) as learners,
                              AVG(tm.mastery_level) as avg_mastery
                       FROM topics t
                       LEFT JOIN topic_mastery tm ON t.id = tm.topic_id
                       GROUP BY t.id
                       ORDER BY t.created_at DESC
                       LIMIT ?""",
                    (limit,)
                )

                rows = await cursor.fetchall()

                topics = []
                for row in rows:
                    topics.append({
                        'id': row['id'],
                        'name': row['name'],
                        'category': row['category'],
                        'concept_count': row['concept_count'] or 0,
                        'created_at': row['created_at'],
                        'learners': row['learners'] or 0,
                        'avg_mastery': round(row['avg_mastery'] or 0.0, 2)
                    })

                return topics

        except Exception as e:
            logger.error(f"Failed to get topics: {e}")
            return []

    async def _llm_extract_topics(self, content: str, max_topics: int) -> List[Dict]:
        """Use LLM to extract topics from content"""

        prompt = f"""Analyze the following educational content and extract the main topics/concepts covered.

Content:
{content[:3000]}

Extract up to {max_topics} main topics. For each topic, provide:
1. Topic name (concise, 2-4 words)
2. Category (e.g., Science, Mathematics, History, Programming, etc.)
3. Confidence (0.0-1.0, how central this topic is to the content)

Return ONLY a JSON array in this exact format:
[
  {{"name": "Topic Name", "category": "Category", "confidence": 0.95}},
  {{"name": "Another Topic", "category": "Category", "confidence": 0.85}}
]

JSON array:"""

        try:
            response = await self.llm_client.generate(
                prompt,
                max_tokens=1500,
                temperature=0.3
            )

            # Extract JSON from response
            json_match = re.search(r'\[[\s\S]*\]', response)
            if json_match:
                topics = json.loads(json_match.group())

                # Filter by confidence threshold
                filtered_topics = [
                    t for t in topics
                    if t.get('confidence', 0) >= settings.TOPIC_EXTRACTION_CONFIDENCE
                ]

                return filtered_topics[:max_topics]
            else:
                logger.warning("No JSON array found in LLM response")
                return []

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse topic extraction JSON: {e}")
            return []
        except Exception as e:
            logger.error(f"LLM topic extraction failed: {e}")
            return []

    async def _identify_question_topic(self, question_text: str) -> Optional[str]:
        """Identify the main topic of a single question"""

        prompt = f"""What is the main topic/subject of this question? Provide ONLY the topic name (2-4 words), nothing else.

Question: {question_text}

Topic:"""

        try:
            response = await self.llm_client.generate(
                prompt,
                max_tokens=200,
                temperature=0.2
            )

            # Clean up response
            topic = response.strip().strip('"\'').strip()

            # Validate topic (should be short)
            if len(topic.split()) <= 5 and len(topic) < 50:
                return topic
            else:
                return None

        except Exception as e:
            logger.error(f"Failed to identify question topic: {e}")
            return None

    async def _store_topic(
        self,
        conn: aiosqlite.Connection,
        name: str,
        category: str,
        document_ids: List[str]
    ) -> str:
        """Store a topic in the database (or update if exists)"""

        # Check if topic already exists
        cursor = await conn.execute(
            "SELECT id FROM topics WHERE name = ?",
            (name,)
        )
        existing = await cursor.fetchone()

        if existing:
            return existing[0]

        # Create new topic
        topic_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO topics (id, name, category, document_ids, concept_count)
               VALUES (?, ?, ?, ?, ?)""",
            (topic_id, name, category, json.dumps(document_ids), 1)
        )

        return topic_id
