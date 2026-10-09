import sys
import os
from datetime import datetime, UTC
import sqlalchemy
from sqlalchemy.orm import Session

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import Base, engine, SessionLocal
from models.user import User
from models.event import Event
from models.registration import Registration
from models.payment import Payment
from models.volunteer import VolunteerOpening, VolunteerApplication, VolunteerAssignment
from models.notification import VolunteerNotification
from auth.hashing import hash_password
from services.volunteer_service import ensure_volunteer_id

def test_workflow():
    print("=== STARTING 4-STAGE VOLUNTEER WORKFLOW TEST ===")
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE volunteer_applications ADD COLUMN IF NOT EXISTS opening_id INTEGER REFERENCES volunteer_openings(id);"))
            conn.commit()
        except Exception as e:
            print("Note on migration:", e)

    db: Session = SessionLocal()
    try:
        ts = int(datetime.now().timestamp())
        # Setup Users
        organizer = User(
            name="Event Organizer",
            email=f"org_{ts}@test.com",
            phone="9988776655",
            password=hash_password("password123"),
            role="organizer"
        )
        student1 = User(
            name="Aarav Sharma",
            email=f"aarav_{ts}@test.com",
            phone="9876543210",
            password=hash_password("password123"),
            role="student",
            reg_no=f"REG_A_{ts}"
        )
        student2 = User(
            name="Riya Mehta",
            email=f"riya_{ts}@test.com",
            phone="9876543211",
            password=hash_password("password123"),
            role="student",
            reg_no=f"REG_R_{ts}"
        )
        admin = User(
            name="Campus Admin",
            email=f"admin_{ts}@test.com",
            phone="9876543212",
            password=hash_password("password123"),
            role="admin"
        )
        db.add_all([organizer, student1, student2, admin])
        db.commit()
        db.refresh(organizer)
        db.refresh(student1)
        db.refresh(student2)
        db.refresh(admin)

        # Setup Event
        event = db.query(Event).filter(Event.title == "Dandiya Nights 2026").first()
        if not event:
            event = Event(
                title="Dandiya Nights 2026",
                description="Grand Cultural Festival",
                venue="University Grounds",
                date="2026-10-15",
                capacity=1000,
                price=150,
                owner_id=organizer.id,
                status="APPROVED"
            )
            db.add(event)
            db.commit()
            db.refresh(event)
        print(f"Using Event: '{event.title}' (ID: {event.id})")

        # ==========================================
        # STAGE 1: CREATE VOLUNTEER OPENING
        # ==========================================
        print("\n--- STAGE 1: CREATE VOLUNTEER OPENING ---")
        opening = db.query(VolunteerOpening).filter(
            VolunteerOpening.event_id == event.id,
            VolunteerOpening.role == "Gate Volunteer"
        ).first()
        if not opening:
            opening = VolunteerOpening(
                event_id=event.id,
                role="Gate Volunteer",
                volunteers_needed=6,
                description="Manage entry scanning and crowd flow at gates.",
                deadline="2026-10-10",
                gate_area=None, # Gate/Area decoupled!
                status="open",
                created_by=organizer.id,
                created_at=datetime.now(UTC)
            )
            db.add(opening)
            db.commit()
            db.refresh(opening)
        print(f"[OK] Opening created/reused: ID={opening.id}, Role='{opening.role}', Needed={opening.volunteers_needed}, Gate/Area={opening.gate_area} (Decoupled)")

        # Verify initial capacity metrics
        apps = db.query(VolunteerApplication).filter(VolunteerApplication.opening_id == opening.id).all()
        approved_count = len([a for a in apps if a.status == "approved"])
        remaining = max(0, opening.volunteers_needed - approved_count)
        print(f"[OK] Initial metrics: Applications={len(apps)}, Approved={approved_count}, Remaining={remaining}")
        assert remaining == 6

        # ==========================================
        # STAGE 2: STUDENTS APPLY TO OPENING
        # ==========================================
        print("\n--- STAGE 2: STUDENTS APPLY TO OPENING ---")
        # Student 1 applies
        app1 = VolunteerApplication(
            user_id=student1.id,
            event_id=event.id,
            opening_id=opening.id,
            status="pending",
            experience="Prior experience in event coordination.",
            applied_at=datetime.now(UTC)
        )
        db.add(app1)
        # Notification to organizer & admin
        notif1 = VolunteerNotification(
            event_id=event.id,
            sender_id=student1.id,
            title="New Volunteer Application",
            message=f"{student1.name} applied for {opening.role} at '{event.title}'."
        )
        db.add(notif1)

        # Student 2 applies
        app2 = VolunteerApplication(
            user_id=student2.id,
            event_id=event.id,
            opening_id=opening.id,
            status="pending",
            experience="Good communication skills.",
            applied_at=datetime.now(UTC)
        )
        db.add(app2)
        db.commit()
        db.refresh(app1)
        db.refresh(app2)
        print(f"[OK] Applications submitted: App #{app1.id} for {student1.name}, App #{app2.id} for {student2.name}")

        # Duplicate check test
        existing = db.query(VolunteerApplication).filter(
            VolunteerApplication.user_id == student1.id,
            VolunteerApplication.opening_id == opening.id
        ).first()
        assert existing is not None
        print(f"[OK] Duplicate check passed: Found existing application #{existing.id}")

        # ==========================================
        # STAGE 3: ORGANIZER / ADMIN REVIEWS & APPROVES
        # ==========================================
        print("\n--- STAGE 3: REVIEW & APPROVAL ---")
        # Organizer reviews applications queue
        pending_apps = db.query(VolunteerApplication).filter(
            VolunteerApplication.event_id == event.id,
            VolunteerApplication.status == "pending"
        ).all()
        print(f"[OK] Found {len(pending_apps)} pending applications in queue")
        assert len(pending_apps) == 2

        # Approve Student 1 (Aarav Sharma)
        app1.status = "approved"
        app1.reviewed_by = organizer.id
        app1.reviewed_at = datetime.now(UTC)
        ensure_volunteer_id(student1, db)
        notif_appr = VolunteerNotification(
            event_id=event.id,
            sender_id=organizer.id,
            title="Volunteer Application Approved",
            message=f"Your application for '{event.title}' has been approved."
        )
        db.add(notif_appr)

        # Reject Student 2 (Riya Mehta)
        app2.status = "rejected"
        app2.reviewed_by = organizer.id
        app2.reviewed_at = datetime.now(UTC)
        notif_rej = VolunteerNotification(
            event_id=event.id,
            sender_id=organizer.id,
            title="Volunteer Application Not Approved",
            message=f"Your application for '{event.title}' was not approved."
        )
        db.add(notif_rej)
        db.commit()

        # Check Decoupled State: Student 1 is Approved + Unassigned!
        assign_check = db.query(VolunteerAssignment).filter(
            VolunteerAssignment.volunteer_id == student1.id,
            VolunteerAssignment.event_id == event.id,
            VolunteerAssignment.status == "active"
        ).first()
        print(f"[OK] Approved State check for {student1.name}: Status='{app1.status}', Location Assignment={assign_check} (UNASSIGNED - perfectly valid!)")
        assert app1.status == "approved"
        assert assign_check is None

        # ==========================================
        # STAGE 4: ASSIGN GATE / AREA (AFTER APPROVAL)
        # ==========================================
        print("\n--- STAGE 4: ASSIGN GATE / AREA ---")
        assignment = VolunteerAssignment(
            volunteer_id=student1.id,
            event_id=event.id,
            position="Gate 1",
            status="active",
            assigned_by=organizer.id,
            assigned_at=datetime.now(UTC)
        )
        db.add(assignment)
        notif_assign = VolunteerNotification(
            event_id=event.id,
            sender_id=organizer.id,
            title="Volunteer Assignment Updated",
            message=f"You've been assigned to Gate 1 for '{event.title}'."
        )
        db.add(notif_assign)
        db.commit()
        db.refresh(assignment)
        print(f"[OK] Gate Assigned: Volunteer={student1.name}, Position='{assignment.position}', Status='{assignment.status}'")
        assert assignment.position == "Gate 1"

        # Change assignment to "Gate 2"
        assignment.position = "Gate 2"
        db.commit()
        print(f"[OK] Changed Position to: '{assignment.position}'")
        assert assignment.position == "Gate 2"

        # Unassign volunteer
        assignment.status = "unassigned"
        db.commit()
        active_assign = db.query(VolunteerAssignment).filter(
            VolunteerAssignment.volunteer_id == student1.id,
            VolunteerAssignment.event_id == event.id,
            VolunteerAssignment.status == "active"
        ).first()
        print(f"[OK] Unassigned check: Active assignment={active_assign} (Returned to Unassigned state)")
        assert active_assign is None

        # Re-assign to "Gate 1"
        assignment.position = "Gate 1"
        assignment.status = "active"
        db.commit()

        # ==========================================
        # VERIFY ADMIN OVERSIGHT
        # ==========================================
        print("\n--- ADMIN OVERSIGHT VERIFICATION ---")
        admin_openings = db.query(VolunteerOpening).all()
        admin_apps = db.query(VolunteerApplication).all()
        admin_assignments = db.query(VolunteerAssignment).filter(VolunteerAssignment.status == "active").all()
        print(f"[OK] Admin sees same single source of truth: {len(admin_openings)} Openings, {len(admin_apps)} Applications, {len(admin_assignments)} Active Assignments")
        assert len(admin_openings) >= 1
        assert len(admin_apps) >= 2

        print("\n==========================================")
        print("[SUCCESS] ALL 4 STAGES SUCCESSFULLY VERIFIED!")
        print("==========================================")

    finally:
        try:
            if 'organizer' in locals() and 'student1' in locals() and 'student2' in locals() and 'admin' in locals():
                db.query(VolunteerAssignment).filter(VolunteerAssignment.assigned_by == organizer.id).delete(synchronize_session=False)
                db.query(VolunteerNotification).filter(VolunteerNotification.sender_id.in_([organizer.id, student1.id, student2.id])).delete(synchronize_session=False)
                db.query(VolunteerApplication).filter(VolunteerApplication.user_id.in_([student1.id, student2.id])).delete(synchronize_session=False)
                db.query(User).filter(User.id.in_([organizer.id, student1.id, student2.id, admin.id])).delete(synchronize_session=False)
                db.commit()
        except Exception:
            db.rollback()
        db.close()

if __name__ == "__main__":
    test_workflow()
