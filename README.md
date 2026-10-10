# ZeroQ — Smart Event Management & QR Attendance System

> **Because entry shouldn't take an hour.**

ZeroQ is an enterprise-grade university event management and rapid access control platform. Built with a **FastAPI** backend and a **React 19 + TypeScript** frontend, ZeroQ streamlines event discovery, online registrations, screenshot-based payment verification, unique QR ticket issuance, volunteer task coordination, dispute resolution, and instant QR-code attendance check-ins.

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Key Features](#2-key-features)
- [3. User Roles and Permissions](#3-user-roles-and-permissions)
- [4. System Architecture](#4-system-architecture)
- [5. Technology Stack](#5-technology-stack)
- [6. Project Structure](#6-project-structure)
- [7. Database Schema & Relationships](#7-database-schema--relationships)
- [8. Prerequisites](#8-prerequisites)
- [9. Local Development Setup](#9-local-development-setup)
- [10. Environment Variables](#10-environment-variables)
- [11. Database Setup and Migrations](#11-database-setup-and-migrations)
- [12. Testing & Production Safety Guard](#12-testing--production-safety-guard)
- [13. Database Backup & Recovery](#13-database-backup--recovery)
- [14. Deployment Configuration](#14-deployment-configuration)
- [15. Troubleshooting](#15-troubleshooting)
- [16. Security & Authorization Notes](#16-security--authorization-notes)
- [17. Contributing](#17-contributing)
- [18. License and Contact](#18-license-and-contact)

---

## 1. Project Overview

Campus event check-ins traditionally suffer from manual roll calls, physical ticket validation delays, and chaotic registration queues. ZeroQ solves these challenges by combining:

- **Automated Event Lifecycles**: Organizers publish events, admins review and approve them, active events are discoverable by students, and completed events auto-retire from discovery while remaining preserved in history.
- **Payment Verification Flow**: Multi-tier registration payment confirmation via screenshot upload and manual admin/organizer verification.
- **Secure QR Ticketing**: Approved registrations automatically issue cryptographically unique QR tokens accessible via student dashboards.
- **Instant Attendance Check-in**: Designated volunteers scan student QR tickets using web camera scanners. Instant verification prevents duplicate entry and logs exact check-in timestamps.
- **Volunteer Coordination**: Organizers post volunteer openings, students apply, and organizers assign specific event duties.
- **Dispute Resolution Portal**: Students can flag registration or payment issues, allowing administrators to audit and resolve conflicts directly within the system.

---

## 2. Key Features

### 🔐 Authentication & Profile Management
- JWT Bearer token authentication (OAuth2 Password flow).
- Password hashing with `bcrypt` / `passlib`.
- Role-based profile management with department, registration number, phone number, and avatar uploads.

### 📅 Event Management Lifecycle
- Event creation with venue, date ranges, capacity limits, registration fees, and banner images.
- Status management (`active`, `completed`, `pending`, `cancelled`).
- Event discovery API filtering: active events are open for registration; completed events are hidden from public discovery.

### 💳 Registrations & Payment Verification
- Student event registration with real-time capacity validation.
- Payment screenshot upload with transaction ID tracking.
- Manual review workflow (Approve / Reject with custom rejection reasons).

### 🎟️ QR Ticketing & Rapid Check-In
- Unique QR token string generation upon registration approval.
- Built-in QR ticket renderer on student dashboard.
- Volunteer camera-based QR scanner using `html5-qrcode`.
- Instant check-in verification with duplicate scan blocking and attendance logging.

### 🤝 Volunteer Operations
- Organizers post volunteer openings with spot counts and perks.
- Students apply for volunteer roles; organizers approve applications and assign tasks.
- In-app notification center for volunteer updates.

### ⚖️ Dispute Resolution System
- Ticket and payment dispute submission for students.
- Admin review interface with resolution notes and status updates (`open`, `in_review`, `resolved`).

---

## 3. User Roles and Permissions

Authorization is enforced on the backend via FastAPI dependencies (`require_role`, `require_volunteer_access`).

| Role | Core Capabilities & Permissions | Access Level |
| :--- | :--- | :--- |
| **Student** | Browse active events, register, upload payment proofs, view QR tickets, apply for volunteer roles, submit disputes. | Public & Student Routes |
| **Volunteer** | Access Volunteer Dashboard, scan attendee QR codes for check-in, view assigned tasks and notifications. | Volunteer & Check-In Portal |
| **Organizer** | Create events, manage owned events, view attendee lists, publish volunteer openings, assign volunteer tasks. | Organizer Portal |
| **Admin** | Review & approve events, verify payment screenshots, audit registrations, oversee user roles, resolve disputes. | Admin Management System |
| **Superadmin** | Full system governance, management of admin account approval statuses, global overrides. | System-Wide Superadmin |

---

## 4. System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 19 + TypeScript)"]
        UI["Vite + React SPA"]
        Scanner["Camera QR Scanner (html5-qrcode)"]
        Dashboards["Role Dashboards (Student, Volunteer, Organizer, Admin, Superadmin)"]
    end

    subgraph Backend ["Backend (FastAPI Engine)"]
        API["FastAPI Routers"]
        Auth["OAuth2 + JWT Auth Dependency"]
        Models["SQLAlchemy ORM"]
    end

    subgraph Storage ["Data & File Storage"]
        DB[(PostgreSQL Database)]
        Uploads["Local Static Uploads / Cloudinary"]
    end

    UI -->|HTTPS / REST API| API
    Scanner -->|POST /attendances/check-in| API
    Dashboards -->|Bearer Token Requests| API
    API --> Auth
    Auth --> Models
    Models --> DB
    API --> Uploads
```

---

## 5. Technology Stack

### Backend
- **Framework**: FastAPI `0.138.0`
- **ASGI Server**: Uvicorn `0.49.0`
- **Database ORM**: SQLAlchemy `2.0.51`
- **Database Driver**: Psycopg2-binary `2.9.12`
- **Migrations**: Alembic
- **Authentication**: Python-jose (JWT) `3.5.0`, Passlib (bcrypt) `1.7.4`
- **Validation**: Pydantic `2.13.4`
- **QR Utilities**: `qrcode[pil]`
- **Media Storage**: Cloudinary / Static File Mounting

### Frontend
- **Framework**: React `19.2.8`
- **Language**: TypeScript `6.0.2`
- **Build Tool**: Vite `8.2.2`
- **Styling**: Tailwind CSS `4.3.3`
- **HTTP Client**: Axios `1.2.0`
- **Icons**: Lucide React `1.34.0`
- **QR Scanner**: `html5-qrcode` `2.3.8`

---

## 6. Project Structure

```text
ZeroQ/
├── backend/
│   ├── alembic/              # Database migration scripts & env.py
│   ├── auth/                 # Password hashing & JWT token handling
│   │   ├── hashing.py
│   │   └── jwt_handler.py
│   ├── constants/            # Enum definitions (statuses, roles)
│   ├── database/             # SQLAlchemy engine & session management
│   │   └── database.py
│   ├── dependencies/         # FastAPI authentication & authorization guards
│   │   └── auth.py
│   ├── models/               # SQLAlchemy database models
│   │   ├── user.py
│   │   ├── event.py
│   │   ├── registration.py
│   │   ├── payment.py
│   │   ├── volunteer.py
│   │   ├── notification.py
│   │   └── dispute.py
│   ├── routers/              # REST API endpoint handlers
│   │   ├── users.py
│   │   ├── events.py
│   │   ├── registrations.py
│   │   ├── payments.py
│   │   ├── tickets.py
│   │   ├── attendances.py
│   │   ├── volunteers.py
│   │   └── disputes.py
│   ├── schemas/              # Pydantic request & response models
│   ├── services/             # Business logic & QR generation
│   ├── uploads/              # Local upload storage (avatars, payments, banners)
│   ├── tests/                # Pytest test suite & fixtures
│   ├── conftest.py           # Production DB safety guard
│   ├── main.py               # FastAPI app entry point & CORS configuration
│   ├── requirements.txt      # Python dependencies
│   └── alembic.ini           # Alembic configuration
│
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios API client modules
│   │   ├── components/       # UI components & role-specific dashboards
│   │   │   ├── auth/
│   │   │   ├── dashboard/    # Student, Volunteer, Organizer, Admin, Superadmin dashboards
│   │   │   ├── events/
│   │   │   ├── payments/
│   │   │   └── tickets/
│   │   ├── context/          # React Auth context
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Main application routing
│   │   └── main.tsx          # React entry point
│   ├── package.json          # Node.js dependencies & scripts
│   └── vite.config.ts        # Vite configuration
│
├── docs/                     # Additional project notes
├── .gitignore                # Workspace git ignore rules
└── README.md                 # Project documentation
```

---

## 7. Database Schema & Relationships

The database is built on PostgreSQL via SQLAlchemy ORM. All QR tokens and check-in metadata are stored directly on the `registrations` table.

```mermaid
erDiagram
    users ||--o{ events : organizes
    users ||--o{ registrations : registers
    events ||--o{ registrations : contains
    registrations ||--o| payments : includes
    events ||--o{ volunteer_openings : posts
    volunteer_openings ||--o{ volunteer_applications : receives
    users ||--o{ volunteer_applications : applies
    volunteer_applications ||--o| volunteer_assignments : assigns
    users ||--o{ volunteer_notifications : receives
    users ||--o{ disputes : files
    registrations ||--o{ disputes : concerns

    users {
        int id PK
        string name
        string email UK
        string hashed_password
        string role
        string approval_status
    }
    events {
        int id PK
        int organizer_id FK
        string title
        string status
        datetime start_date
        datetime end_date
    }
    registrations {
        int id PK
        int user_id FK
        int event_id FK
        string registration_status
        string qr_token
        boolean is_checked_in
        datetime check_in_time
    }
    payments {
        int id PK
        int registration_id FK
        int user_id FK
        float amount
        string screenshot_url
        string status
    }
    volunteer_openings {
        int id PK
        int event_id FK
        string title
        int spots_needed
        string status
    }
    volunteer_applications {
        int id PK
        int opening_id FK
        int user_id FK
        string status
    }
    volunteer_assignments {
        int id PK
        int application_id FK
        string assigned_task
        string status
    }
    disputes {
        int id PK
        int user_id FK
        int registration_id FK
        string status
    }
```

### Table Summary
1. **`users`**: User profiles with roles (`student`, `volunteer`, `organizer`, `admin`, `superadmin`) and approval status (`approved`, `pending`, `rejected`).
2. **`events`**: Events created by organizers and reviewed by admins. Statuses: `active` (visible/open), `completed` (retired from discovery), `pending`, `cancelled`.
3. **`registrations`**: Event registrations linking users and events. Contains `registration_status` (`approved`, `pending`, `rejected`), `qr_token` (unique QR string), `is_checked_in` (boolean flag), and `check_in_time` (timestamp).
4. **`payments`**: Screenshot uploads for paid registrations. Tracks `amount`, `payment_method`, `transaction_id`, `screenshot_url`, `status`, and `reviewed_by`.
5. **`volunteer_openings`**: Openings published by organizers (`spots_needed`, `spots_filled`, `perks`, `status`).
6. **`volunteer_applications`**: Student/volunteer applications for openings (`status`: `pending`, `approved`, `rejected`).
7. **`volunteer_assignments`**: Specific task assignments for approved volunteers (`assigned_task`, `status`: `active`, `completed`).
8. **`volunteer_notifications`**: In-app notifications sent to volunteers (`title`, `message`, `type`, `is_read`).
9. **`disputes`**: Ticket or payment dispute tickets filed by students (`status`: `open`, `in_review`, `resolved`, `resolution_notes`).

---

## 8. Prerequisites

Before running ZeroQ locally, ensure you have installed:

- **Python**: `3.10` or higher
- **Node.js**: `18.0` or higher (npm `9+`)
- **PostgreSQL**: `14.0` or higher (local instance or cloud database)

---

## 9. Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aaishmeen/ZeroQ.git
cd ZeroQ
```

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
# On Windows:
python -m venv .venv
.venv\Scripts\activate

# On macOS/Linux:
# python3 -m venv .venv
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create local environment configuration
cp env.example .env
```

Configure your `.env` file with your local database URL and secrets (see [Environment Variables](#10-environment-variables)).

```bash
# Run database migrations
alembic upgrade head

# Start the FastAPI server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend API will be available at:
- **API Base**: `http://127.0.0.1:8000`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to frontend directory
cd ZeroQ/frontend

# Install dependencies
npm install

# Create environment configuration
# Ensure VITE_API_URL points to your local backend
# VITE_API_URL=http://127.0.0.1:8000

# Start the Vite development server
npm run dev
```

The application frontend will be available at `http://localhost:5173`.

---

## 10. Environment Variables

### Backend (`backend/.env`)

```env
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/zeroq

# Security & Authentication
SECRET_KEY=your_secure_random_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Cloudinary Storage (Optional - falls back to local /uploads directory)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env`)

```env
# API URL endpoint
VITE_API_URL=http://127.0.0.1:8000
```

> [!WARNING]
> Never commit actual passwords, secrets, API keys, or production database credentials to repository version control.

---

## 11. Database Setup and Migrations

ZeroQ uses **Alembic** for schema migrations.

```bash
cd backend

# Apply all pending migrations to latest version
alembic upgrade head

# Create a new migration after updating SQLAlchemy models
alembic revision --autogenerate -m "describe_your_change"

# Rollback one migration step
alembic downgrade -1
```

---

## 12. Testing & Production Safety Guard

### Production Safety Guard
To protect live database environments, ZeroQ includes an unconditional autouse Pytest fixture in [`backend/conftest.py`](file:///c:/projects/ZeroQ/ZeroQ/backend/conftest.py) and [`backend/tests/conftest.py`](file:///c:/projects/ZeroQ/ZeroQ/backend/tests/conftest.py):

```python
@pytest.fixture(scope="session", autouse=True)
def guard_remote_database():
    url = os.getenv("DATABASE_URL", "")
    if "supabase" in url.lower() or "render" in url.lower() or "pooler" in url.lower():
        pytest.exit("Pytest is REFUSING to run against remote/production database URL!")
```

If `DATABASE_URL` contains `supabase`, `render`, or `pooler`, Pytest immediately terminates execution to prevent test scripts from mutating or polluting production data.

### Running Tests Safely
Always run tests against an isolated local test database:

```bash
cd backend

# Set isolated test database URL and execute pytest
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zeroq_test pytest
```

---

## 13. Database Backup & Recovery

The project includes local recovery assets ignored by version control (`.gitignore`):
- `backend/zeroq_database_backup.json`: JSON baseline backup snapshot.
- `backend/zeroq_postgres_restoration.sql`: Native PostgreSQL SQL restoration statements.

### Restoration Procedure
To restore the baseline database snapshot into an isolated PostgreSQL instance:

```bash
# Using native psql restoration
psql -h localhost -U postgres -d zeroq_test -f backend/zeroq_postgres_restoration.sql
```

---

## 14. Deployment Configuration

### Backend Deployment (Render / Railway)
- **Environment**: Python 3.10+
- **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Required Environment Variables**: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`.

### Frontend Deployment (Vercel / Netlify)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Required Environment Variables**: `VITE_API_URL=https://your-backend-api.onrender.com`

---

## 15. Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `Pytest is REFUSING to run...` | `DATABASE_URL` is pointing to a remote Supabase or Render database. | Set `DATABASE_URL` to a local test DB (`postgresql://.../zeroq_test`) before running `pytest`. |
| CORS errors in browser console | Frontend origin missing from backend CORS middleware list. | Add your frontend URL to `allow_origins` in `backend/main.py`. |
| `401 Unauthorized` on API requests | Expired or missing Bearer token. | Re-authenticate via `/users/login` and include header `Authorization: Bearer <token>`. |
| QR scanner fails to start | Camera permission denied or HTTPS requirement. | Ensure browser camera permissions are allowed and frontend is served over HTTPS or localhost. |

---

## 16. Security & Authorization Notes

- **Password Hashing**: Passwords are hashed using `bcrypt` via `passlib`. Plaintext passwords are never saved.
- **JWT Authorization**: Requests to protected routes require a Bearer JWT token signed with `HS256`.
- **Role Enforcement**: Endpoint permissions are strictly validated on the backend via dependencies (`require_role("admin", "organizer")`).
- **Database Safety**: Production safety guards prevent test runs from altering live remote databases.

---

## 17. Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Ensure all tests pass locally against an isolated database.
4. Commit your changes (`git commit -m "Add amazing feature"`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

---

## 18. License and Contact

- **License**: Project license details managed by repository owner.
- **Project Link**: [https://github.com/aaishmeen/ZeroQ](https://github.com/aaishmeen/ZeroQ)