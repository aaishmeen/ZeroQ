# ZeroQ

> Because entry shouldn't take an hour.

ZeroQ is a FastAPI-powered event registration and attendance management platform designed to eliminate long queues during event entry. It provides secure user authentication, event management, registrations, and serves as the foundation for QR-based ticket verification and attendance tracking.

---

# Tech Stack

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- JWT Authentication
- Passlib (bcrypt)
- python-dotenv
- Uvicorn

---

# Features

## User Management

- Create, Read, Update & Delete Users
- Email & Registration Number Validation
- Password Hashing (bcrypt)
- JWT Authentication
- Secure Login
- Protected Routes
- Request & Response Schemas

---

## Event Management

- Create, Read, Update & Delete Events
- Duplicate Event Validation
- Protected Event Creation
- Request & Response Schemas

---

## Registration Management

- Register Users for Events
- Prevent Duplicate Registrations
- Validate User Existence
- Validate Event Existence
- Request & Response Schemas

---

## Authentication

- JWT Token Generation
- OAuth2 Password Flow
- Password Hashing
- Bearer Token Authentication
- Current User Dependency
- Protected API Endpoints

---

## Database

- PostgreSQL Integration
- SQLAlchemy ORM
- Foreign Keys
- Relationships
- Session Management

---

# Project Structure

```text
ZeroQ/
│
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   ├── README
│   │   └── script.py.mako
│   │
│   ├── auth/
│   │   ├── hashing.py
│   │   └── jwt_handler.py
│   │
│   ├── constants/
│   │   ├── event_status.py
│   │   └── registration_status.py
│   │
│   ├── database/
│   │   └── database.py
│   │
│   ├── dependencies/
│   │   ├── auth.py
│   │   └── event.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── event.py
│   │   └── registration.py
│   │
│   ├── routers/
│   │   ├── users.py
│   │   ├── events.py
│   │   └── registrations.py
│   │
│   ├── schemas/
│   │   ├── user.py
│   │   ├── event.py
│   │   └── registration.py
│   │
│   ├── services/
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── alembic.ini
│   ├── main.py
│   └── requirements.txt
│
├── frontend/          # Coming Soon
└── README.md
```

---

# Architecture

```text
Client
   │
   ▼
FastAPI Routers
   │
   ▼
Authentication Layer
   │
   ▼
Pydantic Schemas
   │
   ▼
SQLAlchemy Models
   │
   ▼
PostgreSQL Database
```

---

# Getting Started

## Clone the Repository

```bash
git clone <repository-url>
cd ZeroQ/backend
```

---

## Create a Virtual Environment

```bash
python -m venv .venv
```

### Windows

```bash
.venv\Scripts\activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Create a `.env` File

```env
DATABASE_URL=postgresql://username:password@localhost:5432/zeroq

SECRET_KEY=your_secret_key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## Run the Server

```bash
fastapi dev main.py
```

---

## API Documentation

Swagger UI

```
http://127.0.0.1:8000/docs
```

ReDoc

```
http://127.0.0.1:8000/redoc
```

---

# Progress

## ✅ Completed

- FastAPI Project Setup
- PostgreSQL Integration
- SQLAlchemy ORM
- CRUD APIs
- Request Validation
- Response Models
- Database Relationships
- User Management
- Event Management
- Registration Management
- Password Hashing
- JWT Authentication
- OAuth2 Login
- Protected Routes
- Role-Based Authorization

---

## 🚧 In Progress

- Payment Verification Workflow

---

## 📌 Planned

- QR Ticket Generation
- QR Code Verification
- Attendance Tracking
- Event Capacity Management
- Organizer Dashboard
- Volunteer Dashboard
- Student Dashboard
- Admin Dashboard
- File Uploads
- Email Notifications
- Frontend
- Deployment

---

# Future Workflow

```text
Student
    │
Register
    │
Upload Payment Proof
    │
Admin Verification
    │
QR Ticket Generated
    │
Event Check-In
    │
QR Scan
    │
Attendance Recorded
```

---

# Project Status

🚧 ZeroQ is currently under active development. The backend foundation is complete with authentication, database integration, and core CRUD functionality. Upcoming milestones include role-based access control, payment verification, QR ticket generation, and attendance management.

---
