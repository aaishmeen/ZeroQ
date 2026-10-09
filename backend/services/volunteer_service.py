import uuid
from datetime import date
from sqlalchemy.orm import Session
from models.user import User
from models.event import Event
from models.volunteer import VolunteerOpening, VolunteerApplication

def ensure_volunteer_id(user: User, db: Session) -> str:
    """
    Ensures user has a unique volunteer_id assigned.
    If not, generates a new VOL-XXXXXX code and saves to user record.
    """
    if not user:
        return ""
    if hasattr(user, "volunteer_id") and user.volunteer_id and str(user.volunteer_id).strip():
        return user.volunteer_id

    code = f"VOL-{uuid.uuid4().hex[:6].upper()}"
    if hasattr(user, "volunteer_id"):
        user.volunteer_id = code
        db.commit()
        db.refresh(user)
    return code

def is_event_accepting_volunteers(event: Event, db: Session) -> bool:
    """
    Determines whether an event is actively accepting volunteer applications.
    An event is eligible if:
    1. Event status is APPROVED, ACTIVE, or UPCOMING.
    2. Event date is today or in the future.
    3. Event.accepting_volunteers is True.
    4. Event.volunteers_limit > 0.
    5. The event has NOT reached its approved volunteers capacity limit.
    6. The event has at least ONE active, open VolunteerOpening (status == 'open').
    """
    if not event:
        return False

    status = (event.status or "").upper()
    if status not in ["APPROVED", "ACTIVE", "UPCOMING"]:
        return False

    if event.date and event.date < date.today():
        return False

    if hasattr(event, "accepting_volunteers") and getattr(event, "accepting_volunteers") is False:
        return False

    vol_limit = getattr(event, "volunteers_limit", 10) or 0
    if vol_limit <= 0:
        return False

    approved_count = db.query(VolunteerApplication).filter(
        VolunteerApplication.event_id == event.id,
        VolunteerApplication.status == "approved"
    ).count()

    if approved_count >= vol_limit:
        return False

    open_openings_count = db.query(VolunteerOpening).filter(
        VolunteerOpening.event_id == event.id,
        VolunteerOpening.status == "open"
    ).count()

    return open_openings_count > 0
