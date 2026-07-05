from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from schemas.event import EventsCreate, EventResponse , EventReject
from database.database import get_db
from models.event import Event
from models.user import User
from dependencies.auth import require_role
from dependencies.event import get_owned_event
from constants.event_status import EventStatus

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.get("/", response_model=list[EventResponse])
def get_events(
    db: Session = Depends(get_db)
):
    return db.query(Event).filter(
        Event.status == EventStatus.APPROVED.value
    ).all()

@router.get("/pending", response_model=list[EventResponse])
def get_pending_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(Event).filter(
        Event.status == EventStatus.PENDING.value
    ).all()


@router.post("/", response_model=EventResponse)
def create_event(
    event: EventsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "organizer"))
):

    existing_event = db.query(Event).filter(
        Event.title == event.title,
        Event.venue == event.venue,
        Event.date == event.date
    ).first()

    if existing_event:
        raise HTTPException(
            status_code=400,
            detail="Event already exists"
        )

    new_event = Event(
        title=event.title,
        description=event.description,
        venue=event.venue,
        date=event.date,
        capacity=event.capacity,
        price=event.price,
        owner_id=current_user.id,
        status=EventStatus.DRAFT.value
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event

@router.get("/my-events", response_model=list[EventResponse])
def get_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("organizer", "admin"))
):

    if current_user.role == "admin":
        return db.query(Event).all()

    return db.query(Event).filter(
        Event.owner_id == current_user.id
    ).all()

@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):

    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return event


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    updated_event: EventsCreate,
    event: Event = Depends(get_owned_event),
    db: Session = Depends(get_db)
):

    existing_event = db.query(Event).filter(
        Event.title == updated_event.title,
        Event.venue == updated_event.venue,
        Event.date == updated_event.date,
        Event.id != event.id
    ).first()

    if existing_event:
        raise HTTPException(
            status_code=400,
            detail="Event already exists"
        )

    event.title = updated_event.title
    event.description = updated_event.description
    event.venue = updated_event.venue
    event.date = updated_event.date
    event.capacity = updated_event.capacity
    event.price = updated_event.price

    db.commit()
    db.refresh(event)

    return event


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    event: Event = Depends(get_owned_event),
    db: Session = Depends(get_db)
):

    db.delete(event)
    db.commit()

    return {
        "message": "Event deleted successfully"
    }


@router.post("/{event_id}/submit")
def submit_event(
    event: Event = Depends(get_owned_event),
    db: Session = Depends(get_db)
):

    if event.status != EventStatus.DRAFT.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit an event with status '{event.status}'."
        )

    event.status = EventStatus.PENDING.value

    db.commit()
    db.refresh(event)

    return {
        "message": "Event submitted for approval."
    }

@router.patch("/{event_id}/approve")
def approve_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):

    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found."
        )

    if event.status != EventStatus.PENDING.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve an event with status '{event.status}'."
        )

    event.status = EventStatus.APPROVED.value

    event.rejection_reason = None

    db.commit()
    db.refresh(event)

    return {
        "message": "Event approved successfully."
    }

@router.patch("/{event_id}/reject")
def reject_event(
    event_id: int,
    rejection: EventReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):

    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found."
        )

    if event.status != EventStatus.PENDING.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject an event with status '{event.status}'."
        )

    event.status = EventStatus.DRAFT.value
    event.rejection_reason = rejection.reason

    db.commit()
    db.refresh(event)

    return {
        "message": "Event rejected successfully."
    }