from fastapi import HTTPException,APIRouter , Depends
from sqlalchemy.orm import Session
from database.database import get_db
from models.registration import Registration
from models.user import User
from schemas.registration import  RegistrationResponse, CheckInRequest
from dependencies.auth import get_current_user, require_role, require_volunteer_access
from dependencies.registration import get_owned_registration
from services.qr import generate_qr_image
from constants.registration_status import RegistrationStatus
from services.checkin import check_in

router = APIRouter(
    tags=["Registrations"],
    prefix ="/registrations"
)
 

@router.get("/", response_model=list[RegistrationResponse])
def get_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(Registration).order_by(Registration.id.desc()).all()

@router.get("/{registration_id}/qr")
def get_registration_qr(
    registration: Registration = Depends(get_owned_registration)
):

    if registration.status != RegistrationStatus.APPROVED.value:
        raise HTTPException(
            status_code=400,
            detail="Registration is not approved."
        )

    if not registration.qr_token:
        raise HTTPException(
            status_code=404,
            detail="QR ticket not found."
        )

    return generate_qr_image(registration)

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

@router.post("/check-in")
def check_in_registration(
    request: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_volunteer_access
    )
):

    registration = check_in(
        request.registration_id,
        request.token,
        db,
        current_user=current_user
    )

    return {
        "message": "ENTRY VERIFIED",
        "registration_id": registration.id,
        "student_name": registration.user.name if registration.user else "Attendee",
        "event_title": registration.event.title if registration.event else "Event",
        "checked_in_at": registration.checked_in_at
    }


@router.post("/{registration_id}/cancel", response_model=RegistrationResponse)
def cancel_registration(
    registration: Registration = Depends(get_owned_registration),
    db: Session = Depends(get_db)
):
    registration.status = RegistrationStatus.CANCELLED.value
    db.commit()
    db.refresh(registration)
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