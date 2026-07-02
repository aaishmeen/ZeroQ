# ZeroQ

> Because entry shouldn't take an hour.

ZeroQ is a FastAPI-based event management and virtual queue system that streamlines event registrations, QR-based entry, and attendance management. It is being built as a scalable backend using FastAPI, PostgreSQL, and SQLAlchemy.

---

## Tech Stack

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Uvicorn
- python-dotenv

---

## Features

### User Management
- Create, Read, Update & Delete Users
- Email & Registration Number Validation
- Request & Response Schemas

### Event Management
- Create, Read, Update & Delete Events
- Event Validation
- Request & Response Schemas

### Registration Management
- Register Users for Events
- Prevent Duplicate Registrations
- Validate User & Event Existence
- Request & Response Schemas

### Database
- PostgreSQL Integration
- SQLAlchemy ORM
- Foreign Keys
- Relationships
- Session Management

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
├── frontend/          # Coming Soon
└── README.md
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

### Clone the repository

```bash
git clone <repository-url>
cd ZeroQ/backend
```

### Create & Activate Virtual Environment

```bash
python -m venv .venv
```

**Windows**

```bash
.venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Create a `.env` file

```env
DATABASE_URL=postgresql://username:password@localhost:5432/zeroq
```

### Run the Server

```bash
fastapi dev main.py
```

---

## Progress

### ✅ Completed

- FastAPI Setup
- PostgreSQL Integration
- SQLAlchemy ORM
- CRUD Operations
- Request Validation
- Response Models
- Foreign Keys
- SQLAlchemy Relationships
- User Management APIs
- Event Management APIs
- Registration Management APIs

### 🚧 In Progress

- Authentication (JWT)

### 📌 Planned

- Password Hashing
- Role-Based Authorization
- QR Ticket Generation
- QR Verification
- Attendance Tracking
- Event Capacity Management
- Admin Dashboard
- Frontend
- Deployment

---

## Project Status

🚧 ZeroQ is under active development. New features and improvements are being added regularly.