from sqlalchemy.orm import Session
from .models import Materiel

def initials_from_words(text: str) -> str:
    # "Matériel Informatique" -> "MI"
    words = [w for w in text.replace('-', ' ').split() if w.strip()]
    return "".join(w[0].upper() for w in words if w[0].isalpha())

def generate_numero_article(db: Session, nature: str) -> str:
    """
    Préfixe = initiales de la nature (ex: 'Matériel Informatique' -> 'MI').
    Séquence = 001..999, remise à zéro par nature/prefixe.
    """
    prefix = initials_from_words(nature)
    # Récupère tous les numéros de ce préfixe
    like_prefix = f"{prefix}-"
    last = (
        db.query(Materiel)
        .filter(Materiel.numero_article.like(f"{like_prefix}%"))
        .order_by(Materiel.numero_article.desc())
        .first()
    )
    if not last:
        seq = 1
    else:
        try:
            seq = int(last.numero_article.split("-")[-1]) + 1
        except Exception:
            seq = 1
    return f"{prefix}-{seq:03d}"
