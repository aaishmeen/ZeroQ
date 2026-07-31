# ZeroQ

> Because entry shouldn't take an hour.

ZeroQ is a FastAPI-powered event registration and attendance management platform designed to eliminate long queues during event entry. It provides secure authentication, role-based access control, event management, payment verification, QR ticket generation, and QR-based attendance tracking.

---

# Tech Stack

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Pydantic
- JWT Authentication
- Passlib (bcrypt)
- python-dotenv
- qrcode
- Pillow
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

## Authentication & Authorization

- JWT Token Generation
- OAuth2 Password Flow
- Bearer Token Authentication
- Current User Dependency
- Role-Based Access Control
- Admin
- Organizer
- Student

---

## Event Management

- Create, Read, Update & Delete Events
- Duplicate Event Validation
- Protected Event Creation
- Organizer Ownership Validation
- Event Approval Workflow
- Request & Response Schemas

---

## Registration Management

- Register Users for Events
- Prevent Duplicate Registrations
- Validate User & Event Existence
- View Personal Registrations
- Admin View of All Registrations

---

## Payment Verification

- Upload Payment Screenshots
- Manual Payment Approval
- Manual Payment Rejection
- Registration Status Updates
- Payment Review History

---

## QR Ticketing

- Automatic QR Token Generation
- Secure QR Ticket Generation
- QR Retrieval for Approved Registrations
- One QR Ticket Per Registration

---

## Attendance Management

- QR-Based Check-In
- Duplicate Scan Prevention
- Attendance Timestamp Recording

---

## Database

- PostgreSQL Integration
- SQLAlchemy ORM
- Alembic Migrations
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
│   │
│   ├── database/
│   │
│   ├── dependencies/
│   │
│   ├── models/
│   │
│   ├── routers/
│   │
│   ├── schemas/
│   │
│   ├── services/
│   │
│   ├── uploads/
│   │   └── payments/
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
Dependencies & Authentication
   │
   ▼
Service Layer
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

## Run Database Migrations

```bash
alembic upgrade head
```

---

## Run the Server

```bash
uvicorn main:app --reload
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
- Alembic Migrations
- CRUD APIs
- Request Validation
- Response Models
- Database Relationships
- User Management
- JWT Authentication
- OAuth2 Login
- Protected Routes
- Role-Based Authorization
- Event Management
- Registration Management
- Payment Upload Workflow
- Payment Approval & Rejection
- QR Token Generation
- QR Ticket Generation
- QR-Based Check-In
- Duplicate Check-In Prevention

---

## 🚧 In Progress

- Event Analytics
- Organizer Dashboard APIs

---

## 📌 Planned

- Attendance Reports
- Ticket PDF Generation
- Volunteer Dashboard
- Student Dashboard
- Admin Dashboard
- Email Notifications
- Payment Gateway Integration
- Frontend
- Deployment

---

# Current Workflow

```text
Student
    │
Register for Event
    │
Upload Payment Screenshot
    │
Admin Reviews Payment
    │
Payment Approved
    │
QR Ticket Generated
    │
Volunteer Scans QR
    │
Attendance Recorded
```

---

# Project Status

🚧 ZeroQ is currently under active development. The backend now supports secure authentication, role-based authorization, event management, payment verification, QR ticket generation, and QR-based attendance tracking. Upcoming milestones include analytics, dashboards, frontend development, and deployment.