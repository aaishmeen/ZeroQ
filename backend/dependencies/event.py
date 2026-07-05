from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from dependencies.auth import get_current_user
from models.event import Event
from models.user import User


def get_owned_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if current_user.role == "admin":
        return event

    if (
        current_user.role == "organizer"
        and event.owner_id == current_user.id
    ):
        return event

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this event."
    )