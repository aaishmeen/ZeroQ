from fastapi import APIRouter , HTTPException , Depends
from sqlalchemy.orm import Session
from schemas.event import EventsCreate

from database.database import get_db
from models.event import Event

router = APIRouter (
    prefix ="/events",
    tags=["Events"]
)

@router.get("/")
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()

@router.post("/")
def create_event(
    event: EventsCreate,
    db: Session = Depends(get_db)
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
        price=event.price
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event

@router.get("/{event_id}")
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

@router.put("/{event_id}")
def update_event(
    event_id: int,
    updated_event: EventsCreate,
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

    existing_event = db.query(Event).filter(
        Event.title == updated_event.title,
        Event.venue == updated_event.venue,
        Event.date == updated_event.date,
        Event.id != event_id
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

    db.delete(event)
    db.commit()

    return {
        "message": "Event deleted successfully"
    }