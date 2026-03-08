from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from .models import RoleEnum, StatusDemande


# ------------- Users -------------
class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum
    service_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: RoleEnum
    service_id: Optional[int] = None
    service: Optional[str] = None
    created_at: Optional[datetime] = None
    is_active: Optional[bool] = None

    # ✅ FIX : si service est un objet SQLAlchemy Service, extraire .nom
    @field_validator("service", mode="before")
    @classmethod
    def extraire_nom_service(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            return v
        return getattr(v, "nom", None)

    class Config:
        from_attributes = True
        populate_by_name = True


# ------------- Auth -------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[RoleEnum] = None
    service: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ------------- Services -------------
class ServiceBase(BaseModel):
    nom: str


class ServiceOut(BaseModel):
    id: int
    nom: str
    date_creation: datetime = Field(alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True


# ------------- Matériels -------------
class MaterielBase(BaseModel):
    nom: str
    nature: str
    prix: float
    quantite: int
    service_id: Optional[int] = None


class MaterielOut(MaterielBase):
    id: int
    numero_article: str
    created_at: datetime

    class Config:
        from_attributes = True


# ------------- Demandes -------------
class LigneDemandeCreate(BaseModel):
    materiel_id: Optional[int] = None
    materiel: Optional[str] = None
    nature: Optional[str] = None
    quantite: int

    class Config:
        from_attributes = True


class LigneDemandeOut(BaseModel):
    id: int
    materiel_id: int
    quantite: int
    quantite_livree: int
    materiel_nom: Optional[str] = None
    materiel_nature: Optional[str] = None

    class Config:
        from_attributes = True


class DemandeCreate(BaseModel):
    demandeur_id: int
    service_id: int
    lignes: List[LigneDemandeCreate]

    class Config:
        from_attributes = True


class DemandeOut(BaseModel):
    id: int
    demandeur_id: int
    service_id: int
    status: StatusDemande
    date_demande: datetime
    date_approbation_chef: Optional[datetime] = None
    date_approbation_directeur: Optional[datetime] = None
    date_livraison: Optional[datetime] = None
    motif_rejet: Optional[str] = None

    demandeur: Optional[UserOut] = None
    service: Optional[ServiceOut] = None
    lignes: List[LigneDemandeOut] = []

    class Config:
        from_attributes = True


class DemandeStatusUpdate(BaseModel):
    status: StatusDemande
    motif_rejet: Optional[str] = None


class DemandeUpdate(BaseModel):
    service_id: Optional[int] = None
    lignes: Optional[List[LigneDemandeCreate]] = None


# ------------- Livraison -------------
class LivraisonUpdate(BaseModel):
    status: str  # "complet" | "partiel" | "epuise"
    quantite: Optional[int] = None


# ------------- Notifications -------------
class NotificationCreate(BaseModel):
    user_id: int
    message: str


class NotificationOut(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True