# ZeroQ

> Because entry shouldn't take an hour.

ZeroQ is a FastAPI-based event management and virtual queue system designed to simplify event registrations and eliminate long waiting lines. It provides user management, event management, and event registration APIs backed by PostgreSQL and SQLAlchemy.

---

## Tech Stack

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Uvicorn

---

## Features

### Users
- Create User
- Get All Users
- Get User by ID
- Update User
- Delete User
- Duplicate Email Validation
- Duplicate Registration Number Validation

### Events
- Create Event
- Get All Events
- Get Event by ID
- Update Event
- Delete Event
- Duplicate Event Validation

### Registrations
- Register User for Event
- Get All Registrations
- Get Registration by ID
- Delete Registration
- Prevent Duplicate Registrations
- Validate User & Event Existence

---

## Project Structure

```text
ZeroQ/
│
├── backend/
│   ├── database/
│   │   └── database.py
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
│   ├── .env.example
│   ├── .gitignore
│   ├── main.py
│   └── requirements.txt
│
└── frontend/ (Coming Soon)
```

---

## Architecture

```text
Client
   │
   ▼
FastAPI Routers
   │
   ▼
Pydantic Schemas
   │
   ▼
SQLAlchemy Models
   │
   ▼
PostgreSQL
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ZeroQ/backend
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the virtual environment

**Windows**

```bash
.venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Create a `.env` file

```env
DATABASE_URL=postgresql://username:password@localhost:5432/zeroq
```

### 6. Run the server

```bash
fastapi dev main.py
```

or

```bash
uvicorn main:app --reload
```

---

## Current Progress

- ✅ FastAPI Setup
- ✅ PostgreSQL Integration
- ✅ SQLAlchemy Models
- ✅ CRUD APIs
- ✅ Request Validation
- ✅ User Management
- ✅ Event Management
- ✅ Registration Management

### Upcoming

- Foreign Keys
- SQLAlchemy Relationships
- JWT Authentication
- Password Hashing
- QR Ticket Generation
- QR Verification
- Attendance Tracking
- Admin Dashboard
- Frontend Integration

---

