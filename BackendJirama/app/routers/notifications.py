from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[schemas.NotificationOut])
def list_notifications(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Notification)
    if user_id:
        q = q.filter(models.Notification.user_id == user_id)
    return q.order_by(models.Notification.id.desc()).all()

@router.post("/", response_model=schemas.NotificationOut)
def create_notification(payload: schemas.NotificationCreate, db: Session = Depends(get_db)):
    n = models.Notification(user_id=payload.user_id, message=payload.message)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n

@router.put("/{notif_id}/lu", response_model=schemas.NotificationOut)
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(models.Notification).get(notif_id)
    if not n:
        raise HTTPException(404, "Notification introuvable")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n
