from fastapi import FastAPI
from routers.events import router as event_router
from routers.users import router as user_router 

app = FastAPI(
    title = "ZeroQ",
    description = "QR-powered event registration and attendance management platform",
    version="0.1.0"
)

app.include_router(event_router)
app.include_router(user_router)

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
