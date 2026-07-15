from fastapi import FastAPI
from routers.events import router as event_router
from routers.users import router as user_router 
from routers.registrations import router as registration_router
from routers.payments import router as payment_router
from database.database import Base, engine
from models.event import Event
from models.user import User
from models.registration import Registration
from models.payment import Payment

app = FastAPI(
    title = "ZeroQ",
    description = "QR-powered event registration and attendance management platform",
    version="0.1.0"
)

#Base.metadata.create_all(bind=engine)

app.include_router(event_router)
app.include_router(user_router)
app.include_router(registration_router)
app.include_router(payment_router)

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
