from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, UTC

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
from schemas.volunteer import (
    VolunteerSignupRequest,
    VolunteerOpeningCreate,
    VolunteerOpeningUpdate,
    VolunteerOpeningResponse,
    VolunteerApplicationApply,
    VolunteerApplicationResponse,
    ApprovedVolunteerResponse,
    VolunteerAssignmentCreate,
    VolunteerAssignmentResponse,
    AvailableVolunteerEventResponse,
    VolunteerNotificationCreate,
    VolunteerNotificationResponse,
)
from services.volunteer_service import is_event_accepting_volunteers
from auth.hashing import hash_password
from dependencies.auth import get_current_user, get_optional_current_user, require_role
from services.volunteer_service import ensure_volunteer_id

router = APIRouter(
    prefix="/volunteers",
    tags=["Volunteers"]
)


def _format_opening_response(opening: VolunteerOpening, db: Session) -> dict:
    apps = db.query(VolunteerApplication).filter(VolunteerApplication.opening_id == opening.id).all()
    apps_count = len(apps)
    approved_count = len([a for a in apps if a.status == "approved"])
    remaining_count = max(0, opening.volunteers_needed - approved_count)

    return {
        "id": opening.id,
        "event_id": opening.event_id,
        "role": opening.role,
        "volunteers_needed": opening.volunteers_needed,
        "description": opening.description,
        "deadline": opening.deadline,
        "gate_area": opening.gate_area,
        "status": opening.status,
        "created_at": opening.created_at,
        "created_by": opening.created_by,
        "event_title": opening.event.title if opening.event else None,
        "event_date": str(opening.event.date) if opening.event and opening.event.date else None,
        "event_venue": opening.event.venue if opening.event else None,
        "applications_count": apps_count,
        "approved_count": approved_count,
        "remaining_count": remaining_count,
    }


# ==========================================
# 1. VOLUNTEER OPENINGS API
# ==========================================

