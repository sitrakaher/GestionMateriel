from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/demandes", tags=["Demandes"])
# ---- Fonction utilitaire pour enrichir les lignes
def enrichir_demande(d: models.Demande, db: Session):
    for ligne in d.lignes:
        mat = db.query(models.Materiel).get(ligne.materiel_id)
        ligne.materiel_nom = mat.nom
        ligne.materiel_nature = mat.nature
    return d

# ---- CREATE
@router.post("/", response_model=schemas.DemandeOut)
def create_demande(payload: schemas.DemandeCreate, db: Session = Depends(get_db)):
    demandeur = db.query(models.User).get(payload.demandeur_id)
    if not demandeur:
        raise HTTPException(400, "Demandeur inconnu")
    if not db.query(models.Service).get(payload.service_id):
        raise HTTPException(400, "Service inconnu")

    d = models.Demande(
        demandeur_id=payload.demandeur_id,
        service_id=payload.service_id,
        status=models.StatusDemande.EN_ATTENTE_CHEF
    )
    db.add(d)
    db.flush()

    for l in payload.lignes:
        if l.materiel_id:
            materiel = db.query(models.Materiel).get(l.materiel_id)
        else:
            materiel = db.query(models.Materiel).filter(
                models.Materiel.nom == l.materiel,
                models.Materiel.nature == l.nature
            ).first()

        if not materiel:
            raise HTTPException(400, f"Matériel introuvable ({l.materiel or l.materiel_id})")

        db.add(models.LigneDemande(
            demande_id=d.id,
            materiel_id=materiel.id,
            quantite=l.quantite
        ))

    db.commit()
    db.refresh(d)
    return enrichir_demande(d, db)

# ---- LIST (option ?service=nom)
@router.get("/", response_model=List[schemas.DemandeOut])
def list_demandes(service: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Demande)
    if service:
        srv = db.query(models.Service).filter(models.Service.nom.ilike(service)).first()
        if srv:
            q = q.filter(models.Demande.service_id == srv.id)
        else:
            return []
    demandes = q.order_by(models.Demande.id.desc()).all()
    return [enrichir_demande(d, db) for d in demandes]

# ---- UPDATE DEMANDE
@router.put("/{demande_id}", response_model=schemas.DemandeOut)
def update_demande(demande_id: int, payload: schemas.DemandeUpdate, db: Session = Depends(get_db)):
    d = db.query(models.Demande).get(demande_id)
    if not d:
        raise HTTPException(404, "Demande introuvable")

    if payload.service_id:
        if not db.query(models.Service).get(payload.service_id):
            raise HTTPException(400, "Service introuvable")
        d.service_id = payload.service_id

    if payload.lignes is not None:
        for l in list(d.lignes):
            db.delete(l)
        db.flush()

        for l in payload.lignes:
            if l.materiel_id:
                materiel = db.query(models.Materiel).get(l.materiel_id)
            else:
                materiel = db.query(models.Materiel).filter(
                    models.Materiel.nom == l.materiel,
                    models.Materiel.nature == l.nature
                ).first()

            if not materiel:
                raise HTTPException(400, f"Matériel introuvable ({l.materiel or l.materiel_id})")

            db.add(models.LigneDemande(
                demande_id=d.id,
                materiel_id=materiel.id,
                quantite=l.quantite
            ))

    db.commit()
    db.refresh(d)
    return enrichir_demande(d, db)

# ---- LIVRAISON
@router.put("/{demande_id}/livraison", response_model=schemas.DemandeOut)
def update_livraison(demande_id: int, body: schemas.LivraisonUpdate, db: Session = Depends(get_db)):
    d = db.query(models.Demande).get(demande_id)
    if not d:
        raise HTTPException(404, "Demande introuvable")
    if d.status not in [models.StatusDemande.APPROUVE, models.StatusDemande.LIVREE_PARTIEL]:
        raise HTTPException(400, "Demande non approuvée")

    if body.status == "complet":
        for l in d.lignes:
            reste = l.quantite - l.quantite_livree
            if reste > 0:
                mat = db.query(models.Materiel).get(l.materiel_id)
                if mat.quantite < reste:
                    raise HTTPException(400, f"Stock insuffisant pour {mat.nom}")

        for l in d.lignes:
            reste = l.quantite - l.quantite_livree
            if reste > 0:
                mat = db.query(models.Materiel).get(l.materiel_id)
                mat.quantite -= reste
                l.quantite_livree += reste

        d.status = models.StatusDemande.LIVREE
        d.date_livraison = datetime.utcnow()

    elif body.status == "partiel":
        qty = body.quantite or 0
        if qty <= 0:
            raise HTTPException(400, "Quantité partielle invalide")

        restant = qty
        for l in d.lignes:
            if restant <= 0:
                break
            besoin = l.quantite - l.quantite_livree
            if besoin <= 0:
                continue
            mat = db.query(models.Materiel).get(l.materiel_id)
            dispo = min(mat.quantite, besoin, restant)
            if dispo > 0:
                mat.quantite -= dispo
                l.quantite_livree += dispo
                restant -= dispo

        total_restant = sum(l.quantite - l.quantite_livree for l in d.lignes)
        if total_restant == 0:
            d.status = models.StatusDemande.LIVREE
            d.date_livraison = datetime.utcnow()
        else:
            d.status = models.StatusDemande.LIVREE_PARTIEL

    else:
        raise HTTPException(400, "Type de livraison inconnu")

    db.commit()
    db.refresh(d)
    return enrichir_demande(d, db)
