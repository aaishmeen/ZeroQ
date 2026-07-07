from fastapi import HTTPException,APIRouter , Depends
from sqlalchemy.orm import Session
from database.database import get_db
from models.registration import Registration
from models.user import User
from models.event import Event
from schemas.registration import  RegistrationResponse
from dependencies.auth import get_current_user, require_role
from dependencies.registration import get_owned_registration

router = APIRouter(
    tags=["Registrations"],
    prefix ="/registrations"
)


@router.get("/", response_model=list[RegistrationResponse])
def get_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(Registration).all()


@router.get(
    "/me",
    response_model=list[RegistrationResponse]
)
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return db.query(Registration).filter(
        Registration.user_id == current_user.id
    ).all()


@router.get(
    "/{registration_id}",
    response_model=RegistrationResponse
)
def get_registration(
    registration: Registration = Depends(get_owned_registration)
):

    return registration



@router.delete("/{registration_id}")
def delete_registration(
    registration: Registration = Depends(get_owned_registration),
    db: Session = Depends(get_db)
):

    db.delete(registration)
    db.commit()

    return {
        "message": "Registration deleted successfully"
    }