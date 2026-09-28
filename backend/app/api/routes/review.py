from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.models import Document, ExtractedField, Review, LandRecord, Notification
from app.schemas.schemas import ReviewCreate, ReviewOut
from app.auth.auth import get_current_user
from app.models.models import User
from datetime import datetime

router = APIRouter(prefix="/review", tags=["Review"])

@router.get("/queue")
def get_review_queue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all documents and fields that need human review"""
    from sqlalchemy import or_
    review_docs = db.query(Document).filter(Document.status == "REVIEW").all()
    queue = []
    for doc in review_docs:
        flagged_fields = db.query(ExtractedField).filter(
            ExtractedField.document_id == doc.id,
            or_(
                ExtractedField.confidence < 0.75,
                ExtractedField.status.in_(["NEEDS_REVIEW", "WARNING", "INVALID"])
            )
        ).all()
        if not flagged_fields:
            flagged_fields = db.query(ExtractedField).filter(
                ExtractedField.document_id == doc.id
            ).all()
        for f in flagged_fields:
            queue.append({
                "doc_id": doc.doc_id,
                "document_id": doc.id,
                "field_name": f.field_name,
                "field_value": f.field_value,
                "confidence": f.confidence,
                "status": f.status,
                "language": doc.language,
                "filename": doc.filename,
            })
    return queue

@router.get("/{doc_id}")
def get_review_detail(doc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    fields = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()
    reviews = db.query(Review).filter(Review.document_id == doc.id).all()
    return {
        "document": {
            "id": doc.id,
            "doc_id": doc.doc_id,
            "filename": doc.filename,
            "status": doc.status,
            "language": doc.language,
            "overall_confidence": doc.overall_confidence,
            "ocr_text": doc.ocr_raw_text,
        },
        "fields": [{"id": f.id, "field_name": f.field_name, "field_value": f.field_value,
                     "confidence": f.confidence, "status": f.status} for f in fields],
        "reviews": [{"field_name": r.field_name, "old_value": r.old_value,
                     "new_value": r.new_value, "action": r.action} for r in reviews]
    }

@router.post("/{doc_id}/correct")
def correct_field(
    doc_id: str,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    field = db.query(ExtractedField).filter(
        ExtractedField.document_id == doc.id,
        ExtractedField.field_name == data.field_name
    ).first()
    old_value = field.field_value if field else None
    if field:
        field.field_value = data.new_value
        field.is_corrected = True
        field.confidence = 1.0
        field.status = "VALID"
    review = Review(
        document_id=doc.id,
        reviewer_id=current_user.id,
        field_name=data.field_name,
        old_value=old_value,
        new_value=data.new_value,
        action="CORRECTED",
        reason=data.reason
    )
    db.add(review)
    db.commit()
    return {"success": True, "field": data.field_name, "new_value": data.new_value}

@router.post("/{doc_id}/approve")
def approve_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "OFFICER", "REVIEWER"]:
        raise HTTPException(403, "Insufficient permissions")
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    doc.status = "COMPLETED"
    # Update confidence to reflect human review
    doc.overall_confidence = min(1.0, (doc.overall_confidence or 0.7) + 0.15)
    doc.processed_at = datetime.utcnow()

    # Create/update land record
    from app.models.models import LandRecord
    from app.services.document_service import generate_record_id
    fields = db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).all()
    field_map = {f.field_name: f.field_value for f in fields}
    existing = db.query(LandRecord).filter(LandRecord.document_id == doc.id).first()
    lr_record_id = None
    raw_area = field_map.get("area") or field_map.get("plot_area")
    parsed_area = None
    if raw_area is not None:
        import re
        m = re.search(r"(\d+(?:\.\d+)?)", str(raw_area))
        if m:
            try:
                parsed_area = float(m.group(1))
            except ValueError:
                parsed_area = None

    if existing:
        existing.status = "VERIFIED"
        existing.owner_name = field_map.get("owner_name", existing.owner_name)
        if "father_name" in field_map: existing.father_name = field_map["father_name"]
        if "khata_number" in field_map: existing.khata_number = field_map["khata_number"]
        if "khasra_number" in field_map: existing.khasra_number = field_map["khasra_number"]
        if "plot_number" in field_map: existing.plot_number = field_map["plot_number"]
        if "survey_number" in field_map: existing.survey_number = field_map["survey_number"]
        if "village" in field_map: existing.village = field_map["village"]
        if "mouza" in field_map: existing.mouza = field_map["mouza"]
        if "block" in field_map: existing.block = field_map["block"]
        if "district" in field_map: existing.district = field_map["district"]
        if "state" in field_map: existing.state = field_map["state"]
        if "unit" in field_map: existing.unit = field_map["unit"]
        if "land_type" in field_map: existing.land_type = field_map["land_type"]
        if parsed_area is not None:
            existing.area = parsed_area
        if doc.citizen_upload and doc.uploaded_by and not existing.citizen_id:
            existing.citizen_id = doc.uploaded_by
        lr_record_id = existing.record_id
    else:
        import random
        lr = LandRecord(
            record_id=generate_record_id(),
            document_id=doc.id,
            citizen_id=doc.uploaded_by if doc.citizen_upload else None,
            owner_name=field_map.get("owner_name", "Unknown"),
            father_name=field_map.get("father_name"),
            khata_number=field_map.get("khata_number"),
            khasra_number=field_map.get("khasra_number"),
            survey_number=field_map.get("survey_number"),
            plot_number=field_map.get("plot_number"),
            village=field_map.get("village"),
            mouza=field_map.get("mouza"),
            block=field_map.get("block"),
            district=field_map.get("district"),
            state=field_map.get("state"),
            area=parsed_area,
            unit=field_map.get("unit", "Acre"),
            land_type=field_map.get("land_type"),
            registration_date=field_map.get("registration_date"),
            mutation_number=field_map.get("mutation_number"),
            document_number=field_map.get("document_number"),
            geo_lat=26.7 + random.uniform(-0.5, 0.5),
            geo_lng=88.4 + random.uniform(-0.5, 0.5),
            status="VERIFIED"
        )
        db.add(lr)
        db.flush()
        lr_record_id = lr.record_id

    # System-wide notification for admins/officers
    sys_notif = Notification(
        user_id=None,
        title="Document Approved",
        message=f"Document {doc_id} has been approved by {current_user.name}. Record is now verified.",
        type="SUCCESS",
        doc_id=doc_id
    )
    db.add(sys_notif)

    # Notify the citizen who uploaded if applicable
    if doc.citizen_upload and doc.uploaded_by:
        plot = field_map.get('plot_number', '')
        village = field_map.get('village', '')
        citizen_notif = Notification(
            user_id=doc.uploaded_by,
            title="Your Land Record is Verified ✓",
            message=f"Your document {doc_id} has been reviewed and your land record{f' for Plot {plot}, {village}' if plot else ''} is now officially verified.",
            type="SUCCESS",
            doc_id=doc_id
        )
        db.add(citizen_notif)

    db.commit()
    return {"success": True, "doc_id": doc_id, "new_status": "COMPLETED", "record_id": lr_record_id}

@router.post("/{doc_id}/reject")
def reject_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "OFFICER", "REVIEWER"]:
        raise HTTPException(403, "Insufficient permissions")
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    doc.status = "FAILED"
    # Update land record if exists
    existing_lr = db.query(LandRecord).filter(LandRecord.document_id == doc.id).first()
    if existing_lr:
        existing_lr.status = "REJECTED"
    # Notify citizen if applicable
    if doc.citizen_upload and doc.uploaded_by:
        citizen_notif = Notification(
            user_id=doc.uploaded_by,
            title="Document Could Not Be Verified",
            message=f"Your document {doc_id} could not be verified. Please resubmit with a clearer scan or contact your local land office for assistance.",
            type="WARNING",
            doc_id=doc_id
        )
        db.add(citizen_notif)
    db.commit()
    return {"success": True, "doc_id": doc_id, "new_status": "FAILED"}