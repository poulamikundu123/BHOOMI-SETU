import os
import uuid
import threading
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models.models import Document, ExtractedField, ValidationResult
from app.schemas.schemas import DocumentOut, ExtractedFieldOut, ValidationResultOut
from app.auth.auth import get_current_user
from app.models.models import User
from app.services.document_service import generate_doc_id, process_document_pipeline
from app.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "application/pdf"}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".pdf"}

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTS)}")

    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, detail=f"File too large. Max: {settings.MAX_FILE_SIZE_MB}MB")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    doc_id = generate_doc_id()
    safe_name = f"{doc_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    is_citizen = (current_user.role == "CITIZEN")
    doc = Document(
        doc_id=doc_id,
        filename=file.filename,
        file_path=file_path,
        status="UPLOADED",
        uploaded_by=current_user.id,
        file_size=len(content),
        is_demo=settings.DEMO_MODE,
        citizen_upload=is_citizen
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Run pipeline in background
    doc_db_id = doc.id
    def run_pipeline():
        from app.database.database import SessionLocal
        bg_db = SessionLocal()
        try:
            process_document_pipeline(doc_db_id, bg_db)
        finally:
            bg_db.close()
    t = threading.Thread(target=run_pipeline, daemon=True)
    t.start()

    return {
        "success": True,
        "doc_id": doc_id,
        "document_id": doc.id,
        "filename": file.filename,
        "status": "UPLOADED",
        "message": "Document uploaded and processing started",
        "demo_mode": settings.DEMO_MODE
    }

@router.get("/", response_model=List[DocumentOut])
def list_documents(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Document)
    if status:
        q = q.filter(Document.status == status)
    return q.order_by(Document.uploaded_at.desc()).offset(skip).limit(limit).all()

@router.get("/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    return doc

@router.get("/{doc_id}/status")
def get_document_status(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    progress_map = {
        "UPLOADED": 5, "PREPROCESSING": 20, "LAYOUT_DETECTION": 35,
        "OCR": 50, "NLP": 65, "VALIDATION": 80, "REVIEW": 90,
        "COMPLETED": 100, "FAILED": 100
    }
    return {
        "doc_id": doc_id,
        "status": doc.status,
        "progress": progress_map.get(doc.status, 0),
        "overall_confidence": doc.overall_confidence,
        "language": doc.language,
        "processed_at": doc.processed_at.isoformat() if doc.processed_at else None
    }

@router.get("/{doc_id}/fields", response_model=List[ExtractedFieldOut])
def get_document_fields(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    return db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()

@router.get("/{doc_id}/validations", response_model=List[ValidationResultOut])
def get_document_validations(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    return db.query(ValidationResult).filter(ValidationResult.document_id == doc.id).all()

@router.get("/{doc_id}/ocr-text")
def get_ocr_text(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    return {"doc_id": doc_id, "text": doc.ocr_raw_text, "language": doc.language}

@router.get("/{doc_id}/file")
def get_document_file(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    if doc.file_path and os.path.exists(doc.file_path):
        return FileResponse(doc.file_path, filename=doc.filename)
    raise HTTPException(404, detail="File not found on server")

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "OFFICER"]:
        raise HTTPException(403, detail="Insufficient permissions")
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, detail="Document not found")
    
    # Unlink any associated land record so foreign key isn't broken
    from app.models.models import LandRecord, Review
    rec = db.query(LandRecord).filter(LandRecord.document_id == doc.id).first()
    if rec:
        rec.document_id = None
    db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).delete()
    db.query(ValidationResult).filter(ValidationResult.document_id == doc.id).delete()
    db.query(Review).filter(Review.document_id == doc.id).delete()

    db.delete(doc)
    db.commit()
    return {"success": True, "message": f"Document {doc_id} deleted"}