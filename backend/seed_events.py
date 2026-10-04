import sys
import os
from datetime import date

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal, engine, Base
from models.user import User
from models.event import Event
from auth.hashing import hash_password
from constants.event_status import EventStatus
from models.registration import Registration
from models.payment import Payment

def seed_database():
    db = SessionLocal()
    try:
        # Create tables if not present
        Base.metadata.create_all(bind=engine)

        # Ensure demo accounts exist with clean passwords
        demo_accounts = [
            ("Student Demo", "student@example.com", "REG-STUDENT-01", "9876543210", "password123", "student", "approved"),
            ("Volunteer Demo", "vol@example.com", "VOL-DEMO-01", "9876543211", "password123", "volunteer", "approved"),
            ("Campus Event Board", "organizer@zeroq.edu.in", "ORG-2026-01", "9876543212", "organizer123", "organizer", "approved"),
            ("Campus Admin", "admin@example.com", "ADM-2026-01", "9876543213", "admin123", "admin", "approved"),
            ("Super Admin", "superadmin@zeroq.edu.in", "SUP-2026-01", "9876543214", "superadmin123", "superadmin", "approved"),
        ]

        organizer = None
        for name, email, reg, phone, pwd, role, status in demo_accounts:
            usr = db.query(User).filter(User.email == email).first()
            if not usr:
                usr = User(
                    name=name,
                    email=email,
                    reg_no=reg,
                    phone=phone,
                    password=hash_password(pwd),
                    role=role,
                    status=status
                )
                db.add(usr)
                db.commit()
                db.refresh(usr)
            else:
                usr.password = hash_password(pwd)
                usr.status = status
                db.commit()
            if email == "organizer@zeroq.edu.in":
                organizer = usr

        # Legitimate Indian College Events
        mock_events = [
            {
                "title": "HackInit 2026 - 36hr National Hackathon",
                "description": "The premier 36-hour national inter-college hackathon. Build innovative solutions in AI, FinTech, Web3, and Open Innovation. Cash prize pool of ₹1,500,000 + mentorship from industry leaders.",
                "venue": "APJ Abdul Kalam Auditorium, Campus Tech Block",
                "date": date(2026, 9, 15),
                "capacity": 300,
                "price": 250.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "TechSparks 2026 - Annual Technical Fest",
                "description": "Annual flagship tech festival featuring robo-wars, coding marathons, AI paper presentations, and drone racing. Join 1,000+ tech enthusiasts across Indian universities.",
                "venue": "Main Open Air Theatre (OAT) & Electronics Complex",
                "date": date(2026, 9, 22),
                "capacity": 1200,
                "price": 499.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "Tarang 2026 - Cultural Fest & Pro-Nite Concert",
                "description": "The biggest cultural extravaganza of the campus! Live musical concert performance by top artists, battle of the bands, fashion show, and street dance competitions.",
                "venue": "University Football Ground & Main Stage",
                "date": date(2026, 10, 5),
                "capacity": 3500,
                "price": 499.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "PyData & LLM Masterclass Workshop",
                "description": "An intensive 1-day hands-on workshop on PyTorch, Large Language Models, and Model Fine-tuning led by senior AI engineers. Certificates provided to all participants.",
                "venue": "Computer Science Lab 3, IT Building",
                "date": date(2026, 9, 10),
                "capacity": 80,
                "price": 150.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "E-Cell Campus Summit & Startup Pitch Tank",
                "description": "Pitch your startup idea to real VCs and angel investors! Keynotes by successful alumni founders, networking sessions, and ₹500,000 equity-free seed grant for top 3 teams.",
                "venue": "Management Block Seminar Hall A",
                "date": date(2026, 9, 28),
                "capacity": 250,
                "price": 0.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "RoboRumble 2026 - Combat Robotics Tournament",
                "description": "High-octane 15kg & 60kg bot combat battles, maze solvers, and line followers. Test your mechanical & embedded engineering skills in the arena.",
                "venue": "Mechanical Engineering Arena",
                "date": date(2026, 10, 12),
                "capacity": 500,
                "price": 350.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "CodeSprint 5.0 - Speed Programming Challenge",
                "description": "2-hour intense algorithm sprint hosted on CodeChef platform. Test your data structures & algorithm optimization under pressure with instant leaderboard ranking.",
                "venue": "Central Computing Center (CCC)",
                "date": date(2026, 9, 18),
                "capacity": 150,
                "price": 99.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "Kala 2026 - Fine Arts & Canvas Exhibition",
                "description": "A grand exhibition of fine arts, modern paintings, sculpture, and canvas painting competitions. Express your creativity and get evaluated by renowned artists.",
                "venue": "Visual Arts Gallery, Architecture Block",
                "date": date(2026, 11, 20),
                "capacity": 200,
                "price": 199.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "Nritya 2026 - Classical Dance Competition",
                "description": "A cultural evening dedicated to traditional and classical dance forms. Solo and group performances showcasing the rich heritage of India.",
                "venue": "University Auditorium",
                "date": date(2026, 10, 25),
                "capacity": 400,
                "price": 149.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            },
            {
                "title": "Cloud Computing Hands-on Bootcamp",
                "description": "Learn the basics of AWS, Azure, and Google Cloud in a fast-paced interactive bootcamp. Deploy your first serverless application and web hosting.",
                "venue": "IT Block, Lab 2",
                "date": date(2026, 11, 5),
                "capacity": 150,
                "price": 299.0,
                "status": EventStatus.APPROVED.value,
                "owner_id": organizer.id
            }
        ]

        added_count = 0
        for event_data in mock_events:
            existing = db.query(Event).filter(Event.title == event_data["title"]).first()
            if not existing:
                event = Event(**event_data)
                db.add(event)
                added_count += 1

        db.commit()
        print(f"Successfully seeded {added_count} Indian college events into the database!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
