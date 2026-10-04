from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from models import Event, Registration, User
from dependencies.auth import get_current_user

router = APIRouter(
    prefix="/attendances",
    tags=["Attendances"]
)


@router.get("/event/{event_id}")
def get_event_attendance_report(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns attendance metrics and check-in roster for an event.
    Strictly authorized ONLY for the event's owner (organizer) or admins/superadmins.
    Volunteers do NOT get access to the complete attendee roster.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    is_admin = current_user.role in ["admin", "superadmin"]
    is_owner_organizer = (current_user.role == "organizer" and event.owner_id == current_user.id)

    if not is_admin and not is_owner_organizer:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access attendance records for this event."
        )

    registrations = db.query(Registration).filter(Registration.event_id == event.id).all()
    approved_regs = [r for r in registrations if (r.status or "").lower() == "approved"]
    checked_in_regs = [r for r in approved_regs if r.checked_in_at is not None]

    checked_in_list = [
        {
            "registration_id": r.id,
            "student_id": r.user_id,
            "student_name": r.user.name if r.user else "Attendee",
            "student_email": r.user.email if r.user else "",
            "registration_number": r.user.reg_no if r.user else None,
            "checked_in_at": r.checked_in_at.isoformat() if r.checked_in_at else None,
        }
        for r in checked_in_regs
    ]

    return {
        "event_id": event.id,
        "event_title": event.title,
        "capacity": event.capacity,
        "total_registrations": len(registrations),
        "approved_registrations": len(approved_regs),
        "checked_in_count": len(checked_in_regs),
        "check_in_percentage": round((len(checked_in_regs) / len(approved_regs) * 100), 1) if len(approved_regs) > 0 else 0.0,
        "checked_in_list": checked_in_list,
    }