@router.post("/openings", response_model=VolunteerOpeningResponse)
def create_volunteer_opening(
    req: VolunteerOpeningCreate,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Creates a new volunteer opening for an event.
    Role and volunteers_needed are required; gate/area is optional and decoupled.
    """
    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if current_user.role not in ["admin", "superadmin"] and event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create openings for this event.")

    role_clean = req.role.strip()
    gate_clean = req.gate_area.strip() if req.gate_area else None

    # Check if an opening for the same event, role, and gate_area already exists
    from sqlalchemy import func
    query = db.query(VolunteerOpening).filter(
        VolunteerOpening.event_id == req.event_id,
        func.lower(func.trim(VolunteerOpening.role)) == role_clean.lower()
    )
    if gate_clean:
        query = query.filter(func.lower(func.trim(VolunteerOpening.gate_area)) == gate_clean.lower())
    else:
        query = query.filter((VolunteerOpening.gate_area == None) | (func.trim(VolunteerOpening.gate_area) == ""))

    opening = query.first()
    if opening:
        opening.volunteers_needed = req.volunteers_needed
        if req.description:
            opening.description = req.description.strip()
        if req.deadline:
            opening.deadline = req.deadline.strip()
        opening.status = "open"
        db.commit()
        db.refresh(opening)
    else:
        opening = VolunteerOpening(
            event_id=req.event_id,
            role=role_clean,
            volunteers_needed=req.volunteers_needed,
            description=req.description.strip() if req.description else None,
            deadline=req.deadline.strip() if req.deadline else None,
            gate_area=gate_clean,
            status="open",
            created_by=current_user.id,
            created_at=datetime.now(UTC)
        )
        db.add(opening)
        db.commit()
        db.refresh(opening)

    return _format_opening_response(opening, db)


@router.get("/openings", response_model=list[VolunteerOpeningResponse])
def get_volunteer_openings(
    event_id: int | None = Query(None, description="Filter openings by event"),
    status: str | None = Query(None, description="Filter by status (open/closed)"),
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists volunteer openings. Organizers view their events' openings; Admins see all;
    Students/volunteers/public see open openings or event-specific openings.
    """
    query = db.query(VolunteerOpening)

    if event_id:
        query = query.filter(VolunteerOpening.event_id == event_id)
    elif current_user and current_user.role == "organizer":
        owned_events = db.query(Event.id).filter(Event.owner_id == current_user.id).all()
        owned_ids = [e[0] for e in owned_events]
        query = query.filter(VolunteerOpening.event_id.in_(owned_ids))
    elif not current_user or current_user.role not in ["admin", "superadmin"]:
        # Public / student view: show open openings
        query = query.filter(VolunteerOpening.status == "open")

    if status:
        query = query.filter(VolunteerOpening.status == status)

    openings = query.order_by(VolunteerOpening.created_at.desc()).all()
    return [_format_opening_response(o, db) for o in openings]


@router.get("/openings/{opening_id}", response_model=VolunteerOpeningResponse)
def get_volunteer_opening(
    opening_id: int,
    db: Session = Depends(get_db)
):
    opening = db.query(VolunteerOpening).filter(VolunteerOpening.id == opening_id).first()
    if not opening:
        raise HTTPException(status_code=404, detail="Volunteer opening not found.")
    return _format_opening_response(opening, db)


@router.patch("/openings/{opening_id}/status", response_model=VolunteerOpeningResponse)
def update_volunteer_opening_status(
    opening_id: int,
    req: VolunteerOpeningUpdate,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    opening = db.query(VolunteerOpening).filter(VolunteerOpening.id == opening_id).first()
    if not opening:
        raise HTTPException(status_code=404, detail="Volunteer opening not found.")

    if current_user.role not in ["admin", "superadmin"] and opening.event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this opening.")

    if req.status is not None:
        opening.status = req.status
    if req.role is not None:
        opening.role = req.role.strip()
    if req.volunteers_needed is not None:
        opening.volunteers_needed = req.volunteers_needed
    if req.description is not None:
        opening.description = req.description.strip() if req.description else None
    if req.deadline is not None:
        opening.deadline = req.deadline.strip() if req.deadline else None
    if req.gate_area is not None:
        opening.gate_area = req.gate_area.strip() if req.gate_area else None

    db.commit()
    db.refresh(opening)
    return _format_opening_response(opening, db)


@router.delete("/openings/{opening_id}")
def delete_volunteer_opening(
    opening_id: int,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    opening = db.query(VolunteerOpening).filter(VolunteerOpening.id == opening_id).first()
    if not opening:
        raise HTTPException(status_code=404, detail="Volunteer opening not found.")

    if current_user.role not in ["admin", "superadmin"] and opening.event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this opening.")

    db.delete(opening)
    db.commit()
    return {"message": "Volunteer opening deleted successfully."}


# ==========================================
# 2. AVAILABLE EVENTS & VOLUNTEER OPPORTUNITIES
# ==========================================

@router.get("/available-events", response_model=list[AvailableVolunteerEventResponse])
def get_available_volunteer_events(
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns real backend events available for volunteer applications (events taking volunteers),
    including active openings and the user's application status for each event.
    """
    today = date.today()
    events = db.query(Event).filter(
        Event.status.in_(["APPROVED", "UPCOMING", "ACTIVE", "approved", "upcoming", "active"]),
        Event.date >= today,
        Event.volunteers_limit > 0
    ).all()

    # User's existing applications
    user_apps = {}
    if current_user:
        user_apps = {
            app.event_id: app.status
            for app in db.query(VolunteerApplication).filter(
                VolunteerApplication.user_id == current_user.id
            ).all()
        }

    res = []
    for e in events:
        openings = db.query(VolunteerOpening).filter(
            VolunteerOpening.event_id == e.id,
            VolunteerOpening.status == "open"
        ).all()
        seen_keys = set()
        openings_res = []
        for o in openings:
            key = ((o.role or "").strip().lower(), (o.gate_area or "").strip().lower())
            if key not in seen_keys:
                seen_keys.add(key)
                openings_res.append(_format_opening_response(o, db))

        # Approved volunteers count for the event
        approved_count = db.query(VolunteerApplication).filter(
            VolunteerApplication.event_id == e.id,
            VolunteerApplication.status == "approved"
        ).count()

        vol_limit = getattr(e, "volunteers_limit", 10) or 10
        # Only include events with active open openings and remaining volunteer capacity
        if len(openings) > 0 and approved_count < vol_limit:
            res.append({
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "venue": e.venue,
                "date": str(e.date),
                "capacity": e.capacity,
                "volunteers_limit": vol_limit,
                "approved_volunteers_count": approved_count,
                "banner_url": e.banner_url,
                "status": e.status,
                "application_status": user_apps.get(e.id, "none"),
                "openings": openings_res
            })
    return res


# ==========================================
# 3. STUDENT / VOLUNTEER APPLICATION FLOW
# ==========================================

@router.post("/apply")
def apply_for_volunteer(
    req: VolunteerApplicationApply,
    current_user: User = Depends(require_role("volunteer", "student")),
    db: Session = Depends(get_db)
):
    """
    Stage 2: Student applies for an opening or event.
    Prevents duplicate applications and sends a notification to organizer & admin.
    Preserves Student role completely.
    """
    vol_code = ensure_volunteer_id(current_user, db)

    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if not is_event_accepting_volunteers(event, db):
        raise HTTPException(
            status_code=400,
            detail="Volunteer applications are not currently open for this event."
        )

    opening = None
    if req.opening_id:
        opening = db.query(VolunteerOpening).filter(VolunteerOpening.id == req.opening_id).first()
        if not opening:
            raise HTTPException(status_code=404, detail="Volunteer opening not found.")
        if opening.event_id != req.event_id:
            raise HTTPException(status_code=400, detail="Specified volunteer opening does not belong to this event.")
        if opening.status != "open":
            raise HTTPException(status_code=400, detail="Applications for this opening are currently closed.")

    # Duplicate check: check if already applied for this opening or event
    if req.opening_id:
        existing_app = db.query(VolunteerApplication).filter(
            VolunteerApplication.user_id == current_user.id,
            VolunteerApplication.opening_id == req.opening_id
        ).first()
    else:
        existing_app = db.query(VolunteerApplication).filter(
            VolunteerApplication.user_id == current_user.id,
            VolunteerApplication.event_id == req.event_id
        ).first()

    if existing_app:
        return {
            "message": "You have already applied for this position.",
            "application_id": existing_app.id,
            "status": existing_app.status
        }

    app_obj = VolunteerApplication(
        user_id=current_user.id,
        event_id=req.event_id,
        opening_id=req.opening_id,
        status="pending",
        experience=req.experience.strip() if req.experience else None,
        applied_at=datetime.now(UTC)
    )
    db.add(app_obj)

    # 2-Way Notification: Alert organizer & admin of incoming volunteer application
    role_desc = opening.role if opening else "Volunteer"
    notif = VolunteerNotification(
        event_id=req.event_id,
        sender_id=current_user.id,
        recipient_id=event.owner_id,
        target_role="organizer",
        title="New Volunteer Application",
        message=f"{current_user.name} applied for {role_desc} at '{event.title}'."
    )
    db.add(notif)

    db.commit()
    db.refresh(app_obj)

    return {
        "message": "Volunteer application submitted. Your application is awaiting approval from the event organizer.",
        "application_id": app_obj.id,
        "volunteer_id": vol_code
    }


@router.get("/requests", response_model=list[VolunteerApplicationResponse])
def get_volunteer_requests(
    event_id: int | None = Query(None, description="Filter applications by event"),
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Stage 3: Review volunteer applications queue.
    """
    query = db.query(VolunteerApplication)

    if event_id:
        query = query.filter(VolunteerApplication.event_id == event_id)
    elif current_user.role == "organizer":
        owned_events = db.query(Event.id).filter(Event.owner_id == current_user.id).all()
        owned_ids = [e[0] for e in owned_events]
        query = query.filter(VolunteerApplication.event_id.in_(owned_ids))

    apps = query.order_by(VolunteerApplication.applied_at.desc()).all()

    res = []
    for a in apps:
        vol_code = ensure_volunteer_id(a.user, db) if a.user else None
        role_title = a.opening.role if a.opening else "Gate Volunteer"

        # Check if there is an active assignment for this volunteer and event
        assign = db.query(VolunteerAssignment).filter(
            VolunteerAssignment.volunteer_id == a.user_id,
            VolunteerAssignment.event_id == a.event_id,
            VolunteerAssignment.status == "active"
        ).first()

        res.append({
            "id": a.id,
            "user_id": a.user_id,
            "event_id": a.event_id,
            "opening_id": a.opening_id,
            "role_name": role_title,
            "status": a.status,
            "experience": a.experience,
            "applied_at": a.applied_at,
            "reviewed_at": a.reviewed_at,
            "student_name": a.user.name if a.user else None,
            "student_email": a.user.email if a.user else None,
            "student_phone": a.user.phone if a.user else None,
            "volunteer_code": vol_code,
            "event_title": a.event.title if a.event else None,
            "avatar_url": a.user.avatar_url if a.user else None,
            "bio": a.user.bio if a.user else None,
            "assignment_id": assign.id if assign else None,
            "assigned_position": assign.position if assign else None,
        })
    return res


@router.post("/{application_id}/approve")
def approve_volunteer_application(
    application_id: int,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Stage 3: Organizer/Admin approves application.
    Approval is strictly decoupled from Gate/Area assignment.
    Volunteer enters "Approved + Unassigned" state.
    """
    app_obj = db.query(VolunteerApplication).filter(VolunteerApplication.id == application_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Volunteer application not found.")

    if current_user.role not in ["admin", "superadmin"] and app_obj.event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to approve volunteers for this event.")

    app_obj.status = "approved"
    app_obj.reviewed_by = current_user.id
    app_obj.reviewed_at = datetime.now(UTC)

    vol_code = ensure_volunteer_id(app_obj.user, db)

    # 2-Way Notification: Alert volunteer that their application was approved
    notif = VolunteerNotification(
        event_id=app_obj.event_id,
        sender_id=current_user.id,
        recipient_id=app_obj.user_id,
        target_role="student",
        title="Volunteer Application Approved",
        message=f"Your application for '{app_obj.event.title}' has been approved."
    )
    db.add(notif)

    db.commit()
    return {
        "message": "Volunteer application approved successfully.",
        "volunteer_id": vol_code,
        "status": "approved"
    }


@router.post("/{application_id}/reject")
def reject_volunteer_application(
    application_id: int,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Stage 3: Organizer/Admin rejects application.
    """
    app_obj = db.query(VolunteerApplication).filter(VolunteerApplication.id == application_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Volunteer application not found.")

    if current_user.role not in ["admin", "superadmin"] and app_obj.event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to review volunteers for this event.")

    app_obj.status = "rejected"
    app_obj.reviewed_by = current_user.id
    app_obj.reviewed_at = datetime.now(UTC)

    # 2-Way Notification: Alert volunteer that their application status changed
    notif = VolunteerNotification(
        event_id=app_obj.event_id,
        sender_id=current_user.id,
        recipient_id=app_obj.user_id,
        target_role="student",
        title="Volunteer Application Not Approved",
        message=f"Your application for '{app_obj.event.title}' was not approved."
    )
    db.add(notif)

    db.commit()
    return {"message": "Volunteer application rejected."}


# ==========================================
# 4. APPROVED VOLUNTEERS & GATE ASSIGNMENT FLOW
# ==========================================

@router.get("/approved", response_model=list[ApprovedVolunteerResponse])
def get_approved_volunteers(
    event_id: int | None = Query(None, description="Filter approved volunteers by event"),
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Stage 4: List of all approved volunteers and their current gate assignment status.
    Unassigned volunteers have assigned_position=None.
    """
    query = db.query(VolunteerApplication).filter(VolunteerApplication.status == "approved")

    if event_id:
        query = query.filter(VolunteerApplication.event_id == event_id)
    elif current_user.role == "organizer":
        owned_events = db.query(Event.id).filter(Event.owner_id == current_user.id).all()
        owned_ids = [e[0] for e in owned_events]
        query = query.filter(VolunteerApplication.event_id.in_(owned_ids))

    approved_apps = query.order_by(VolunteerApplication.applied_at.desc()).all()

    res = []
    for a in approved_apps:
        vol_code = ensure_volunteer_id(a.user, db) if a.user else None
        role_title = a.opening.role if a.opening else "Gate Volunteer"

        assign = db.query(VolunteerAssignment).filter(
            VolunteerAssignment.volunteer_id == a.user_id,
            VolunteerAssignment.event_id == a.event_id,
            VolunteerAssignment.status == "active"
        ).first()

        res.append({
            "application_id": a.id,
            "volunteer_id": a.user_id,
            "student_name": a.user.name if a.user else "Student",
            "student_email": a.user.email if a.user else "",
            "student_phone": a.user.phone if a.user else None,
            "volunteer_code": vol_code,
            "avatar_url": a.user.avatar_url if a.user else None,
            "event_id": a.event_id,
            "event_title": a.event.title if a.event else "Event",
            "opening_id": a.opening_id,
            "role_name": role_title,
            "approved_at": a.reviewed_at or a.applied_at,
            "assignment_id": assign.id if assign else None,
            "assigned_position": assign.position if assign else None,
        })
    return res


@router.post("/assignments", response_model=VolunteerAssignmentResponse)
def create_volunteer_assignment(
    req: VolunteerAssignmentCreate,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Stage 4: Assign / update gate or area for approved volunteer.
    """
    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if current_user.role not in ["admin", "superadmin"] and event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to assign volunteers for this event.")

    app_obj = db.query(VolunteerApplication).filter(
        VolunteerApplication.user_id == req.volunteer_id,
        VolunteerApplication.event_id == req.event_id,
        VolunteerApplication.status == "approved"
    ).first()

    if not app_obj:
        raise HTTPException(status_code=400, detail="Volunteer must have an approved application for this event before assignment.")

    vol = db.query(User).filter(User.id == req.volunteer_id).first()
    vol_code = ensure_volunteer_id(vol, db) if vol else None

    existing_assignment = db.query(VolunteerAssignment).filter(
        VolunteerAssignment.volunteer_id == req.volunteer_id,
        VolunteerAssignment.event_id == req.event_id
    ).first()

    if existing_assignment:
        existing_assignment.position = req.position.strip()
        existing_assignment.status = "active"
        existing_assignment.assigned_by = current_user.id
        existing_assignment.assigned_at = datetime.now(UTC)
        db.commit()
        db.refresh(existing_assignment)
        assignment = existing_assignment
    else:
        assignment = VolunteerAssignment(
            volunteer_id=req.volunteer_id,
            event_id=req.event_id,
            position=req.position.strip(),
            status="active",
            assigned_by=current_user.id,
            assigned_at=datetime.now(UTC)
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

    # 2-Way Notification: Alert volunteer of gate allocation
    notif = VolunteerNotification(
        event_id=req.event_id,
        sender_id=current_user.id,
        recipient_id=req.volunteer_id,
        target_role="volunteer",
        title="Volunteer Assignment Updated",
        message=f"You've been assigned to {req.position} for '{event.title}'."
    )
    db.add(notif)
    db.commit()

    return {
        "id": assignment.id,
        "volunteer_id": assignment.volunteer_id,
        "event_id": assignment.event_id,
        "position": assignment.position,
        "status": assignment.status,
        "assigned_at": assignment.assigned_at,
        "volunteer_name": vol.name if vol else None,
        "volunteer_email": vol.email if vol else None,
        "volunteer_code": vol_code,
        "event_title": event.title,
    }


@router.get("/assignments", response_model=list[VolunteerAssignmentResponse])
def get_volunteer_assignments(
    event_id: int | None = Query(None, description="Filter assignments by event"),
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    query = db.query(VolunteerAssignment).filter(VolunteerAssignment.status == "active")

    if event_id:
        query = query.filter(VolunteerAssignment.event_id == event_id)
    elif current_user.role == "organizer":
        owned_events = db.query(Event.id).filter(Event.owner_id == current_user.id).all()
        owned_ids = [e[0] for e in owned_events]
        query = query.filter(VolunteerAssignment.event_id.in_(owned_ids))

    assignments = query.all()

    res = []
    for a in assignments:
        vol_code = ensure_volunteer_id(a.volunteer, db) if a.volunteer else None
        res.append({
            "id": a.id,
            "volunteer_id": a.volunteer_id,
            "event_id": a.event_id,
            "position": a.position,
            "status": a.status,
            "assigned_at": a.assigned_at,
            "volunteer_name": a.volunteer.name if a.volunteer else None,
            "volunteer_email": a.volunteer.email if a.volunteer else None,
            "volunteer_code": vol_code,
            "event_title": a.event.title if a.event else None,
            "avatar_url": a.volunteer.avatar_url if a.volunteer else None,
        })
    return res


@router.delete("/assignments/{assignment_id}")
def delete_volunteer_assignment(
    assignment_id: int,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Unassign gate / area: sets status to 'unassigned', returning volunteer to Unassigned state.
    """
    assignment = db.query(VolunteerAssignment).filter(VolunteerAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Volunteer assignment not found.")

    if current_user.role not in ["admin", "superadmin"] and assignment.event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage assignments for this event.")

    assignment.status = "unassigned"
    db.commit()
    return {"message": "Volunteer unassigned successfully."}


# ==========================================
# 5. VOLUNTEER SELF-SERVICE APIS
# ==========================================

@router.get("/my-applications", response_model=list[VolunteerApplicationResponse])
def get_my_volunteer_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all event applications submitted by the logged-in volunteer.
    """
    vol_code = ensure_volunteer_id(current_user, db)
    apps = db.query(VolunteerApplication).filter(
        VolunteerApplication.user_id == current_user.id
    ).order_by(VolunteerApplication.applied_at.desc()).all()

    res = []
    for a in apps:
        role_title = a.opening.role if a.opening else "Gate Volunteer"
        assign = db.query(VolunteerAssignment).filter(
            VolunteerAssignment.volunteer_id == current_user.id,
            VolunteerAssignment.event_id == a.event_id,
            VolunteerAssignment.status == "active"
        ).first()

        res.append({
            "id": a.id,
            "user_id": a.user_id,
            "event_id": a.event_id,
            "opening_id": a.opening_id,
            "role_name": role_title,
            "status": a.status,
            "experience": a.experience,
            "applied_at": a.applied_at,
            "reviewed_at": a.reviewed_at,
            "student_name": current_user.name,
            "student_email": current_user.email,
            "student_phone": current_user.phone,
            "volunteer_code": vol_code,
            "event_title": a.event.title if a.event else None,
            "avatar_url": current_user.avatar_url,
            "bio": current_user.bio,
            "assignment_id": assign.id if assign else None,
            "assigned_position": assign.position if assign else None,
        })
    return res


@router.get("/my-assignments", response_model=list[VolunteerAssignmentResponse])
def get_my_volunteer_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all active event assignments for the logged-in volunteer.
    """
    vol_code = ensure_volunteer_id(current_user, db)
    assignments = db.query(VolunteerAssignment).filter(
        VolunteerAssignment.volunteer_id == current_user.id,
        VolunteerAssignment.status == "active"
    ).all()

    res = []
    for a in assignments:
        res.append({
            "id": a.id,
            "volunteer_id": a.volunteer_id,
            "event_id": a.event_id,
            "position": a.position,
            "status": a.status,
            "assigned_at": a.assigned_at,
            "volunteer_name": current_user.name,
            "volunteer_email": current_user.email,
            "volunteer_code": vol_code,
            "event_title": a.event.title if a.event else None,
            "avatar_url": current_user.avatar_url,
            "bio": current_user.bio,
        })
    return res


@router.get("/my-assignment")
def get_my_volunteer_assignment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vol_code = ensure_volunteer_id(current_user, db)

    active_assignments = db.query(VolunteerAssignment).filter(
        VolunteerAssignment.volunteer_id == current_user.id,
        VolunteerAssignment.status == "active"
    ).all()

    applications = db.query(VolunteerApplication).filter(
        VolunteerApplication.user_id == current_user.id
    ).all()

    assignments_list = []
    for a in active_assignments:
        assignments_list.append({
            "assignment_id": a.id,
            "event_id": a.event_id,
            "event_title": a.event.title if a.event else "Assigned Event",
            "event_venue": a.event.venue if a.event else "Gate",
            "event_date": str(a.event.date) if a.event and a.event.date else "",
            "event_status": a.event.status if a.event else "upcoming",
            "position": a.position,
            "status": a.status,
            "assigned_at": a.assigned_at
        })

    primary_assignment = active_assignments[0] if active_assignments else None

    if not primary_assignment:
        pending_app = next((a for a in applications if a.status == "pending"), None)
        approved_app = next((a for a in applications if a.status == "approved"), None)
        rejected_app = next((a for a in applications if a.status == "rejected"), None)

        relevant_app = approved_app or pending_app or rejected_app
        return {
            "has_assignment": False,
            "volunteer_id": vol_code,
            "application_status": relevant_app.status if relevant_app else "none",
            "event_title": relevant_app.event.title if relevant_app and relevant_app.event else None,
            "event_id": relevant_app.event_id if relevant_app else None,
            "event_status": relevant_app.event.status if relevant_app and relevant_app.event else None,
            "all_assignments": []
        }

    app_for_event = db.query(VolunteerApplication).filter(
        VolunteerApplication.user_id == current_user.id,
        VolunteerApplication.event_id == primary_assignment.event_id
    ).first()

    return {
        "has_assignment": True,
        "volunteer_id": vol_code,
        "assignment_id": primary_assignment.id,
        "event_id": primary_assignment.event_id,
        "event_title": primary_assignment.event.title if primary_assignment.event else "Assigned Event",
        "event_venue": primary_assignment.event.venue if primary_assignment.event else "Gate",
        "event_date": primary_assignment.event.date if primary_assignment.event else "",
        "event_status": primary_assignment.event.status if primary_assignment.event else "upcoming",
        "position": primary_assignment.position,
        "status": primary_assignment.status,
        "assigned_at": primary_assignment.assigned_at,
        "application_status": app_for_event.status if app_for_event else "approved",
        "all_assignments": assignments_list
    }


# ==========================================
# 6. SIGNUP & BROADCAST NOTIFICATIONS
# ==========================================

@router.post("/signup")
def volunteer_signup(
    req: VolunteerSignupRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    hashed_pw = hash_password(req.password)
    user = User(
        name=req.name,
        email=req.email,
        phone=req.phone_no,
        password=hashed_pw,
        role="volunteer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    ensure_volunteer_id(user, db)

    if req.event_id:
        app_obj = VolunteerApplication(
            user_id=user.id,
            event_id=req.event_id,
            status="pending"
        )
        db.add(app_obj)
        db.commit()

    return {
        "message": "Volunteer account created successfully.",
        "user_id": user.id,
        "role": user.role,
        "volunteer_id": user.volunteer_id
    }


@router.post("/notifications", response_model=VolunteerNotificationResponse)
def send_volunteer_notification(
    req: VolunteerNotificationCreate,
    current_user: User = Depends(require_role("organizer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Sends a broadcast notification to all volunteers of a specific event.
    """
    event = db.query(Event).filter(Event.id == req.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if current_user.role not in ["admin", "superadmin"] and event.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send notifications for this event.")

    notif = VolunteerNotification(
        event_id=req.event_id,
        sender_id=current_user.id,
        recipient_id=req.recipient_id,
        target_role=req.target_role or "volunteer",
        title=req.title,
        message=req.message,
        created_at=datetime.now(UTC)
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    return {
        "id": notif.id,
        "event_id": notif.event_id,
        "sender_id": notif.sender_id,
        "recipient_id": notif.recipient_id,
        "target_role": notif.target_role,
        "title": notif.title,
        "message": notif.message,
        "created_at": notif.created_at,
        "event_title": event.title,
        "sender_name": current_user.name
    }


@router.get("/notifications", response_model=list[VolunteerNotificationResponse])
def get_volunteer_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns notifications strictly relevant and authorized for the current user.
    Enforces role-based and recipient-based access control on the backend.
    """
    from sqlalchemy import or_, and_

    query = db.query(VolunteerNotification)

    if current_user.role in ["admin", "superadmin"]:
        query = query.filter(
            or_(
                VolunteerNotification.recipient_id == current_user.id,
                VolunteerNotification.target_role.in_(["admin", "superadmin", "all"]),
                and_(
                    VolunteerNotification.recipient_id == None,
                    or_(
                        VolunteerNotification.target_role == None,
                        VolunteerNotification.target_role.in_(["admin", "superadmin", "organizer"])
                    )
                )
            )
        )
    elif current_user.role == "organizer":
        owned_events = db.query(Event.id).filter(Event.owner_id == current_user.id).all()
        owned_event_ids = [e[0] for e in owned_events]

        query = query.filter(
            VolunteerNotification.event_id.in_(owned_event_ids),
            or_(
                VolunteerNotification.recipient_id == current_user.id,
                and_(
                    or_(VolunteerNotification.recipient_id == None, VolunteerNotification.recipient_id == current_user.id),
                    or_(VolunteerNotification.target_role == None, VolunteerNotification.target_role.in_(["organizer", "all"]))
                )
            )
        )
    else:
        # Student / Volunteer role
        reg_event_ids = [r[0] for r in db.query(Registration.event_id).filter(Registration.user_id == current_user.id).all()]
        app_event_ids = [a[0] for a in db.query(VolunteerApplication.event_id).filter(VolunteerApplication.user_id == current_user.id).all()]
        ass_event_ids = [a[0] for a in db.query(VolunteerAssignment.event_id).filter(VolunteerAssignment.volunteer_id == current_user.id).all()]
        user_event_ids = list(set(reg_event_ids + app_event_ids + ass_event_ids))

        # Strict Student Filter:
        # 1. Must be directly addressed to this student (recipient_id == current_user.id)
        # 2. OR broadcast to students/volunteers/all (recipient_id is None AND target_role in ["student", "volunteer", "all"])
        # 3. MUST NOT be targeted at "organizer", "admin", "superadmin"
        # 4. MUST NOT be a notification sent by the student themselves for organizer review
        query = query.filter(
            VolunteerNotification.event_id.in_(user_event_ids),
            VolunteerNotification.sender_id != current_user.id,
            or_(
                VolunteerNotification.recipient_id == current_user.id,
                and_(
                    VolunteerNotification.recipient_id == None,
                    VolunteerNotification.target_role.in_(["student", "volunteer", "all"])
                )
            )
        )

    notifs = query.order_by(VolunteerNotification.created_at.desc()).all()

    res = []
    for n in notifs:
        res.append({
            "id": n.id,
            "event_id": n.event_id,
            "sender_id": n.sender_id,
            "recipient_id": n.recipient_id,
            "target_role": n.target_role,
            "title": n.title,
            "message": n.message,
            "created_at": n.created_at,
            "event_title": n.event.title if n.event else None,
            "sender_name": n.sender.name if n.sender else "System"
        })
    return res
