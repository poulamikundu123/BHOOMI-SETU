from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database.database import get_db
from app.models.models import Notification, User
from app.schemas.schemas import NotificationOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for current user. Admin/Officer see system-wide + their own."""
    if current_user.role in ["ADMIN", "OFFICER", "REVIEWER"]:
        # Staff see their own + global notifications (user_id is None)
        notifs = db.query(Notification).filter(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id.is_(None)
            )
        ).order_by(Notification.created_at.desc()).limit(50).all()
    else:
        # Citizens only see their own notifications
        notifs = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(Notification.created_at.desc()).limit(50).all()
    return notifs


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["ADMIN", "OFFICER", "REVIEWER"]:
        count = db.query(Notification).filter(
            Notification.is_read == False,
            or_(Notification.user_id == current_user.id, Notification.user_id.is_(None))
        ).count()
    else:
        count = db.query(Notification).filter(
            Notification.is_read == False,
            Notification.user_id == current_user.id
        ).count()
    return {"count": count}


@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}


@router.put("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["ADMIN", "OFFICER", "REVIEWER"]:
        db.query(Notification).filter(
            Notification.is_read == False,
            or_(Notification.user_id == current_user.id, Notification.user_id.is_(None))
        ).update({"is_read": True}, synchronize_session=False)
    else:
        db.query(Notification).filter(
            Notification.is_read == False,
            Notification.user_id == current_user.id
        ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"success": True}