from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database.database import get_db
from app.models.models import Document, LandRecord, ExtractedField, Notification, User
from app.auth.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns stats scoped to the user's role"""

    if current_user.role == "CITIZEN":
        # Citizen dashboard: only their records
        my_records = db.query(LandRecord).filter(LandRecord.citizen_id == current_user.id)
        total_records = my_records.count()
        verified = my_records.filter(LandRecord.status == "VERIFIED").count()
        pending_review = my_records.filter(LandRecord.status == "PENDING_REVIEW").count()
        needs_correction = my_records.filter(LandRecord.status == "NEEDS_CORRECTION").count()

        # Citizen's documents
        my_docs = db.query(Document).filter(Document.uploaded_by == current_user.id)
        total_docs = my_docs.count()
        completed_docs = my_docs.filter(Document.status == "COMPLETED").count()
        processing_docs = my_docs.filter(Document.status.in_(
            ["UPLOADED", "PREPROCESSING", "LAYOUT_DETECTION", "OCR", "NLP", "VALIDATION"]
        )).count()

        # Citizen's unread notifications
        unread_notifs = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()

        return {
            "role": "CITIZEN",
            "total_land_records": total_records,
            "verified_records": verified,
            "pending_review": pending_review,
            "needs_correction": needs_correction,
            "total_documents": total_docs,
            "completed_documents": completed_docs,
            "processing_documents": processing_docs,
            "unread_notifications": unread_notifs,
        }

    # Admin/Officer/Reviewer: system-wide stats
    total_docs = db.query(Document).count()
    completed = db.query(Document).filter(Document.status == "COMPLETED").count()
    review = db.query(Document).filter(Document.status == "REVIEW").count()
    failed = db.query(Document).filter(Document.status == "FAILED").count()
    processing = db.query(Document).filter(Document.status.in_(
        ["PREPROCESSING", "LAYOUT_DETECTION", "OCR", "NLP", "VALIDATION"]
    )).count()
    uploaded_only = db.query(Document).filter(Document.status == "UPLOADED").count()

    total_records = db.query(LandRecord).count()
    verified = db.query(LandRecord).filter(LandRecord.status == "VERIFIED").count()
    pending_review_records = db.query(LandRecord).filter(LandRecord.status == "PENDING_REVIEW").count()
    needs_correction = db.query(LandRecord).filter(LandRecord.status == "NEEDS_CORRECTION").count()
    processing_records = db.query(LandRecord).filter(LandRecord.status == "PROCESSING").count()

    avg_confidence_row = db.query(func.avg(Document.overall_confidence)).filter(
        Document.overall_confidence.isnot(None)
    ).scalar()
    avg_confidence = round(float(avg_confidence_row or 0), 3)

    avg_ocr = db.query(func.avg(Document.ocr_confidence)).filter(Document.ocr_confidence.isnot(None)).scalar()
    avg_extraction = db.query(func.avg(Document.extraction_confidence)).filter(Document.extraction_confidence.isnot(None)).scalar()
    avg_validation = db.query(func.avg(Document.validation_confidence)).filter(Document.validation_confidence.isnot(None)).scalar()

    # Confidence distribution
    conf_buckets = {"90-100%": 0, "75-89%": 0, "55-74%": 0, "<55%": 0}
    docs = db.query(Document.overall_confidence).filter(Document.overall_confidence.isnot(None)).all()
    for (c,) in docs:
        if c >= 0.90:
            conf_buckets["90-100%"] += 1
        elif c >= 0.75:
            conf_buckets["75-89%"] += 1
        elif c >= 0.55:
            conf_buckets["55-74%"] += 1
        else:
            conf_buckets["<55%"] += 1

    # By language
    lang_counts = {}
    for (lang, cnt) in db.query(Document.language, func.count(Document.id)).group_by(Document.language).all():
        if lang:
            lang_counts[lang] = cnt

    # By district
    dist_counts = {}
    for (dist, cnt) in db.query(LandRecord.district, func.count(LandRecord.id)).group_by(LandRecord.district).all():
        if dist:
            dist_counts[dist] = cnt

    # By state
    state_counts = {}
    for (state, cnt) in db.query(LandRecord.state, func.count(LandRecord.id)).group_by(LandRecord.state).all():
        if state:
            state_counts[state] = cnt

    # By land type
    type_counts = {}
    for (ltype, cnt) in db.query(LandRecord.land_type, func.count(LandRecord.id)).group_by(LandRecord.land_type).all():
        if ltype:
            type_counts[ltype] = cnt

    # Total citizens
    total_citizens = db.query(User).filter(User.role == "CITIZEN").count()

    return {
        "role": current_user.role,
        "total_documents": total_docs,
        "completed": completed,
        "pending_review": review,
        "failed": failed,
        "processing": processing,
        "uploaded_only": uploaded_only,
        "total_land_records": total_records,
        "verified_records": verified,
        "pending_review_records": pending_review_records,
        "needs_correction": needs_correction,
        "processing_records": processing_records,
        "avg_confidence": avg_confidence,
        "avg_ocr_confidence": round(float(avg_ocr or 0), 3),
        "avg_extraction_confidence": round(float(avg_extraction or 0), 3),
        "avg_validation_confidence": round(float(avg_validation or 0), 3),
        "confidence_distribution": conf_buckets,
        "documents_by_language": lang_counts,
        "records_by_district": dist_counts,
        "records_by_state": state_counts,
        "records_by_land_type": type_counts,
        "total_citizens": total_citizens,
        "validation_stats": {
            "total_fields": db.query(ExtractedField).count(),
            "valid_fields": db.query(ExtractedField).filter(ExtractedField.status == "VALID").count(),
            "warning_fields": db.query(ExtractedField).filter(ExtractedField.status == "WARNING").count(),
            "invalid_fields": db.query(ExtractedField).filter(ExtractedField.status == "INVALID").count(),
            "needs_review": db.query(ExtractedField).filter(ExtractedField.status == "NEEDS_REVIEW").count(),
        }
    }