from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..utils import generate_numero_article

router = APIRouter(prefix="/materiels", tags=["Materiels"])

@router.get("/", response_model=List[schemas.MaterielOut])
def get_all(db: Session = Depends(get_db)):
    return db.query(models.Materiel).order_by(models.Materiel.id.desc()).all()

@router.post("/", response_model=schemas.MaterielOut)
def create(m: schemas.MaterielBase, db: Session = Depends(get_db)):
    numero = generate_numero_article(db, m.nature)  # MI-001 / MB-001 ...
    entity = models.Materiel(
        numero_article=numero,
        nom=m.nom, nature=m.nature,
        prix=m.prix, quantite=m.quantite,
        service_id=m.service_id
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity

@router.put("/{materiel_id}", response_model=schemas.MaterielOut)
def update(materiel_id: int, m: schemas.MaterielBase, db: Session = Depends(get_db)):
    entity = db.query(models.Materiel).get(materiel_id)
    if not entity:
        raise HTTPException(404, "Matériel introuvable")
    # si la nature change, on regénère un nouveau numero_article
    if entity.nature != m.nature:
        entity.numero_article = generate_numero_article(db, m.nature)
    entity.nom = m.nom
    entity.nature = m.nature
    entity.prix = m.prix
    entity.quantite = m.quantite
    entity.service_id = m.service_id
    db.commit()
    db.refresh(entity)
    return entity

@router.delete("/{materiel_id}")
def delete(materiel_id: int, db: Session = Depends(get_db)):
    entity = db.query(models.Materiel).get(materiel_id)
    if not entity:
        raise HTTPException(404, "Matériel introuvable")
    db.delete(entity)
    db.commit()
    return {"success": True}
