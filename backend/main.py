from fastapi import FastAPI
from routers.events import router as event_router
from routers.users import router as user_router 
from routers.registrations import router as registration_router
from routers.payments import router as payment_router
from routers.volunteers import router as volunteer_router
from routers.disputes import router as dispute_router
from routers.attendances import router as attendance_router
from routers.tickets import router as ticket_router

from database.database import Base, engine
from models.event import Event
from models.user import User
from models.registration import Registration
from models.payment import Payment
from models.volunteer import VolunteerOpening, VolunteerApplication, VolunteerAssignment
from models.dispute import Dispute
from models.notification import VolunteerNotification

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title = "ZeroQ",
    description = "QR-powered event registration and attendance management platform",
    version="0.1.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://zero--q.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount it
os.makedirs("uploads/payments", exist_ok=True)
os.makedirs("uploads/avatars", exist_ok=True)
os.makedirs("uploads/events", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

Base.metadata.create_all(bind=engine)

app.include_router(event_router)
app.include_router(user_router)
app.include_router(registration_router)
app.include_router(payment_router)
app.include_router(volunteer_router)
app.include_router(dispute_router)
app.include_router(attendance_router)
app.include_router(ticket_router)

@app.get("/")
def root():
    return{
        "project": "ZeroQ",
        "message": "Because entry shouldn't take an hour."
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
