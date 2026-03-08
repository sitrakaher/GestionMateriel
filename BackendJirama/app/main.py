from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import auth, services, users, demandes, materiels, notifications

from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gestion des Demandes - FastAPI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(services.router)
app.include_router(demandes.router)
app.include_router(materiels.router)
app.include_router(notifications.router)
