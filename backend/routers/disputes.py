from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, UTC

from database.database import get_db
from models import (
    User,
    Event,
    Registration,
    Payment,
    VolunteerOpening,
    VolunteerApplication,
    VolunteerAssignment,
    VolunteerNotification,
    Dispute,
)
from schemas.dispute import DisputeCreate, DisputeResponse, DisputeStatusUpdate
from dependencies.auth import get_current_user, require_role

router = APIRouter(
    prefix="/disputes",
    tags=["Disputes"]
)


@router.post("/", response_model=DisputeResponse)
def create_dispute(
    req: DisputeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(VolunteerAssignment).filter(
        VolunteerAssignment.volunteer_id == current_user.id,
        VolunteerAssignment.status == "active"
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="You must have an active volunteer event assignment to raise gate disputes."
        )

    dispute = Dispute(
        event_id=assignment.event_id,
        volunteer_id=current_user.id,
        position=assignment.position,
        category=req.category,
        registration_id=req.registration_id,
        description=req.description,
        status="OPEN"
    )

    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    return {
        "id": dispute.id,
        "event_id": dispute.event_id,
        "volunteer_id": dispute.volunteer_id,
        "position": dispute.position,
        "category": dispute.category,
        "registration_id": dispute.registration_id,
        "description": dispute.description,
        "status": dispute.status,
        "created_at": dispute.created_at,
        "resolved_at": dispute.resolved_at,
        "volunteer_name": current_user.name,
        "event_title": assignment.event.title if assignment.event else "Assigned Event"
    }


@router.get("/", response_model=list[DisputeResponse])
def get_disputes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        disputes = db.query(Dispute).all()
    elif current_user.role == "organizer":
        owned_events = db.query(Event).filter(Event.owner_id == current_user.id).all()
        owned_event_ids = [e.id for e in owned_events]
        disputes = db.query(Dispute).filter(Dispute.event_id.in_(owned_event_ids)).all()
    else:
        disputes = db.query(Dispute).filter(Dispute.volunteer_id == current_user.id).all()

    res = []
    for d in disputes:
        res.append({
            "id": d.id,
            "event_id": d.event_id,
            "volunteer_id": d.volunteer_id,
            "position": d.position,
            "category": d.category,
            "registration_id": d.registration_id,
            "description": d.description,
            "status": d.status,
            "created_at": d.created_at,
            "resolved_at": d.resolved_at,
            "volunteer_name": d.volunteer.name if d.volunteer else "Volunteer",
            "event_title": d.event.title if d.event else "Event"
        })
    return res


@router.patch("/{dispute_id}/status", response_model=DisputeResponse)
def update_dispute_status(
    dispute_id: int,
    req: DisputeStatusUpdate,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found.")

    if current_user.role != "admin" and dispute.event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to resolve disputes for this event.")

    allowed_statuses = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]
    if req.status.upper() not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{req.status}'. Must be one of {allowed_statuses}")

    dispute.status = req.status.upper()
    if dispute.status in ["RESOLVED", "CLOSED"]:
        dispute.resolved_at = datetime.now(UTC)
        dispute.resolved_by = current_user.id

    db.commit()
    db.refresh(dispute)

    return {
        "id": dispute.id,
        "event_id": dispute.event_id,
        "volunteer_id": dispute.volunteer_id,
        "position": dispute.position,
        "category": dispute.category,
        "registration_id": dispute.registration_id,
        "description": dispute.description,
        "status": dispute.status,
        "created_at": dispute.created_at,
        "resolved_at": dispute.resolved_at,
        "volunteer_name": dispute.volunteer.name if dispute.volunteer else "Volunteer",
        "event_title": dispute.event.title if dispute.event else "Event"
    }
