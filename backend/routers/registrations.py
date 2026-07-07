from fastapi import HTTPException,APIRouter , Depends
from sqlalchemy.orm import Session
from database.database import get_db
from models.registration import Registration
from models.user import User
from models.event import Event
from schemas.registration import  RegistrationResponse


router = APIRouter(
    tags=["Registrations"],
    prefix ="/registrations"
)


@router.get(
    "/",
    response_model=list[RegistrationResponse]
)
def get_registrations(
    db: Session = Depends(get_db)
):
    return db.query(Registration).all()


@router.get(
    "/{registration_id}",
    response_model=RegistrationResponse
)
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
