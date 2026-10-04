from datetime import datetime, UTC

from fastapi import HTTPException
from sqlalchemy.orm import Session

from constants.registration_status import RegistrationStatus
from models.registration import Registration


from models.volunteer import VolunteerAssignment, VolunteerApplication
from models.user import User


def check_in(
    registration_id: int | None,
    token: str,
    db: Session,
    current_user: User | None = None
):

    if registration_id:
        registration = (
            db.query(Registration)
            .filter(Registration.id == registration_id)
            .with_for_update()
            .first()
        )
    else:
        registration = (
            db.query(Registration)
            .filter(Registration.qr_token == token)
            .with_for_update()
            .first()
        )

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Invalid QR ticket or registration not found."
        )

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    is_admin = current_user.role in ["admin", "superadmin"]
    is_owner_organizer = (current_user.role == "organizer" and registration.event and registration.event.owner_id == current_user.id)

    if not is_admin and not is_owner_organizer:
        assignment = db.query(VolunteerAssignment).filter(
            VolunteerAssignment.volunteer_id == current_user.id,
            VolunteerAssignment.event_id == registration.event_id,
            VolunteerAssignment.status == "active"
        ).first()

        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You do not have an active volunteer event assignment for this event."
            )

        app_obj = db.query(VolunteerApplication).filter(
            VolunteerApplication.user_id == current_user.id,
            VolunteerApplication.event_id == registration.event_id,
            VolunteerApplication.status == "approved"
        ).first()
        if not app_obj:
            raise HTTPException(
                status_code=403,
                detail="Your volunteer application for this event has not been approved."
            )

    # Check event status (must be ACTIVE)
    target_event = registration.event
    event_status = (target_event.status or "").lower() if target_event else ""
    if event_status == "completed":
        raise HTTPException(
            status_code=400,
            detail="EVENT COMPLETED: This event has ended and QR scanning is no longer available."
        )
    if event_status != "active" and not is_admin:
        raise HTTPException(
            status_code=400,
            detail=f"EVENT NOT ACTIVE: Scanning is only enabled when the event is ACTIVE (current status: {event_status.upper() or 'INACTIVE'})."
        )

    if registration.status != RegistrationStatus.APPROVED.value:
        raise HTTPException(
            status_code=400,
            detail="Registration is not approved / unpaid."
        )

    if registration.qr_token != token:
        raise HTTPException(
            status_code=401,
            detail="Invalid QR pass token string."
        )

    if registration.checked_in_at is not None:
        raise HTTPException(
            status_code=400,
            detail=f"ALREADY CHECKED IN: Pass was checked in on {registration.checked_in_at.strftime('%b %d, %Y at %H:%M:%S UTC') if registration.checked_in_at else 'earlier'}."
        )

    registration.checked_in_at = datetime.now(UTC)

    try:
        db.commit()
        db.refresh(registration)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to complete check-in."
        )

    return registration