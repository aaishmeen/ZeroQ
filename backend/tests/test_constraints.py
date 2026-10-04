import sys
import os
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.database import Base, engine, SessionLocal
from models.user import User
from models.event import Event
from models.registration import Registration
from auth.hashing import hash_password

def test_constraints():
    print("=== TESTING DB UNIQUE CONSTRAINTS ===")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # Create a test user
        ts = 99999
        user = db.query(User).filter(User.email == "test_dup_reg@test.com").first()
        if not user:
            user = User(
                name="Dup Tester",
                email="test_dup_reg@test.com",
                phone="1234567890",
                password=hash_password("password123"),
                role="student"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        event = db.query(Event).filter(Event.title == "Unique Event 101").first()
        if not event:
            event = Event(
                title="Unique Event 101",
                description="Unique test event",
                venue="Auditorium A",
                date="2026-11-20",
                capacity=100,
                price=0,
                owner_id=user.id,
                status="APPROVED"
            )
            db.add(event)
            db.commit()
            db.refresh(event)

        # Test 1: Insert first registration
        reg1 = db.query(Registration).filter(Registration.user_id == user.id, Registration.event_id == event.id).first()
        if not reg1:
            reg1 = Registration(user_id=user.id, event_id=event.id, status="APPROVED", qr_token="test_token_101")
            db.add(reg1)
            db.commit()
            print("[OK] Initial registration created successfully.")

        # Test 2: Attempt duplicate registration insertion -> should trigger IntegrityError
        dup_reg = Registration(user_id=user.id, event_id=event.id, status="PENDING")
        db.add(dup_reg)
        try:
            db.commit()
            print("[FAIL] Duplicate registration was not blocked by DB constraint!")
            assert False, "Duplicate registration should fail DB constraint"
        except IntegrityError:
            db.rollback()
            print("[SUCCESS] Duplicate registration blocked by DB UniqueConstraint!")

        print("=== ALL CONSTRAINT TESTS PASSED PERFECTLY ===")
    finally:
        db.close()

if __name__ == "__main__":
    test_constraints()
