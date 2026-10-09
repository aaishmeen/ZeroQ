import pytest
import sys
import os
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi import HTTPException

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import Base
from models.user import User
from models.event import Event
from models.volunteer import VolunteerOpening, VolunteerApplication
from auth.hashing import hash_password
from schemas.volunteer import VolunteerOpeningCreate, VolunteerApplicationApply, VolunteerAssignmentCreate, VolunteerNotificationCreate
from routers.volunteers import (
    create_volunteer_opening,
    get_volunteer_openings,
    apply_for_volunteer,
    get_volunteer_requests,
    approve_volunteer_application,
    get_approved_volunteers,
    create_volunteer_assignment,
    send_volunteer_notification,
)

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

def test_organizer_volunteer_staffing_authorization(db: Session):
    timestamp = int(datetime.now().timestamp())

    # 1. Create two separate Organizers and one Student
    org_a = User(
        name="Organizer Alpha",
        email=f"orga_{timestamp}@test.com",
        phone="1111111111",
        password=hash_password("pass"),
        role="organizer"
    )
    org_b = User(
        name="Organizer Beta",
        email=f"orgb_{timestamp}@test.com",
        phone="2222222222",
        password=hash_password("pass"),
        role="organizer"
    )
    student = User(
        name="Applicant Student",
        email=f"student_{timestamp}@test.com",
        phone="3333333333",
        password=hash_password("pass"),
        role="student",
        reg_no=f"REG_{timestamp}"
    )
    db.add_all([org_a, org_b, student])
    db.commit()

    # 2. Create Event A (owned by Org A) and Event B (owned by Org B)
    event_a = Event(
        title="Alpha Fest 2026",
        description="Event A",
        venue="Auditorium A",
        date=date(2026, 11, 1),
        capacity=200,
        price=0,
        owner_id=org_a.id,
        status="APPROVED"
    )
    event_b = Event(
        title="Beta Fest 2026",
        description="Event B",
        venue="Hall B",
        date=date(2026, 11, 5),
        capacity=100,
        price=0,
        owner_id=org_b.id,
        status="APPROVED"
    )
    db.add_all([event_a, event_b])
    db.commit()

    # 3. Org A creates opening for Event A -> Succeeds
    op_req_a = VolunteerOpeningCreate(
        event_id=event_a.id,
        role="Gate 1 Volunteer",
        volunteers_needed=5,
        description="Gate checking",
        gate_area="Gate 1"
    )
    opening_a = create_volunteer_opening(req=op_req_a, current_user=org_a, db=db)
    assert opening_a["event_id"] == event_a.id

    # 4. Org B attempts to create opening for Event A -> Raises HTTP 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        create_volunteer_opening(req=op_req_a, current_user=org_b, db=db)
    assert exc_info.value.status_code == 403

    # 5. Student applies for Event A opening
    app_req = VolunteerApplicationApply(event_id=event_a.id, opening_id=opening_a["id"])
    app_res = apply_for_volunteer(req=app_req, current_user=student, db=db)
    app_id = app_res["application_id"]

    # 6. Org A queries volunteer requests for Event A -> Sees application
    requests_a = get_volunteer_requests(event_id=event_a.id, current_user=org_a, db=db)
    assert len(requests_a) == 1
    assert requests_a[0]["id"] == app_id

    # 7. Org B queries volunteer requests (even passing event_id=event_a.id) -> Returns 0 (cannot see Org A's event)
    requests_b = get_volunteer_requests(event_id=event_a.id, current_user=org_b, db=db)
    assert len(requests_b) == 0

    # 8. Org B attempts to approve Student's application for Event A -> Raises HTTP 403
    with pytest.raises(HTTPException) as exc_info:
        approve_volunteer_application(application_id=app_id, current_user=org_b, db=db)
    assert exc_info.value.status_code == 403

    # 9. Org A approves Student's application -> Succeeds
    approve_res = approve_volunteer_application(application_id=app_id, current_user=org_a, db=db)
    assert approve_res["status"] == "approved"

    # 10. Org B queries approved volunteers for Event A -> Returns 0
    approved_b = get_approved_volunteers(event_id=event_a.id, current_user=org_b, db=db)
    assert len(approved_b) == 0

    # 11. Org A assigns gate for Event A -> Succeeds
    assign_req = VolunteerAssignmentCreate(
        volunteer_id=student.id,
        event_id=event_a.id,
        position="Gate 1 Scanner"
    )
    assign_a = create_volunteer_assignment(req=assign_req, current_user=org_a, db=db)
    assert assign_a["position"] == "Gate 1 Scanner"

    # 12. Org B attempts to assign gate for Event A -> Raises HTTP 403
    with pytest.raises(HTTPException) as exc_info:
        create_volunteer_assignment(req=assign_req, current_user=org_b, db=db)
    assert exc_info.value.status_code == 403

    # 13. Org A sends broadcast notification for Event A -> Succeeds
    notif_req = VolunteerNotificationCreate(
        event_id=event_a.id,
        title="Shift Reminder",
        message="Please arrive 30 mins before shift."
    )
    notif_a = send_volunteer_notification(req=notif_req, current_user=org_a, db=db)
    assert notif_a["event_id"] == event_a.id

    # 14. Org B attempts to send broadcast notification for Event A -> Raises HTTP 403
    with pytest.raises(HTTPException) as exc_info:
        send_volunteer_notification(req=notif_req, current_user=org_b, db=db)
    assert exc_info.value.status_code == 403
