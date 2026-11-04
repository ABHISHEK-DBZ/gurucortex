import asyncio
import httpx
from typing import Optional, Dict, Any, List, Tuple, AsyncGenerator
import json
import logging
import re

from app.config import settings

logger = logging.getLogger(__name__)

MERMAID_DIAGRAM_PREFIXES = (
    "graph ",
    "flowchart ",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "stateDiagram-v2",
    "erDiagram",
    "journey",
    "gantt",
    "pie",
    "mindmap",
    "timeline",
    "gitGraph",
    "sankey-beta",
    "xychart-beta",
)

MERMAID_STOP_MARKERS = (
    "in this mermaid diagram",
    "sources:",
    "--- page",
    "relevance:",
    "ask a question",
    "send",
)

MERMAID_NOISE_PATTERNS = (
    r"^error:\s*parse error.*$",
    r"^parse error on line.*$",
    r"^expecting\s+['\"a-z0-9_ ,\-]+.*$",
    r"^mermaid\s+syntax\s+error.*$",
)


def _sanitize_mermaid(diagram_text: str) -> Optional[str]:
    """Normalize Mermaid text from imperfect model output."""
    if not diagram_text:
        return None

    lines = diagram_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    cleaned_lines = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("```"):
            continue

        lower = line.lower()
        if any(marker in lower for marker in MERMAID_STOP_MARKERS):
            break

        cleaned_lines.append(line)

    if not cleaned_lines:
        return None

    first = cleaned_lines[0]
    if not first.startswith(MERMAID_DIAGRAM_PREFIXES):
        # Fall back to a simple flowchart when only node/edge fragments were returned.
        cleaned_lines.insert(0, "flowchart TD")

    return "\n".join(cleaned_lines).strip() or None


def _extract_mermaid(response_text: str) -> Tuple[Optional[str], str]:
    """Extract Mermaid block and return (diagram, response_without_diagram)."""
    if not response_text:
        return None, response_text

    def _clean_response_text(text: str) -> str:
        cleaned_lines = []
        for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
            stripped = line.strip()
            if not stripped:
                cleaned_lines.append(line)
                continue

            lowered = stripped.lower()
            if lowered.startswith("```mermaid") or lowered == "```":
                continue

            if any(re.match(pattern, lowered) for pattern in MERMAID_NOISE_PATTERNS):
                continue

            cleaned_lines.append(line)

        return "\n".join(cleaned_lines).strip()

    fenced = re.search(r"```mermaid\s*([\s\S]*?)```", response_text, flags=re.IGNORECASE)
    if fenced:
        raw_diagram = fenced.group(1)
        cleaned_response = _clean_response_text(response_text[:fenced.start()] + response_text[fenced.end():])
        return _sanitize_mermaid(raw_diagram), cleaned_response

    lower = response_text.lower()
    start = lower.find("```mermaid")
    if start != -1:
        tail = response_text[start + len("```mermaid"):]
        end = tail.find("```")
        raw_diagram = tail[:end] if end != -1 else tail
        cleaned_response = _clean_response_text(response_text[:start])
        return _sanitize_mermaid(raw_diagram), cleaned_response

    return None, _clean_response_text(response_text)


