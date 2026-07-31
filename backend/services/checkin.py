from datetime import datetime, UTC

from fastapi import HTTPException
from sqlalchemy.orm import Session

from constants.registration_status import RegistrationStatus
from models.registration import Registration


def check_in(
    registration_id: int,
    token: str,
    db: Session
):

    registration = (
        db.query(Registration)
        .filter(Registration.id == registration_id)
        .first()
    )

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Registration not found."
        )

    if registration.status != RegistrationStatus.APPROVED.value:
        raise HTTPException(
            status_code=400,
            detail="Registration is not approved."
        )

    if registration.qr_token != token:
        raise HTTPException(
            status_code=401,
            detail="Invalid QR code."
        )

    if registration.checked_in_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Ticket has already been used."
        )

    registration.checked_in_at = datetime.now(UTC)

    try:
        db.commit()
        db.refresh(registration)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to check in attendee."
        )

    return registration