from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database.database import get_db
from app.models.models import LandRecord, User
from app.schemas.schemas import LandRecordOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/land-records", tags=["Land Records"])


def _apply_role_filter(query, current_user: User):
    """Apply role-based data access control"""
    if current_user.role == "CITIZEN":
        # Citizens only see records linked to their account
        query = query.filter(LandRecord.citizen_id == current_user.id)
    # Officers, Reviewers, Admins see all records
    return query


@router.get("/", response_model=List[LandRecordOut])
def list_land_records(
    skip: int = 0, limit: int = 50,
    status: Optional[str] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(LandRecord)
    q = _apply_role_filter(q, current_user)
    if status:
        q = q.filter(LandRecord.status == status)
    if district:
        q = q.filter(LandRecord.district.ilike(f"%{district}%"))
    if state:
        q = q.filter(LandRecord.state.ilike(f"%{state}%"))
    return q.order_by(LandRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/search", response_model=List[LandRecordOut])
def search_land_records(
    q: str = Query(..., min_length=1),
    field: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LandRecord)
    query = _apply_role_filter(query, current_user)

    if field == "owner_name":
        query = query.filter(LandRecord.owner_name.ilike(f"%{q}%"))
    elif field == "khata_number":
        query = query.filter(LandRecord.khata_number.ilike(f"%{q}%"))
    elif field == "khasra_number":
        query = query.filter(LandRecord.khasra_number.ilike(f"%{q}%"))
    elif field == "plot_number":
        query = query.filter(LandRecord.plot_number.ilike(f"%{q}%"))
    elif field == "village":
        query = query.filter(LandRecord.village.ilike(f"%{q}%"))
    elif field == "district":
        query = query.filter(LandRecord.district.ilike(f"%{q}%"))
    elif field == "document_number":
        query = query.filter(LandRecord.document_number.ilike(f"%{q}%"))
    else:
        query = query.filter(
            or_(
                LandRecord.owner_name.ilike(f"%{q}%"),
                LandRecord.khata_number.ilike(f"%{q}%"),
                LandRecord.khasra_number.ilike(f"%{q}%"),
                LandRecord.plot_number.ilike(f"%{q}%"),
                LandRecord.village.ilike(f"%{q}%"),
                LandRecord.district.ilike(f"%{q}%"),
                LandRecord.document_number.ilike(f"%{q}%"),
                LandRecord.record_id.ilike(f"%{q}%"),
            )
        )
    return query.limit(100).all()


@router.get("/{record_id}", response_model=LandRecordOut)
def get_land_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(LandRecord).filter(LandRecord.record_id == record_id).first()
    if not rec:
        rec = db.query(LandRecord).filter(
            LandRecord.id == int(record_id) if record_id.isdigit() else -1
        ).first()
    if not rec:
        raise HTTPException(404, "Land record not found")

    # Access control: citizens can only view their own records
    if current_user.role == "CITIZEN" and rec.citizen_id != current_user.id:
        raise HTTPException(403, "You are not authorized to view this record")

    return rec