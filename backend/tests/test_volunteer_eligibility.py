import pytest
import sys
import os
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi import HTTPException

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import Base
from models.user import User
from models.event import Event
from models.volunteer import VolunteerOpening, VolunteerApplication
from auth.hashing import hash_password
from services.volunteer_service import is_event_accepting_volunteers
from schemas.volunteer import VolunteerApplicationApply
from routers.volunteers import apply_for_volunteer

# Setup SQLite in-memory DB for tests
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

def test_volunteer_eligibility_rules(db: Session):
    timestamp = int(datetime.now().timestamp())
    
    # 1. Create Organizer and Student
    organizer = User(
        name="Org User",
        email=f"org_{timestamp}@test.com",
        phone="1234567890",
        password=hash_password("pass"),
        role="organizer"
    )
    student = User(
        name="Student User",
        email=f"student_{timestamp}@test.com",
        phone="0987654321",
        password=hash_password("pass"),
        role="student",
        reg_no=f"REG_{timestamp}"
    )
    db.add_all([organizer, student])
    db.commit()

    # 2. Event A: Has open VolunteerOpening -> SHOULD be accepting volunteers
    event_open = Event(
        title="Event Open",
        description="Active event",
        venue="Auditorium A",
        date=date.today() + timedelta(days=5),
        capacity=100,
        price=0,
        volunteers_limit=10,
        accepting_volunteers=True,
        owner_id=organizer.id,
        status="APPROVED"
    )
    db.add(event_open)
    db.commit()
    db.refresh(event_open)

    opening = VolunteerOpening(
        event_id=event_open.id,
        role="Gate Volunteer",
        volunteers_needed=5,
        status="open",
        created_by=organizer.id
    )
    db.add(opening)
    db.commit()

    assert is_event_accepting_volunteers(event_open, db) is True

    # Student applies for Event A -> Should succeed
    req_a = VolunteerApplicationApply(event_id=event_open.id, opening_id=opening.id)
    res_a = apply_for_volunteer(req=req_a, current_user=student, db=db)
    assert res_a is not None

    # 3. Event B: Has NO VolunteerOpenings -> SHOULD NOT be accepting volunteers
    event_no_op = Event(
        title="Event No Openings",
        description="Event without volunteer setup",
        venue="Hall B",
        date=date.today() + timedelta(days=5),
        capacity=100,
        price=0,
        volunteers_limit=10,
        accepting_volunteers=True,
        owner_id=organizer.id,
        status="APPROVED"
    )
    db.add(event_no_op)
    db.commit()
    db.refresh(event_no_op)

    assert is_event_accepting_volunteers(event_no_op, db) is False

    # Direct API call to apply for Event B -> Must raise 400 Bad Request
    req_b = VolunteerApplicationApply(event_id=event_no_op.id)
    with pytest.raises(HTTPException) as exc_info:
        apply_for_volunteer(req=req_b, current_user=student, db=db)
    assert exc_info.value.status_code == 400
    assert "not currently open" in exc_info.value.detail.lower()

    # 4. Event C: Has closed VolunteerOpening (status="closed") -> SHOULD NOT be accepting
    event_closed = Event(
        title="Event Closed Openings",
        description="Event with closed recruitment",
        venue="Hall C",
        date=date.today() + timedelta(days=5),
        capacity=100,
        price=0,
        volunteers_limit=10,
        accepting_volunteers=True,
        owner_id=organizer.id,
        status="APPROVED"
    )
    db.add(event_closed)
    db.commit()
    db.refresh(event_closed)

    db.add(VolunteerOpening(
        event_id=event_closed.id,
        role="Gate Volunteer",
        volunteers_needed=5,
        status="closed",
        created_by=organizer.id
    ))
    db.commit()

    assert is_event_accepting_volunteers(event_closed, db) is False

    # 5. Event D: accepting_volunteers flag set to False -> SHOULD NOT be accepting
    event_disabled = Event(
        title="Event Disabled Flag",
        description="Disabled volunteers",
        venue="Hall D",
        date=date.today() + timedelta(days=5),
        capacity=100,
        price=0,
        volunteers_limit=10,
        accepting_volunteers=False,
        owner_id=organizer.id,
        status="APPROVED"
    )
    db.add(event_disabled)
    db.commit()
    db.refresh(event_disabled)

    db.add(VolunteerOpening(
        event_id=event_disabled.id,
        role="Gate Volunteer",
        volunteers_needed=5,
        status="open",
        created_by=organizer.id
    ))
    db.commit()

    assert is_event_accepting_volunteers(event_disabled, db) is False

    # Direct API call to apply for Event D -> Must raise 400 Bad Request
    req_d = VolunteerApplicationApply(event_id=event_disabled.id)
    with pytest.raises(HTTPException) as exc_info:
        apply_for_volunteer(req=req_d, current_user=student, db=db)
    assert exc_info.value.status_code == 400
