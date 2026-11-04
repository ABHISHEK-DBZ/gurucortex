"""
Context Window Manager: Handles token counting and context window management.
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
try:
    import tiktoken
except ImportError:
    tiktoken = None

from app.config import settings
from app.models.conversation_schemas import Message

logger = logging.getLogger(__name__)


class ContextWindowManager:
    """Manages context window for LLM prompts with token counting and sliding window"""

    def __init__(self):
        try:
            # Use cl100k_base encoding (GPT-3.5/4 tokenizer) as approximation for Mistral
            self.encoding = tiktoken.get_encoding("cl100k_base")
            self.use_tiktoken = True
            logger.info("Initialized tiktoken for token counting")
        except Exception as e:
            logger.warning(f"Failed to initialize tiktoken: {e}. Using character estimation.")
            self.encoding = None
            self.use_tiktoken = False

        self.max_context_tokens = settings.MAX_CONTEXT_TOKENS
        self.window_messages = settings.CONVERSATION_WINDOW_MESSAGES

    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        if self.use_tiktoken and self.encoding:
            try:
                return len(self.encoding.encode(text))
            except Exception as e:
                logger.warning(f"tiktoken counting failed: {e}. Using estimation.")
                return self.estimate_tokens_fast(text)
        else:
            return self.estimate_tokens_fast(text)

    def estimate_tokens_fast(self, text: str) -> int:
        """Fallback estimation: 1 token ≈ 4 characters"""
        return int(len(text) / settings.TOKEN_ESTIMATION_RATIO)

    def count_messages_tokens(self, messages: List[Message]) -> int:
        """Count total tokens in a list of messages"""
        total = 0
        for msg in messages:
            if msg.token_count:
                total += msg.token_count
            else:
                total += self.count_tokens(msg.content)
        return total

    def build_context_window(
        self,
        conversation_history: List[Message],
        rag_chunks: List[Dict[str, Any]],
        system_prompt: str = "",
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Build context window with sliding window strategy

        Returns:
            {
                'system_prompt': str,
                'conversation_history': str,
                'rag_context': str,
                'tokens_used': int,
                'messages_included': int,
                'truncated': bool
            }
        """
        max_tokens = max_tokens or self.max_context_tokens

        # Count system prompt tokens
        system_tokens = self.count_tokens(system_prompt)

        # Build RAG context
        rag_context = self._build_rag_context(rag_chunks)
        rag_tokens = self.count_tokens(rag_context)

        # Reserve space for RAG context and system prompt
        reserved_tokens = system_tokens + rag_tokens
        available_tokens = max_tokens - reserved_tokens

        if available_tokens < 500:
            logger.warning(f"Very limited token budget: {available_tokens} tokens for conversation history")
            available_tokens = 500  # Minimum fallback

        # Select messages with sliding window
        selected_messages, tokens_used = self._select_messages_window(
            conversation_history,
            available_tokens
        )

        # Build conversation history string
        history_text = self._format_conversation_history(selected_messages)

        total_tokens = system_tokens + rag_tokens + tokens_used

        return {
            'system_prompt': system_prompt,
            'conversation_history': history_text,
            'rag_context': rag_context,
            'tokens_used': total_tokens,
            'messages_included': len(selected_messages),
            'truncated': len(selected_messages) < len(conversation_history),
            'tokens_breakdown': {
                'system': system_tokens,
                'rag': rag_tokens,
                'history': tokens_used
            }
        }

    def _select_messages_window(
        self,
        messages: List[Message],
        available_tokens: int
    ) -> Tuple[List[Message], int]:
        """
        Select messages using sliding window strategy

        Strategy:
        1. Always include latest messages that fit
        2. If space allows, include first message for context
        3. Fill middle if room remains
        """
        if not messages:
            return [], 0

        selected_messages = []
        token_count = 0

        # Start from most recent and work backwards
        for msg in reversed(messages):
            msg_tokens = msg.token_count or self.count_tokens(msg.content)

            if token_count + msg_tokens > available_tokens:
                # Check if we can include the very first message for context
                if len(selected_messages) > 0 and messages[0] not in selected_messages:
                    first_msg_tokens = messages[0].token_count or self.count_tokens(messages[0].content)
                    if token_count + first_msg_tokens <= available_tokens:
                        selected_messages.insert(0, messages[0])
                        token_count += first_msg_tokens
                break

            selected_messages.insert(0, msg)
            token_count += msg_tokens

        logger.debug(
            f"Selected {len(selected_messages)}/{len(messages)} messages, "
            f"using {token_count} tokens"
        )

        return selected_messages, token_count

    def _build_rag_context(self, rag_chunks: List[Dict[str, Any]]) -> str:
        """Build RAG context string from retrieved chunks"""
        if not rag_chunks:
            return ""

        context_parts = []
        for i, chunk in enumerate(rag_chunks, 1):
            content = chunk.get('content', '')
            metadata = chunk.get('metadata', {})
            document_name = metadata.get('filename', 'Unknown')
            page = metadata.get('page_number', '?')

            context_parts.append(
                f"[Source {i}: {document_name}, Page {page}]\n{content}"
            )

        return "\n\n---\n\n".join(context_parts)

    def _format_conversation_history(self, messages: List[Message]) -> str:
        """Format conversation history as a string"""
        if not messages:
            return ""

        formatted = []
        for msg in messages:
            role_label = "User" if msg.role == "user" else "Assistant"
            formatted.append(f"{role_label}: {msg.content}")

        return "\n\n".join(formatted)

    def should_summarize(self, message_count: int) -> bool:
        """Check if conversation should be summarized"""
        return message_count >= settings.SUMMARIZATION_TRIGGER

    async def build_full_prompt(
        self,
        system_prompt: str,
        conversation_history: List[Message],
        rag_chunks: List[Dict[str, Any]],
        current_query: str
    ) -> str:
        """
        Build the complete prompt for LLM with all context

        Args:
            system_prompt: System instructions
            conversation_history: Previous messages
            rag_chunks: Retrieved RAG chunks
            current_query: User's current question

        Returns:
            Complete formatted prompt string
        """
        context_window = self.build_context_window(
            conversation_history=conversation_history,
            rag_chunks=rag_chunks,
            system_prompt=system_prompt
        )

        # Build final prompt
        prompt_parts = []

        # System prompt
        if context_window['system_prompt']:
            prompt_parts.append(f"SYSTEM: {context_window['system_prompt']}")

        # RAG context
        if context_window['rag_context']:
            prompt_parts.append(f"\nRELEVANT INFORMATION:\n{context_window['rag_context']}")

        # Conversation history
        if context_window['conversation_history']:
            prompt_parts.append(f"\nCONVERSATION HISTORY:\n{context_window['conversation_history']}")

        # Current query
        prompt_parts.append(f"\nCURRENT QUESTION:\nUser: {current_query}")

        prompt = "\n\n".join(prompt_parts)

        logger.debug(
            f"Built prompt: {context_window['tokens_used']} tokens, "
            f"{context_window['messages_included']} messages"
        )

        return prompt

    def get_token_stats(
        self,
        conversation_history: List[Message],
        rag_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get token usage statistics for current context"""
        context = self.build_context_window(
            conversation_history=conversation_history,
            rag_chunks=rag_chunks
        )

        return {
            'total_tokens': context['tokens_used'],
            'max_tokens': self.max_context_tokens,
            'messages_in_window': context['messages_included'],
            'truncated': context['truncated'],
            'tokens_breakdown': context['tokens_breakdown'],
            'percentage_used': int((context['tokens_used'] / self.max_context_tokens) * 100)
        }
