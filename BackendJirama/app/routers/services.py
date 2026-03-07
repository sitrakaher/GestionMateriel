from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/", response_model=List[schemas.ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return db.query(models.Service).all()

@router.post("/", response_model=schemas.ServiceOut)
def add_service(payload: schemas.ServiceBase, db: Session = Depends(get_db)):
    if db.query(models.Service).filter(models.Service.nom == payload.nom).first():
        raise HTTPException(400, "Service déjà existant")
    s = models.Service(nom=payload.nom)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.put("/{service_id}", response_model=schemas.ServiceOut)
def update_service(service_id: int, payload: schemas.ServiceBase, db: Session = Depends(get_db)):
    s = db.query(models.Service).get(service_id)
    if not s:
        raise HTTPException(404, "Service introuvable")
    s.nom = payload.nom
    db.commit()
    db.refresh(s)
    return s

@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Service).get(service_id)
    if not s:
        raise HTTPException(404, "Service introuvable")
    db.delete(s)
    db.commit()
    return {"success": True}
