from fastapi import HTTPException,APIRouter , Depends
from sqlalchemy.orm import Session
from database.database import get_db
from models.registration import Registration
from models.user import User
from models.event import Event
from schemas.registration import RegistrationCreate


router = APIRouter(
    tags=["Registrations"],
    prefix ="/registrations"
)


@router.get("/")
def get_registrations(
    db: Session = Depends(get_db)
):
    return db.query(Registration).all()

@router.post("/")
def create_registration(
    registration: RegistrationCreate,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == registration.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    event = db.query(Event).filter(
        Event.id == registration.event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    existing_registration = db.query(Registration).filter(
        Registration.user_id == registration.user_id,
        Registration.event_id == registration.event_id
    ).first()

    if existing_registration:
        raise HTTPException(
            status_code=400,
            detail="User already registered for this event"
        )

    new_registration = Registration(
        user_id=registration.user_id,
        event_id=registration.event_id
    )

    db.add(new_registration)
    db.commit()
    db.refresh(new_registration)

    return new_registration


@router.get("/{registration_id}")
def get_registration(
    registration_id: int,
    db: Session = Depends(get_db)
):

    registration = db.query(Registration).filter(
        Registration.id == registration_id
    ).first()

    if not registration:
        raise HTTPException(
            status_code=404,
            detail="Registration not found"
        )

    return registration

@router.delete("/{registration_id}")
def delete_registration(
    registration_id: int,
    db: Session = Depends(get_db)
):

    registration = db.query(Registration).filter(
        Registration.id == registration_id
    ).first()

    if not registration:
        raise HTTPException(
            status_code=404,
            detail="Registration not found"
        )

    db.delete(registration)
    db.commit()

    return {
        "message": "Registration deleted successfully"
    }
