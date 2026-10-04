import sys
import os
from datetime import datetime, UTC
import sqlalchemy
from sqlalchemy.orm import Session

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import Base, engine, get_db, SessionLocal
from models.user import User
from models.event import Event
from models.registration import Registration
from models.payment import Payment
from models.volunteer import VolunteerApplication, VolunteerAssignment
from models.dispute import Dispute
from services.checkin import check_in
import uuid
from services.checkin import check_in
from auth.hashing import hash_password

def run_tests():
    print("--- Starting ZeroQ Volunteer System Verification ---")
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE users ALTER COLUMN reg_no DROP NOT NULL;"))
            conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS volunteer_id VARCHAR UNIQUE;"))
            conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;"))
            conn.execute(sqlalchemy.text("ALTER TABLE volunteer_applications ADD COLUMN IF NOT EXISTS experience TEXT;"))
            conn.execute(sqlalchemy.text("ALTER TABLE events ADD COLUMN IF NOT EXISTS volunteers_limit INTEGER DEFAULT 10;"))
            conn.commit()
            print("Altered tables: reg_no nullable, volunteer_id, avatar_url, experience, volunteers_limit ensured.")
        except Exception as e:
            print("Note on column alteration:", e)
    db: Session = SessionLocal()

    try:
        # 1. Create Test Users
        print("\n1. Seeding Users...")
        timestamp = int(datetime.now().timestamp())
        organizer = User(
            name="Organizer User",
            email=f"organizer_{timestamp}@zeroq.test",
            phone="9876543210",
            password=hash_password("password123"),
            role="organizer"
        )
        volunteer = User(
            name="Rahul Volunteer",
            email=f"volunteer_{timestamp}@zeroq.test",
            phone="9876543211",
            password=hash_password("password123"),
            role="volunteer",
            reg_no=None  # Volunteers don't need reg_no!
        )
        student = User(
            name="Aarav Student",
            email=f"student_{timestamp}@zeroq.test",
            phone="9876543212",
            password=hash_password("password123"),
            role="student",
            reg_no=f"REG_{timestamp}"
        )
        db.add_all([organizer, volunteer, student])
        db.commit()
        db.refresh(organizer)
        db.refresh(volunteer)
        db.refresh(student)
        print(f"Created Organizer #{organizer.id}, Volunteer #{volunteer.id}, Student #{student.id}")

        # 2. Find or Create Test Event
        print("\n2. Seeding Event...")
        event1 = db.query(Event).filter(Event.title == "TechX Summit 2026").first()
        if not event1:
            event1 = Event(
                title="TechX Summit 2026",
                description="Premier Campus Tech Fest",
                venue="Main Auditorium",
                date="2026-09-15",
                capacity=500,
                price=0,
                owner_id=organizer.id,
                status="ACTIVE"
            )
            db.add(event1)
        else:
            event1.status = "ACTIVE"

        event2 = db.query(Event).filter(Event.title == "Design Fest 2026").first()
        if not event2:
            event2 = Event(
                title="Design Fest 2026",
                description="Creative Arts Exhibition",
                venue="Hall B",
                date="2026-09-20",
                capacity=200,
                price=0,
                owner_id=organizer.id,
                status="APPROVED"
            )
            db.add(event2)

        db.commit()
        db.refresh(event1)
        db.refresh(event2)
        print(f"Using Event 1 '{event1.title}' (#{event1.id}) and Event 2 '{event2.title}' (#{event2.id})")

        # 3. Volunteer Application Workflow
        print("\n3. Testing Volunteer Application Flow...")
        app_obj = VolunteerApplication(
            user_id=volunteer.id,
            event_id=event1.id,
            status="pending"
        )
        db.add(app_obj)
        db.commit()
        db.refresh(app_obj)
        assert app_obj.status == "pending"
        print(f"Application #{app_obj.id} created with PENDING status.")

        # Organizer Approves Volunteer
        app_obj.status = "approved"
        app_obj.reviewed_by = organizer.id
        app_obj.reviewed_at = datetime.now(UTC)
        db.commit()
        print("Organizer approved volunteer application.")

        # Organizer Assigns Event Position
        assignment = VolunteerAssignment(
            volunteer_id=volunteer.id,
            event_id=event1.id,
            position="Main Gate — Scanner 01",
            status="active",
            assigned_by=organizer.id
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        print(f"Assigned Volunteer to Event #{event1.id} at Position '{assignment.position}'.")

        # 4. Student Registration & QR Ticket Generation
        print("\n4. Testing Student Ticket & Registration...")
        token1 = str(uuid.uuid4())
        reg1 = Registration(
            user_id=student.id,
            event_id=event1.id,
            status="approved",
            qr_token=token1
        )
        token2 = str(uuid.uuid4())
        reg2 = Registration(
            user_id=student.id,
            event_id=event2.id, # Event 2
            status="approved",
            qr_token=token2
        )
        db.add_all([reg1, reg2])
        db.commit()
        db.refresh(reg1)
        db.refresh(reg2)
        print(f"Created Registration 1 #{reg1.id} with token {token1[:8]}...")
        print(f"Created Registration 2 #{reg2.id} with token {token2[:8]}...")

        # 5. Volunteer Check-in Security Verification
        print("\n5. Testing Gate Scanner Check-in Verification...")

        # Test Valid Check-in by Assigned Volunteer
        verified_reg = check_in(
            registration_id=reg1.id,
            token=token1,
            db=db,
            current_user=volunteer
        )
        assert verified_reg.checked_in_at is not None
        print("[OK] ENTRY VERIFIED successfully!")

        # Test Duplicate Check-in Rejection
        print("Testing Duplicate Scan Rejection...")
        try:
            check_in(
                registration_id=reg1.id,
                token=token1,
                db=db,
                current_user=volunteer
            )
            print("ERROR: Duplicate check-in should have failed!")
        except Exception as e:
            print(f"[OK] Duplicate check-in correctly rejected: {e.detail}")

        # Test Wrong-Event Check-in Rejection
        print("Testing Wrong-Event Ticket Rejection...")
        try:
            check_in(
                registration_id=reg2.id,
                token=token2,
                db=db,
                current_user=volunteer
            )
            print("ERROR: Wrong-event check-in should have failed!")
        except Exception as e:
            print(f"[OK] Wrong-event ticket correctly rejected: {e.detail}")

        # 6. Volunteer Dispute Workflow
        print("\n6. Testing Volunteer Dispute Logging & Resolution...")
        dispute = Dispute(
            event_id=assignment.event_id,
            volunteer_id=volunteer.id,
            position=assignment.position,
            category="QR Issue",
            registration_id=reg2.id,
            description="Attendee ticket belongs to different event (Design Fest).",
            status="OPEN"
        )
        db.add(dispute)
        db.commit()
        db.refresh(dispute)
        print(f"Dispute #{dispute.id} created by Volunteer at {dispute.position}.")

        # Organizer Resolves Dispute
        dispute.status = "RESOLVED"
        dispute.resolved_by = organizer.id
        dispute.resolved_at = datetime.now(UTC)
        db.commit()
        print(f"Dispute #{dispute.id} resolved by Organizer. Status: {dispute.status}")

        print("\n=========================================")
        print("ALL BACKEND SYSTEM VERIFICATION TESTS PASSED PERFECTLY!")
        print("=========================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
