from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..lib.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    out = []
    for u in users:
        out.append({
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "service": u.service.nom if u.service else None,
            "created_at": u.created_at,
            "is_active": u.is_active
        })
    return out

@router.post("/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    db_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role,
        service_id=user.service_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {
        "id": db_user.id,
        "email": db_user.email,
        "role": db_user.role,
        "service": db_user.service.nom if db_user.service else None,
        "created_at": db_user.created_at,
        "is_active": db_user.is_active
    }

@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: dict, db: Session = Depends(get_db)):
    u = db.query(models.User).get(user_id)
    if not u:
        raise HTTPException(404, "Utilisateur non trouvé")
    if "email" in payload:
        u.email = payload["email"]
    if "role" in payload:
        u.role = payload["role"]
    if "service" in payload and payload["service"]:
        # possibilité d'assigner par nom
        srv = db.query(models.Service).filter(models.Service.nom == payload["service"]).first()
        if srv:
            u.service_id = srv.id
    if "service_id" in payload:
        u.service_id = payload["service_id"]
    db.commit()
    db.refresh(u)
    return {
        "id": u.id, "email": u.email, "role": u.role,
        "service": u.service.nom if u.service else None,
        "created_at": u.created_at, "is_active": u.is_active
    }

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    u = db.query(models.User).get(user_id)
    if not u:
        raise HTTPException(404, "Utilisateur non trouvé")
    db.delete(u)
    db.commit()
    return {"success": True}
