"""
Citizen portal API routes.
All endpoints require CITIZEN role.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
import re
from typing import List, Optional
from app.database.database import get_db
from app.models.models import LandRecord, Document, Notification, CorrectionRequest, User
from app.schemas.schemas import LandRecordOut, DocumentOut, NotificationOut, CorrectionRequestCreate, CorrectionRequestOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/citizen", tags=["Citizen Portal"])


def require_citizen(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: only CITIZEN role allowed"""
    if current_user.role != "CITIZEN":
        raise HTTPException(status_code=403, detail="This endpoint is for citizens only.")
    return current_user


@router.get("/my-records", response_model=List[LandRecordOut])
def get_my_records(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    """Get all land records linked to the logged-in citizen"""
    q = db.query(LandRecord).filter(LandRecord.citizen_id == current_user.id)
    if status:
        q = q.filter(LandRecord.status == status)
    return q.order_by(LandRecord.created_at.desc()).all()


@router.get("/my-records/{record_id}", response_model=LandRecordOut)
def get_my_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    """Get a specific land record for the citizen"""
    rec = db.query(LandRecord).filter(LandRecord.record_id == record_id).first()
    if not rec and record_id.isdigit():
        rec = db.query(LandRecord).filter(LandRecord.id == int(record_id)).first()
    if not rec:
        raise HTTPException(404, "Land record not found")
    if rec.citizen_id != current_user.id:
        raise HTTPException(403, "You are not authorized to view this record")
    return rec


@router.get("/my-documents", response_model=List[DocumentOut])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    """Get all documents uploaded by the citizen"""
    return db.query(Document).filter(
        Document.uploaded_by == current_user.id
    ).order_by(Document.uploaded_at.desc()).all()


@router.get("/my-corrections", response_model=List[CorrectionRequestOut])
def get_my_corrections(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    """Get all correction requests submitted by the citizen"""
    return db.query(CorrectionRequest).filter(
        CorrectionRequest.citizen_id == current_user.id
    ).order_by(CorrectionRequest.created_at.desc()).all()


@router.post("/correction-request", response_model=CorrectionRequestOut)
def submit_correction_request(
    data: CorrectionRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    """Citizen submits a correction request for a land record"""
    # Verify the record belongs to this citizen
    rec = db.query(LandRecord).filter(LandRecord.id == data.land_record_id).first()
    if not rec:
        raise HTTPException(404, "Land record not found")
    if rec.citizen_id != current_user.id:
        raise HTTPException(403, "You can only request corrections for your own records")

    cr = CorrectionRequest(
        land_record_id=data.land_record_id,
        citizen_id=current_user.id,
        field_name=data.field_name,
        current_value=data.current_value,
        proposed_value=data.proposed_value,
        reason=data.reason,
        status="SUBMITTED"
    )
    db.add(cr)

    # Notify the officer team
    officer_notif = Notification(
        user_id=None,  # system-wide for officers/admin
        title="Correction Request Received",
        message=f"Citizen {current_user.name} submitted a correction for record #{rec.record_id} (Field: {data.field_name}).",
        type="INFO"
    )
    db.add(officer_notif)
    db.commit()
    db.refresh(cr)
    return cr


@router.get("/my-notifications", response_model=List[NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()


# ── Officer/Admin endpoints for corrections ──────────────────────────────────

@router.get("/corrections/all")
def list_all_corrections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Officer/Admin: list all pending correction requests"""
    if current_user.role not in ["ADMIN", "OFFICER", "REVIEWER"]:
        raise HTTPException(403, "Insufficient permissions")
    corrections = db.query(CorrectionRequest).order_by(CorrectionRequest.created_at.desc()).all()
    result = []
    for cr in corrections:
        rec = db.query(LandRecord).filter(LandRecord.id == cr.land_record_id).first()
        citizen = db.query(User).filter(User.id == cr.citizen_id).first()
        result.append({
            "id": cr.id,
            "land_record_id": cr.land_record_id,
            "record_id": rec.record_id if rec else None,
            "citizen_name": citizen.name if citizen else "Unknown",
            "citizen_email": citizen.email if citizen else "",
            "field_name": cr.field_name,
            "current_value": cr.current_value,
            "proposed_value": cr.proposed_value,
            "reason": cr.reason,
            "status": cr.status,
            "created_at": cr.created_at.isoformat(),
            "reviewed_at": cr.reviewed_at.isoformat() if cr.reviewed_at else None,
            "review_notes": cr.review_notes,
        })
    return result


@router.put("/corrections/{correction_id}/process")
def process_correction(
    correction_id: int,
    action: str = Query(..., description="APPROVED | REJECTED | NEEDS_MORE_INFORMATION"),
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Officer/Admin processes a correction request"""
    if current_user.role not in ["ADMIN", "OFFICER", "REVIEWER"]:
        raise HTTPException(403, "Insufficient permissions")
    if action not in ["APPROVED", "REJECTED", "NEEDS_MORE_INFORMATION"]:
        raise HTTPException(400, "Invalid action. Use APPROVED, REJECTED, or NEEDS_MORE_INFORMATION")

    cr = db.query(CorrectionRequest).filter(CorrectionRequest.id == correction_id).first()
    if not cr:
        raise HTTPException(404, "Correction request not found")

    cr.status = action
    cr.reviewed_by = current_user.id
    cr.reviewed_at = datetime.utcnow()
    cr.review_notes = notes

    # If approved, apply the correction to the land record
    if action == "APPROVED":
        rec = db.query(LandRecord).filter(LandRecord.id == cr.land_record_id).first()
        if rec:
            if cr.field_name == "area":
                m = re.search(r"(\d+(?:\.\d+)?)", str(cr.proposed_value))
                if m:
                    try:
                        rec.area = float(m.group(1))
                    except ValueError:
                        pass
            elif hasattr(rec, cr.field_name):
                setattr(rec, cr.field_name, cr.proposed_value)
            # If record was in NEEDS_CORRECTION, move back to PENDING_REVIEW
            if rec.status == "NEEDS_CORRECTION":
                rec.status = "PENDING_REVIEW"

    # Notify the citizen
    msg_map = {
        "APPROVED": f"Your correction request for field '{cr.field_name}' has been approved and applied to your record.",
        "REJECTED": f"Your correction request for field '{cr.field_name}' has been rejected. Notes: {notes or 'No additional notes.'}",
        "NEEDS_MORE_INFORMATION": f"Your correction request for field '{cr.field_name}' requires additional information. Please contact your local land office.",
    }
    notif = Notification(
        user_id=cr.citizen_id,
        title=f"Correction Request {action.replace('_', ' ').title()}",
        message=msg_map[action],
        type="SUCCESS" if action == "APPROVED" else ("WARNING" if action == "NEEDS_MORE_INFORMATION" else "INFO")
    )
    db.add(notif)
    db.commit()
    return {"success": True, "status": action, "message": "Correction request processed successfully"}
