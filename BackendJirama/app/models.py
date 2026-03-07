from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "Admin"
    DIRECTEUR = "Directeur"
    CHEF_SERVICE = "Chef de service"
    DEMANDEUR = "Demandeur"
    MAGASINIER = "Magasinier"

class StatusDemande(str, enum.Enum):
    EN_ATTENTE_CHEF = "en_attente_chef"
    REJETEE_CHEF = "rejetee_chef"
    EN_ATTENTE_DIRECTEUR = "en_attente_directeur"
    REJETEE_DIRECTEUR = "rejetee_directeur"
    APPROUVE = "approuve"
    LIVREE = "livree"
    LIVREE_PARTIEL = "livree_partiel"
    EPUISE = "epuise"

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=func.now())
    users = relationship("User", back_populates="service")
    materiels = relationship("Materiel", back_populates="service")
    demandes = relationship("Demande", back_populates="service")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    service = relationship("Service", back_populates="users")
    demandes = relationship("Demande", back_populates="demandeur")
    notifications = relationship("Notification", back_populates="user")

class Materiel(Base):
    __tablename__ = "materiels"
    id = Column(Integer, primary_key=True, index=True)
    numero_article = Column(String(50), unique=True, index=True, nullable=False)
    nom = Column(String(100), nullable=False)
    nature = Column(String(100), nullable=False)  # utilisé pour le préfixe
    prix = Column(Float, nullable=False)
    quantite = Column(Integer, default=0)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())

    service = relationship("Service", back_populates="materiels")
    lignes_demande = relationship("LigneDemande", back_populates="materiel")

class Demande(Base):
    __tablename__ = "demandes"
    id = Column(Integer, primary_key=True, index=True)
    demandeur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    status = Column(Enum(StatusDemande), default=StatusDemande.EN_ATTENTE_CHEF)
    date_demande = Column(DateTime, default=func.now())
    date_approbation_chef = Column(DateTime, nullable=True)
    date_approbation_directeur = Column(DateTime, nullable=True)
    date_livraison = Column(DateTime, nullable=True)
    motif_rejet = Column(Text, nullable=True)

    demandeur = relationship("User", back_populates="demandes")
    service = relationship("Service", back_populates="demandes")
    lignes = relationship("LigneDemande", back_populates="demande", cascade="all, delete-orphan")

class LigneDemande(Base):
    __tablename__ = "lignes_demande"
    id = Column(Integer, primary_key=True, index=True)
    demande_id = Column(Integer, ForeignKey("demandes.id"), nullable=False)
    materiel_id = Column(Integer, ForeignKey("materiels.id"), nullable=False)
    quantite = Column(Integer, nullable=False)
    quantite_livree = Column(Integer, default=0)

    demande = relationship("Demande", back_populates="lignes")
    materiel = relationship("Materiel", back_populates="lignes_demande")

    __table_args__ = (
        UniqueConstraint('demande_id', 'materiel_id', name='uq_demande_materiel'),
    )

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="notifications")
