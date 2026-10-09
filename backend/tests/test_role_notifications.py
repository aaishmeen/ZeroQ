import pytest
import sys
import os
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import Base
from models.user import User
from models.event import Event
from models.volunteer import VolunteerApplication
from models.notification import VolunteerNotification
from auth.hashing import hash_password
from routers.volunteers import get_volunteer_notifications

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

def test_role_based_notification_filtering(db: Session):
    timestamp = int(datetime.now().timestamp())
    
    # 1. Create test users: Organizer, Student 1 (applicant), Student 2 (unrelated student)
    organizer = User(
        name="Test Organizer",
        email=f"org_{timestamp}@test.com",
        phone="1111111111",
        password=hash_password("pass"),
        role="organizer"
    )
    student1 = User(
        name="Applicant Student",
        email=f"student1_{timestamp}@test.com",
        phone="2222222222",
        password=hash_password("pass"),
        role="student",
        reg_no=f"REG1_{timestamp}"
    )
    student2 = User(
        name="Unrelated Student",
        email=f"student2_{timestamp}@test.com",
        phone="3333333333",
        password=hash_password("pass"),
        role="student",
        reg_no=f"REG2_{timestamp}"
    )
    db.add_all([organizer, student1, student2])
    db.commit()
    db.refresh(organizer)
    db.refresh(student1)
    db.refresh(student2)

    # 2. Create Event owned by Organizer
    event = Event(
        title="HacknIt 2026",
        description="Hackathon",
        venue="Auditorium",
        date=date(2026, 10, 15),
        capacity=100,
        price=0,
        owner_id=organizer.id,
        status="ACTIVE"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # 3. Simulate Student 1 applying for volunteer position
    vol_app = VolunteerApplication(
        event_id=event.id,
        user_id=student1.id,
        experience="Previous volunteer experience",
        status="PENDING"
    )
    db.add(vol_app)
    db.commit()

    # Creates notification intended ONLY for organizer
    notif_org = VolunteerNotification(
        event_id=event.id,
        sender_id=student1.id,
        recipient_id=organizer.id,
        target_role="organizer",
        title="New Volunteer Application",
        message=f"{student1.name} applied for Volunteer at '{event.title}'."
    )
    db.add(notif_org)
    db.commit()

    # 4. Check notifications retrieved for Student 1 (Applicant)
    student1_notifs = get_volunteer_notifications(db=db, current_user=student1)
    assert len(student1_notifs) == 0, "Student 1 should NOT see notification intended for organizer"

    # 5. Check notifications retrieved for Student 2 (Unrelated Student)
    student2_notifs = get_volunteer_notifications(db=db, current_user=student2)
    assert len(student2_notifs) == 0, "Student 2 should NOT see notification intended for organizer"

    # 6. Check notifications retrieved for Organizer
    org_notifs = get_volunteer_notifications(db=db, current_user=organizer)
    assert len(org_notifs) == 1, "Organizer should receive notification"
    assert org_notifs[0]["title"] == "New Volunteer Application"
    assert org_notifs[0]["recipient_id"] == organizer.id
    assert org_notifs[0]["target_role"] == "organizer"

    # 7. Simulate Organizer approving Student 1's application
    # Creates notification intended ONLY for Student 1
    notif_student = VolunteerNotification(
        event_id=event.id,
        sender_id=organizer.id,
        recipient_id=student1.id,
        target_role="student",
        title="Volunteer Application Approved",
        message=f"Congratulations! Your volunteer application for '{event.title}' has been approved."
    )
    db.add(notif_student)
    db.commit()

    # 8. Check Student 1 now receives their notification
    student1_notifs = get_volunteer_notifications(db=db, current_user=student1)
    assert len(student1_notifs) == 1
    assert student1_notifs[0]["title"] == "Volunteer Application Approved"

    # 9. Check Student 2 still sees 0 notifications
    student2_notifs = get_volunteer_notifications(db=db, current_user=student2)
    assert len(student2_notifs) == 0, "Student 2 should not see Student 1's notification"