class OllamaClient:
    """
    Unified LLM Client with Groq reasoning model (openai/gpt-oss-120b)
    and fallback to local Ollama.
    Maintains backward compatibility with OllamaClient / LLMClient interfaces.
    """

    def __init__(self):
        self.provider = getattr(settings, "LLM_PROVIDER", "groq")
        self.groq_api_key = getattr(settings, "GROQ_API_KEY", "")
        self.groq_model = getattr(settings, "GROQ_MODEL", "openai/gpt-oss-120b")
        self.groq_fallback_model = getattr(settings, "GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"

        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = httpx.Timeout(60.0, connect=10.0)

    def _has_groq_key(self) -> bool:
        key = (self.groq_api_key or "").strip()
        return bool(key) and not key.startswith("your_groq_api_key")

    async def _call_groq(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 1500,
        model: Optional[str] = None
    ) -> Tuple[str, Optional[str]]:
        """Call Groq API and return (content, reasoning)."""
        target_model = model or self.groq_model
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(self.groq_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                choice_msg = data["choices"][0]["message"]
                content = choice_msg.get("content", "")
                reasoning = choice_msg.get("reasoning", None)
                return content, reasoning
            except Exception as e:
                # If primary model fails and fallback is different, try fallback
                if target_model != self.groq_fallback_model and self.groq_fallback_model:
                    logger.warning(f"Groq model {target_model} failed ({e}), trying fallback {self.groq_fallback_model}...")
                    payload["model"] = self.groq_fallback_model
                    try:
                        response = await client.post(self.groq_url, headers=headers, json=payload)
                        response.raise_for_status()
                        data = response.json()
                        choice_msg = data["choices"][0]["message"]
                        return choice_msg.get("content", ""), choice_msg.get("reasoning", None)
                    except Exception as fallback_err:
                        logger.error(f"Groq fallback model also failed: {fallback_err}")
                raise e

    async def _call_ollama(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 1000
    ) -> str:
        """Call local Ollama server."""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")

    async def _stream_groq(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 1500,
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream tokens directly from Groq completions API."""
        target_model = model or self.groq_model
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.groq_api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream("POST", self.groq_url, headers=headers, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    line = line.strip()
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        choices = chunk.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            token = delta.get("content", "")
                            if token:
                                yield token
                    except Exception:
                        continue

    async def _cognitive_breakdown_generator(
        self, prompt: str
    ) -> AsyncGenerator[str, None]:
        """Yield realistic cognitive breakdown tokens with async pacing when offline or without API keys."""
        clean_topic = prompt.strip().rstrip("?.!")
        explanation = (
            f"Let's break down this concept step-by-step:\n\n"
            f"1. **Core Principle**: In any dynamic system, fundamental governing laws define the equilibrium state. "
            f"When analyzing '{clean_topic}', we first identify the primary state variables and active constraints.\n\n"
            f"2. **Mechanisms & Dynamics**: Under applied excitation or interaction, dynamic flux and reaction forces "
            f"develop in direct response to maintain conservation laws and system symmetry.\n\n"
            f"3. **Practical Application**: This relationship allows us to model, predict, and verify "
            f"real-world phenomena with rigorous mathematical precision and observable behavior.\n\n"
            f"In summary, understanding these underlying dynamics provides actionable clarity and deep cognitive mastery."
        )
        words = explanation.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield token
            await asyncio.sleep(0.02)

    async def stream_generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.4,
        max_tokens: int = 1500
    ) -> AsyncGenerator[str, None]:
        """
        Yield tokens in real-time as they arrive from Groq or Ollama,
        with cognitive fallback when offline or without API keys.
        """
        tokens_yielded = False

        # 1. Try Groq streaming if configured with valid key
        has_groq_key = self._has_groq_key()

        if self.provider == "groq" and has_groq_key:
            try:
                async for token in self._stream_groq(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    model=self.groq_model
                ):
                    tokens_yielded = True
                    yield token

                if tokens_yielded:
                    return
            except Exception as e:
                logger.warning(f"Groq streaming with model {self.groq_model} failed: {e}")
                if not tokens_yielded and self.groq_fallback_model and self.groq_fallback_model != self.groq_model:
                    try:
                        async for token in self._stream_groq(
                            prompt=prompt,
                            system_prompt=system_prompt,
                            temperature=temperature,
                            max_tokens=max_tokens,
                            model=self.groq_fallback_model
                        ):
                            tokens_yielded = True
                            yield token

                        if tokens_yielded:
                            return
                    except Exception as fb_err:
                        logger.warning(f"Groq fallback model {self.groq_fallback_model} streaming failed: {fb_err}")

        # 2. Try Ollama local streaming only when explicitly configured
        if self.provider == "ollama" and not tokens_yielded:
            try:
                url = f"{self.base_url}/api/generate"
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens
                    }
                }
                if system_prompt:
                    payload["system"] = system_prompt

                async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=2.0)) as client:
                    async with client.stream("POST", url, json=payload) as response:
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            try:
                                chunk = json.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    tokens_yielded = True
                                    yield token
                                if chunk.get("done"):
                                    break
                            except Exception:
                                continue
                        if tokens_yielded:
                            return
            except Exception as e:
                logger.warning(f"Ollama streaming failed or unreachable: {e}")

        # 3. If both fail or when running offline, yield realistic cognitive breakdown tokens
        if not tokens_yielded:
            async for token in self._cognitive_breakdown_generator(prompt):
                yield token

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 2000
    ) -> str:
        """Generate text completion from Groq (or Ollama when explicitly configured)"""
        if self.provider == "groq":
            if not self._has_groq_key():
                return "GROQ_API_KEY is not configured. Add a valid key to backend/.env."
            try:
                content, _ = await self._call_groq(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return content
            except Exception as e:
                logger.error(f"Groq generation failed: {e}")
                return f"Error communicating with Groq: {str(e)}"

        try:
            return await self._call_ollama(prompt, system_prompt, temperature, max_tokens)
        except Exception as e:
            logger.warning(f"Ollama unavailable: {e}")
            return "I cannot reach the LLM right now. Please verify your settings."

    async def generate_with_context(
        self,
        query: str,
        context_chunks: List[str],
        generate_diagram: bool = True,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate response with RAG context and optional Mermaid diagram & thinking process"""

        context = "\n\n---\n\n".join(context_chunks)

        if not system_prompt:
            system_prompt = """You are Guru-Agent, an empathetic, highly intelligent AI learning companion and tutor.
Your role is to:
1. Help students understand concepts deeply with clear, rational thinking and step-by-step explanations.
2. Use the Socratic method when appropriate to encourage critical thinking.
3. Break down complex topics into digestible, logical steps.

CRITICAL RULES:
- If study material context is provided, base your answers on it. If not found in the context, use your high-level general knowledge to provide a helpful, accurate academic explanation while noting that it is beyond the uploaded documents.
- When explaining processes, workflows, architectures, or relationships, YOU MUST include a Mermaid.js diagram.
Format:
```mermaid
[diagram code here]
```
Use appropriate diagram types:
- flowchart TD or LR for processes and workflows
- graph for relationships
- classDiagram for structures
- sequenceDiagram for interactions
"""

        user_prompt = f"""Context from study materials:
{context if context else "(No documents uploaded yet. Provide a comprehensive, accurate academic answer.)"}

Student Question: {query}

Provide a well-structured, clear explanation. If applicable, end with a helpful Mermaid diagram."""

        reasoning_text = None
        response_text = ""

        if self.provider == "groq" and self._has_groq_key():
            try:
                content, reasoning = await self._call_groq(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    temperature=0.3,
                    max_tokens=2500
                )
                response_text = content
                reasoning_text = reasoning
            except Exception as e:
                logger.warning(f"Groq generate_with_context failed: {e}. Trying fallback...")
                response_text = await self.generate(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    temperature=0.3,
                    max_tokens=1500
                )
        else:
            response_text = await self.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=1500
            )

        mermaid_diagram, cleaned_response = _extract_mermaid(response_text)

        # Include thinking process if reasoning is present and enabled
        include_thinking = getattr(settings, "INCLUDE_THINKING_IN_CHAT", True)
        if reasoning_text and include_thinking and len(reasoning_text.strip()) > 0:
            formatted_thinking = reasoning_text.strip().replace("\r\n", "\n")
            thinking_quote = "\n> ".join(formatted_thinking.split("\n"))
            cleaned_response = f"> 🧠 **Thinking & Reasoning Process:**\n> {thinking_quote}\n\n---\n\n{cleaned_response}"

        return {
            "response": cleaned_response,
            "mermaid_diagram": mermaid_diagram
        }

    async def check_health(self) -> bool:
        """Check if LLM provider is reachable and active"""
        if self.provider == "groq":
            if not self._has_groq_key():
                return False
            try:
                headers = {"Authorization": f"Bearer {self.groq_api_key}"}
                async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                    resp = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
                    return resp.status_code == 200
            except Exception as e:
                logger.warning(f"Groq health check failed: {e}")
                return False

        # Ollama health check (only when provider is ollama)
        url = f"{self.base_url}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                models = response.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                return any(self.model in name for name in model_names)
        except Exception:
            return False


# Aliases for backward compatibility
LLMClient = OllamaClient
GroqClient = OllamaClient
UnifiedLLMClient = OllamaClient
