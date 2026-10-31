from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import logging

from app.services.vector_store import VectorStore
from app.services.llm_client import OllamaClient
from app.services.conversation_manager import ConversationManager
from app.services.context_window_manager import ContextWindowManager
from app.models.schemas import ChatResponse, SourceChunk
from app.config import settings

logger = logging.getLogger(__name__)


class RAGEngine:
    """Orchestrates Retrieval-Augmented Generation pipeline with conversation context (Phase 3)"""

    def __init__(self):
        self.vector_store = VectorStore()
        self.llm_client = OllamaClient()
        # Phase 3: Conversation support
        self.conversation_manager = ConversationManager()
        self.context_manager = ContextWindowManager()

    async def query(
        self,
        user_query: str,
        conversation_id: str = None,
        document_ids: Optional[List[str]] = None,
        include_sources: bool = True,
        generate_diagram: bool = True
    ) -> ChatResponse:
        """
        Process user query through RAG pipeline with conversation context.

        Phase 3 Enhancement: Now maintains conversation history and uses it for context.
        """

        # Generate conversation ID if not provided (backward compatibility)
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            logger.warning("No conversation_id provided, creating new conversation")

        # Phase 3: Load conversation history
        conversation_history = []
        try:
            conversation = await self.conversation_manager.get_conversation(conversation_id)
            if conversation:
                conversation_history = conversation.messages
                logger.debug(f"Loaded {len(conversation_history)} messages from conversation history")
        except Exception as e:
            logger.warning(f"Failed to load conversation history: {e}. Proceeding without history.")

        # Step 1: Retrieve relevant chunks from vector store
        retrieved_chunks = self.vector_store.query(
            user_query,
            document_ids=document_ids,
        )

        if not retrieved_chunks:
            # No relevant context found
            response_text = "I don't have enough information in my knowledge base to answer that question. Please upload relevant study materials first."

            # Save messages even for no-context responses
            try:
                await self.conversation_manager.add_message(
                    conversation_id=conversation_id,
                    role="user",
                    content=user_query
                )
                await self.conversation_manager.add_message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=response_text
                )
            except Exception as e:
                logger.warning(f"Failed to save messages: {e}")

            return ChatResponse(
                response=response_text,
                sources=[],
                mermaid_diagram=None,
                conversation_id=conversation_id,
                timestamp=datetime.now()
            )

        # Step 2: Build conversation context window (Phase 3)
        context_window = self.context_manager.build_context_window(
            conversation_history=conversation_history,
            rag_chunks=retrieved_chunks,
            system_prompt=self._get_system_prompt()
        )

        history_text = context_window.get("conversation_history", "")
        
        # Step 3: Generate response using LLM with full context (history + RAG)
        context_texts = [chunk["content"] for chunk in retrieved_chunks]
        
        if history_text:
            context_texts.append(f"--- Conversation History ---\n{history_text}")

        generation_result = await self.llm_client.generate_with_context(
            query=user_query,
            context_chunks=context_texts,
            generate_diagram=generate_diagram,
            system_prompt=context_window.get("system_prompt")
        )

        response_text = generation_result["response"]
        mermaid_diagram = generation_result.get("mermaid_diagram")

        # Step 4: Format sources
        sources = []
        if include_sources:
            for chunk in retrieved_chunks:
                sources.append(SourceChunk(
                    content=chunk["content"][:200] + "...",  # Truncate for UI
                    document_name=chunk["metadata"].get("filename", "Unknown"),
                    page_number=chunk["metadata"].get("page_number"),
                    similarity_score=round(chunk["similarity_score"], 3)
                ))

        # Phase 3: Save messages to conversation history
        try:
            # Save user message
            await self.conversation_manager.add_message(
                conversation_id=conversation_id,
                role="user",
                content=user_query,
                token_count=self.context_manager.count_tokens(user_query)
            )

            # Save assistant message with metadata
            await self.conversation_manager.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=response_text,
                token_count=self.context_manager.count_tokens(response_text),
                metadata={
                    "sources": [s.dict() for s in sources],
                    "mermaid_diagram": mermaid_diagram,
                    "query_rewritten": False  # Will be True when query rewriter is added
                }
            )

            # Link documents to conversation
            for chunk in retrieved_chunks:
                document_id = chunk["metadata"].get("document_id")
                if document_id:
                    await self.conversation_manager.link_document(
                        conversation_id=conversation_id,
                        document_id=document_id
                    )

            logger.info(f"Saved conversation turn to {conversation_id}")

        except Exception as e:
            logger.error(f"Failed to save conversation: {e}")
            # Continue anyway - user still gets response

        # Step 5: Build response
        return ChatResponse(
            response=response_text,
            sources=sources,
            mermaid_diagram=mermaid_diagram,
            conversation_id=conversation_id,
            timestamp=datetime.now()
        )

    def _get_system_prompt(self) -> str:
        """Get system prompt for LLM"""
        return """You are Guru-Agent, an empathetic AI learning companion designed to help students learn effectively.

Your approach:
1. Use the Socratic method - guide students to discover answers through thoughtful questions
2. Provide clear, concise explanations tailored to the student's level
3. Use examples and analogies to clarify complex concepts
4. Encourage critical thinking and active learning
5. When appropriate, generate Mermaid diagrams to visualize concepts

CRITICAL RULES FOR ACCURACY:
- Prioritize using the provided "Context from study materials" when answering questions related to uploaded documents.
- If the student's question is not covered in the provided documents, state that it is outside the uploaded study materials, and provide a clear, accurate, high-quality educational explanation to help them learn.
- Consider the conversation history to maintain context, and ensure all explanations are logical, rational, and step-by-step.

Remember:
- Be patient and supportive
- Acknowledge when you don't know something"""

    async def index_document(self, chunks: List[Dict[str, Any]]) -> int:
        """Index document chunks into vector store"""
        return self.vector_store.add_documents(chunks)

    async def remove_document(self, document_id: str) -> bool:
        """Remove all chunks for a document from the vector store."""
        try:
            return await self.vector_store.remove_document(document_id)
        except Exception as e:
            logger.error(f"Failed to remove document {document_id} from vector store: {e}")
            return False

    async def health_check(self) -> Dict[str, Any]:
        """Check health of RAG components"""
        llm_healthy = await self.llm_client.check_health()
        model_name = getattr(settings, "GROQ_MODEL", "openai/gpt-oss-120b") if getattr(settings, "LLM_PROVIDER", "") == "groq" else settings.OLLAMA_MODEL

        return {
            "status": "healthy" if llm_healthy else "degraded",
            "ollama_connected": llm_healthy,
            "vector_db_status": "operational",
            "documents_indexed": self.vector_store.get_document_count(),
            "model_loaded": model_name
        }
