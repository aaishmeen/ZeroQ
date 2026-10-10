# ZeroQ Roadmap & Milestone Status

## Completed Milestones (v0.1.0)

### Phase 1: Core Framework & API Foundation
- [x] FastAPI project initialization and Uvicorn server setup
- [x] Health check endpoints (`/health`, `/`)
- [x] CORS middleware configuration for production frontend origins

### Phase 2: Database Layer & Persistence
- [x] PostgreSQL integration with SQLAlchemy ORM
- [x] Database migrations with Alembic
- [x] Table models for users, events, registrations, payments, volunteer openings, applications, assignments, notifications, and disputes

### Phase 3: Authentication & Security
- [x] Password hashing using `bcrypt` via `passlib`
- [x] OAuth2 Password bearer JWT authentication (`/users/login`)
- [x] Role-Based Access Control (`student`, `volunteer`, `organizer`, `admin`, `superadmin`)
- [x] Production database Pytest safety guard (`backend/conftest.py`)

### Phase 4: Event & Registration Workflow
- [x] Event creation, update, approval, and retirement (`active` vs `completed` status filtering)
- [x] Event registration with capacity enforcement
- [x] Payment screenshot upload and manual admin review flow (Approve / Reject)

### Phase 5: QR Ticketing & Rapid Access Control
- [x] Cryptographic unique QR token generation per approved registration
- [x] React frontend camera-based QR code scanner (`html5-qrcode`)
- [x] Instant volunteer QR check-in verification & duplicate scan prevention

### Phase 6: Volunteer Operations & Dispute Management
- [x] Volunteer opening creation, student application, and task assignment
- [x] In-app notification dispatcher for volunteers
- [x] Student ticket/payment dispute portal with admin resolution tracking

---

## Future Enhancements
- [ ] Automated email notification dispatcher (SMTP / SendGrid)
- [ ] Direct Payment Gateway integration (Razorpay / Stripe)
- [ ] PDF ticket export with embedded QR code
- [ ] Event analytics and attendance export (CSV / Excel)