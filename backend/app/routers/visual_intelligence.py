from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import aiosqlite
import logging

from app.models.visual_schemas import (
    ConceptResponse, 
    VisualExplanationResponse,
    RealityConnectionResponse
)
from app.services.visual_engine import VisualEngine
from app.services.reality_engine import RealityEngine
from app.services.llm_client import LLMClient
from app.services.database import get_database

router = APIRouter(prefix="/api/v1/visual", tags=["Visual Intelligence Studio"])
logger = logging.getLogger(__name__)

visual_engine = VisualEngine()
reality_engine = RealityEngine()
llm_client = LLMClient()

class RealityStreamRequest(BaseModel):
    concept: str
    depth: Optional[str] = "comprehensive"

@router.post("/extract/{document_id}", response_model=List[Dict[str, Any]])
async def extract_concepts_from_document(document_id: str):
    """
    Extract structured learning concepts from an uploaded document.
    """
    db = await get_database().connect()
    # Fetch document content or metadata
    async with db.execute("SELECT filename FROM documents WHERE id = ?", (document_id,)) as cursor:
        doc = await cursor.fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        filename = doc[0]

    # Fetch text from vector store or database
    try:
        from app.services.vector_store import VectorStore
        vs = VectorStore()
        chunks = vs.collection.get(
            where={"document_id": document_id},
            limit=20,
            include=["documents"]
        )
        texts = chunks.get("documents", []) if chunks else []
        combined_text = "\n\n".join(texts)
    except Exception as e:
        logger.warning(f"Could not load chunks from vector store: {e}")
        combined_text = f"Study document {filename} focusing on fundamental principles, definitions, and operational mechanisms."

    concepts = await visual_engine.extract_concepts_from_document(
        document_id=document_id,
        document_text=combined_text,
        filename=filename
    )
    return concepts

@router.get("/concepts/{document_id}", response_model=List[Dict[str, Any]])
async def get_concepts_for_document(document_id: str):
    """
    Get all extracted concepts for a given document.
    """
    return await visual_engine.get_concepts_for_document(document_id)

@router.get("/explanation/{concept_id}", response_model=VisualExplanationResponse)
async def get_visual_explanation(concept_id: str):
    """
    Generate or retrieve animated visual scene specification,
    interactive labels, multi-level explanations, and knowledge check for a concept.
    """
    try:
        return await visual_engine.generate_visual_explanation(concept_id)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating visual explanation: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate visual explanation")

@router.post("/reality/stream")
async def stream_concept_reality(request: RealityStreamRequest):
    """
    Stream real-time Concept-to-Reality breakdown as Server-Sent Events (SSE).
    """
    system_prompt = (
        "You are the GuruCortex Concept-to-Reality Navigator and Visual Intelligence Companion. "
        "Provide an engaging, comprehensive breakdown connecting classroom concepts to real-world applications, "
        "cutting-edge industries, physical engineering systems, and hands-on demonstrations."
    )
    prompt = (
        f"Analyze the concept '{request.concept}' with depth '{request.depth}'.\n"
        "Provide a structured real-world reality breakdown including:\n"
        "1. Core Principle & Intuition\n"
        "2. Real-World Applications & Industry Deployments\n"
        "3. Products, Systems, and Research Frontiers\n"
        "4. Hands-on Mini-Experiment"
    )

    async def event_generator():
        async for token in llm_client.stream_generate(prompt, system_prompt):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/reality/{topic_name}", response_model=RealityConnectionResponse)
async def get_concept_reality_connection(topic_name: str, concept_id: Optional[str] = None):
    """
    Generate or retrieve real-world applications, industries, products,
    case studies, citations, and student mini-projects for a concept/topic.
    """
    try:
        return await reality_engine.generate_reality_connection(topic_name, concept_id)
    except Exception as e:
        logger.error(f"Error in Concept-to-Reality navigator: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect concept to reality")
