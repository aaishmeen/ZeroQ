from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, UTC
import os
import shutil
import uuid

from schemas.event import EventsCreate, EventResponse , EventReject
from schemas.registration import RegistrationDetailsResponse , RegistrationResponse
from database.database import get_db

from models.event import Event
from models.user import User
from models.registration import Registration

from constants.event_status import EventStatus
from constants.registration_status import RegistrationStatus

from dependencies.auth import require_role , get_current_user
from dependencies.event import get_owned_event


router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.get("/", response_model=list[EventResponse])
def get_events(
    db: Session = Depends(get_db)
):
    return db.query(Event).filter(
        Event.status.in_([
            "APPROVED", "UPCOMING", "ACTIVE", "COMPLETED",
            "approved", "upcoming", "active", "completed",
            "Approved", "Upcoming", "Active", "Completed"
        ])
    ).all()

@router.get("/pending", response_model=list[EventResponse])
def get_pending_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(Event).filter(
        Event.status.in_(["PENDING", "pending", "Pending"])
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
        volunteers_limit=event.volunteers_limit,
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

@router.get("/{event_id}/registrations", response_model=list[RegistrationDetailsResponse])
def get_event_registrations(
    event: Event = Depends(get_owned_event),
    db: Session = Depends(get_db)
):

    registrations = db.query(Registration).filter(
        Registration.event_id == event.id,
        Registration.status == RegistrationStatus.APPROVED.value
    ).all()

    return [
        {
            "id": registration.id,
            "status": registration.status,
            "user_id": registration.user.id,
            "student_name": registration.user.name,
            "student_email": registration.user.email,
            "registration_number": registration.user.reg_no
        }
        for registration in registrations
    ]

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
    event.volunteers_limit = updated_event.volunteers_limit

    db.commit()
    db.refresh(event)

    return event


@router.post("/{event_id}/activate", response_model=EventResponse)
def activate_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "organizer"))
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "admin" and event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")

    event.status = EventStatus.ACTIVE.value
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/complete", response_model=EventResponse)
def complete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "organizer"))
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "admin" and event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")

    event.status = EventStatus.COMPLETED.value
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/upload-banner")
def upload_event_banner(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "organizer"))
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "admin" and event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")

    os.makedirs(f"uploads/events/{event_id}", exist_ok=True)
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"banner_{uuid.uuid4().hex}.{file_extension}"
    file_path = f"uploads/events/{event_id}/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    event.banner_url = f"/{file_path}"
    db.commit()
    
    return {"message": "Banner uploaded successfully", "banner_url": event.banner_url}

@router.post("/{event_id}/upload-qr")
def upload_event_qr(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "organizer"))
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "admin" and event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")

    os.makedirs(f"uploads/events/{event_id}", exist_ok=True)
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"qr_{uuid.uuid4().hex}.{file_extension}"
    file_path = f"uploads/events/{event_id}/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    event.payment_qr_url = f"/{file_path}"
    db.commit()
    
    return {"message": "QR uploaded successfully", "payment_qr_url": event.payment_qr_url}


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

@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    from models.volunteer import VolunteerApplication
    is_student_capable = (
        current_user.role in ["student", "volunteer"] or
        bool(current_user.reg_no) or
        db.query(VolunteerApplication).filter(VolunteerApplication.user_id == current_user.id).first() is not None or
        db.query(Registration).filter(Registration.user_id == current_user.id).first() is not None
    )
    if not is_student_capable:
        raise HTTPException(
            status_code=403,
            detail="Registration requires student/participant capability."
        )

    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found."
        )

    if (event.status or "").upper() not in ["APPROVED", "ACTIVE", "UPCOMING"]:
        raise HTTPException(
            status_code=400,
            detail="Registration is only allowed for approved events."
        )
    
    existing_registration = db.query(Registration).filter(
        Registration.user_id == current_user.id,
        Registration.event_id == event.id
        ).first()

    if existing_registration:
        raise HTTPException(
        status_code=400,
        detail="You are already registered for this event."
    )

    current_registrations = db.query(Registration).filter(
        Registration.event_id == event.id
    ).count()

    if current_registrations >= event.capacity:
        raise HTTPException(
            status_code=400,
            detail="This event is full."
        )

    is_free = (event.price <= 0)
    initial_status = RegistrationStatus.APPROVED.value if is_free else RegistrationStatus.PENDING.value
    qr_token = str(uuid.uuid4()) if is_free else None
    qr_generated_at = datetime.now(UTC) if is_free else None

    new_registration = Registration(
        user_id=current_user.id,
        event_id=event.id,
        status=initial_status,
        qr_token=qr_token,
        qr_generated_at=qr_generated_at
    )

    db.add(new_registration)
    db.commit()
    db.refresh(new_registration)

    return {
        "message": "Registration successful and confirmed!" if is_free else "Registration successful.",
        "registration_id": new_registration.id,
        "is_free": is_free
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