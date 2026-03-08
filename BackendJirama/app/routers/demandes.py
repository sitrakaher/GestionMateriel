from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/demandes", tags=["Demandes"])

def enrichir_demande(d: models.Demande, db: Session):
    for ligne in d.lignes:
        mat = db.query(models.Materiel).get(ligne.materiel_id)
        ligne.materiel_nom = mat.nom if mat else "Matériel supprimé"
        ligne.materiel_nature = mat.nature if mat else "-"
    return d

# Bloque modification du contenu
STATUTS_BLOQUE_MODIFICATION = [
    models.StatusDemande.APPROUVE,
    models.StatusDemande.REJETEE_CHEF,
    models.StatusDemande.REJETEE_DIRECTEUR,
    models.StatusDemande.LIVREE,
    models.StatusDemande.ANNULEE,
    models.StatusDemande.EPUISE,
]

# ✅ Bloque annulation — exclut EN_ATTENTE_CHEF et EN_ATTENTE_DIRECTEUR
STATUTS_BLOQUE_ANNULATION = [
    models.StatusDemande.APPROUVE,
    models.StatusDemande.REJETEE_CHEF,
    models.StatusDemande.REJETEE_DIRECTEUR,
    models.StatusDemande.LIVREE,
    models.StatusDemande.EPUISE,
    models.StatusDemande.ANNULEE,
]

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

# ---- LIST
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

    # ✅ Ignorer les demandes avec status corrompu en base
    demandes_valides = []
    for d in demandes:
        try:
            models.StatusDemande(d.status)
            demandes_valides.append(enrichir_demande(d, db))
        except ValueError:
            print(f"⚠️ Demande {d.id} ignorée — status invalide : '{d.status}'")
            continue

    return demandes_valides

# ---- UPDATE STATUS
@router.put("/{demande_id}/status", response_model=schemas.DemandeOut)
def update_status(
    demande_id: int,
    payload: schemas.DemandeStatusUpdate,
    db: Session = Depends(get_db)
):
    d = db.query(models.Demande).get(demande_id)
    if not d:
        raise HTTPException(404, "Demande introuvable")

    # ✅ Règle spéciale annulation — peut annuler si en_attente_chef ou en_attente_directeur
    if payload.status == models.StatusDemande.ANNULEE:
        if d.status in STATUTS_BLOQUE_ANNULATION:
            raise HTTPException(400, f"Impossible d'annuler une demande au statut '{d.status}'")
    else:
        if d.status in STATUTS_BLOQUE_MODIFICATION:
            raise HTTPException(400, f"Impossible de modifier une demande au statut '{d.status}'")

    d.status = payload.status
    if payload.motif_rejet:
        d.motif_rejet = payload.motif_rejet

    if payload.status == models.StatusDemande.EN_ATTENTE_DIRECTEUR:
        d.date_approbation_chef = datetime.utcnow()
    elif payload.status == models.StatusDemande.APPROUVE:
        d.date_approbation_directeur = datetime.utcnow()

    db.commit()
    db.refresh(d)
    return enrichir_demande(d, db)

# ---- UPDATE DEMANDE contenu
@router.put("/{demande_id}", response_model=schemas.DemandeOut)
def update_demande(
    demande_id: int,
    payload: schemas.DemandeUpdate,
    db: Session = Depends(get_db)
):
    d = db.query(models.Demande).get(demande_id)
    if not d:
        raise HTTPException(404, "Demande introuvable")

    if d.status in STATUTS_BLOQUE_MODIFICATION:
        raise HTTPException(400, f"Impossible de modifier une demande au statut '{d.status}'")

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
def update_livraison(
    demande_id: int,
    body: schemas.LivraisonUpdate,
    db: Session = Depends(get_db)
):
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

    elif body.status == "epuise":
        d.status = models.StatusDemande.EPUISE
        d.date_livraison = datetime.utcnow()

    else:
        raise HTTPException(400, f"Type de livraison inconnu : {body.status}")

    db.commit()
    db.refresh(d)
    return enrichir_demande(d, db)