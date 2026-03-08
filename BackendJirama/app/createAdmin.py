import os
from dotenv import load_dotenv
from database import get_db
from BackendJirama.app.models import User, RoleEnum
from lib.security import hash_password

load_dotenv()

def create_admin():

    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")

    if not email or not password:
        print("Erreur: email et mot_de_passe manquants dans le .env")
        return
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.email == email).first()
        if admin:
            print("L'administrateur existe déjà")
            return
        
        hashed_pw = hash_password(password)

        new_admin = User(
            email=email,
            hashed_password = hashed_pw,
            role = RoleEnum.ADMIN,
            is_active=True,
        )

        db.add(new_admin)
        db.commit()
        print("Admin créé")

    except Exception as e:
        print(f"Erreur : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()