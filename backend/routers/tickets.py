from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from models import Registration, User
from dependencies.auth import get_current_user

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


@router.get("/{registration_id}")
def get_ticket_details(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns ticket pass metadata for a registration.
    Enforces server-side ownership and event-scoped authorization:
    - Regular attendees can access only their own tickets.
    - Organizers can access tickets for events they own/manage.
    - Admin/Superadmin access follows existing administrative permissions.
    """
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found.")

    is_owner = (registration.user_id == current_user.id)
    is_event_organizer = (
        current_user.role == "organizer" and
        registration.event and
        registration.event.owner_id == current_user.id
    )
    is_admin = current_user.role in ["admin", "superadmin"]

    if not is_owner and not is_event_organizer and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this ticket."
        )

    if (registration.status or "").lower() != "approved":
        raise HTTPException(
            status_code=400,
            detail="Ticket pass is only available for approved registrations."
        )

    return {
        "registration_id": registration.id,
        "event_id": registration.event_id,
        "event_title": registration.event.title if registration.event else "Event",
        "event_venue": registration.event.venue if registration.event else "",
        "event_date": str(registration.event.date) if registration.event and registration.event.date else "",
        "event_price": registration.event.price if registration.event else 0,
        "user_id": registration.user_id,
        "attendee_name": registration.user.name if registration.user else "Attendee",
        "attendee_email": registration.user.email if registration.user else "",
        "registration_number": registration.user.reg_no if registration.user else None,
        "status": registration.status,
        "qr_token": registration.qr_token,
        "qr_generated_at": registration.qr_generated_at.isoformat() if registration.qr_generated_at else None,
        "checked_in_at": registration.checked_in_at.isoformat() if registration.checked_in_at else None,
        "is_checked_in": registration.checked_in_at is not None,
    }
