from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..lib.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Identifiant ou mot de passe incorrect"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Ce compte est désactivé. Veuillez contacter votre administrateur."
        )

    token = create_access_token(user.email)

    out = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "service_id": user.service_id,                        # ✅ AJOUTÉ
        "service": user.service.nom if user.service else None,
        "created_at": user.created_at,
        "is_active": user.is_active,
    }
    return {"access_token": token, "token_type": "bearer", "user": out}


@router.post("/forgot-password")
def forgot_password(data: dict):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")
    return {"message": "Si un compte existe, un email a été envoyé."}


@router.post("/reset-password")
def reset_password(data: dict):
    token = data.get("token")
    new_password = data.get("new_password")
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Données manquantes")
    return {"message": "Mot de passe mis à jour (simulation)."}