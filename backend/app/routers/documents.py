from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pathlib import Path
import shutil
import uuid
import logging

from app.models.schemas import (
    DocumentUploadResponse,
    DocumentListItem,
    DocumentListResponse,
)
from app.services.document_processor import DocumentProcessor
from app.services.rag_engine import RAGEngine
from app.services.document_registry import DocumentRegistry
from app.config import settings
from app.core.security import get_current_user, UserPayload, Role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

document_processor = DocumentProcessor()
rag_engine = RAGEngine()
document_registry = DocumentRegistry()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: UserPayload = Depends(get_current_user)
):
    """Upload and process a document (PDF, PPTX, DOCX) with input validation and security checks"""
    # 1. Sanitize filename to prevent path traversal
    safe_filename = Path(file.filename).name if file.filename else "unnamed_document"
    allowed_extensions = {".pdf", ".pptx", ".ppt", ".docx", ".doc", ".txt"}
    file_extension = Path(safe_filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(allowed_extensions))}"
        )

    temp_file_path = None
    try:
        file_id = str(uuid.uuid4())
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        temp_file_path = settings.UPLOAD_DIR / f"{file_id}_{safe_filename}"

        # Write uploaded contents
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = temp_file_path.stat().st_size
        max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

        # 2. Reject empty files
        if file_size == 0:
            temp_file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded. Please upload a document with readable content."
            )

        # 3. Reject oversized files
        if file_size > max_size:
            temp_file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({file_size / (1024*1024):.1f}MB). Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # 4. Process document
        processed_data = await document_processor.process_document(
            temp_file_path,
            safe_filename,
            document_id=file_id,
        )

        chunks_indexed = await rag_engine.index_document(processed_data["chunks"])

        metadata = processed_data.get("metadata", {})
        await document_registry.add_document(
            document_id=processed_data["document_id"],
            filename=safe_filename,
            file_type=metadata.get("file_type", file_extension.lstrip(".")),
            file_size=file_size,
            chunks_created=chunks_indexed,
            total_pages=metadata.get("total_pages"),
        )

        return DocumentUploadResponse(
            document_id=processed_data["document_id"],
            filename=safe_filename,
            file_size=file_size,
            chunks_created=chunks_indexed,
            status="success",
            message=f"Document processed successfully. {chunks_indexed} chunks indexed."
        )

    except HTTPException:
        if temp_file_path and temp_file_path.exists():
            temp_file_path.unlink(missing_ok=True)
        raise

    except ValueError as e:
        if temp_file_path and temp_file_path.exists():
            temp_file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        if temp_file_path and temp_file_path.exists():
            temp_file_path.unlink(missing_ok=True)
        logger.error(f"Document processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/count")
async def get_document_count():
    """Get total number of indexed chunks"""
    count = rag_engine.vector_store.get_document_count()
    return {"total_chunks": count}


@router.get("", response_model=DocumentListResponse)
async def list_documents(current_user: UserPayload = Depends(get_current_user)):
    """Get uploaded documents for document-scoped chat selection."""
    documents = await document_registry.list_documents()
    return DocumentListResponse(
        documents=[DocumentListItem(**doc) for doc in documents],
        total=len(documents),
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """Delete a document and its associated chunks with ID validation"""
    # Validate document_id format
    if not document_id or ".." in document_id or "/" in document_id or "\\" in document_id:
        raise HTTPException(status_code=400, detail="Invalid document ID format")

    try:
        filename_from_disk = None
        for file_path in settings.UPLOAD_DIR.glob(f"{document_id}_*"):
            if file_path.is_file():
                filename_from_disk = file_path.name.replace(f"{document_id}_", "", 1)
                break

        success = await document_registry.delete_document(document_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Document with ID {document_id} not found"
            )

        if filename_from_disk:
            file_path = settings.UPLOAD_DIR / f"{document_id}_{filename_from_disk}"
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception as e:
                    logger.warning(f"Failed to delete file from disk: {e}")

        try:
            await rag_engine.remove_document(document_id)
        except Exception as e:
            logger.warning(f"Failed to remove document from RAG engine: {e}")

        file_name = filename_from_disk or "unknown"
        return {"message": f"Document '{file_name}' deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
