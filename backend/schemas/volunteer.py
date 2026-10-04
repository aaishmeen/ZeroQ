from pydantic import BaseModel, EmailStr, Field
from datetime import datetime,date


class VolunteerSignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone_no: str = Field(pattern=r"^\d{10}$")
    password: str = Field(min_length=8)
    event_id: int | None = None


# ==========================================
# VOLUNTEER OPENINGS SCHEMAS
# ==========================================

class VolunteerOpeningCreate(BaseModel):
    event_id: int
    role: str = Field(min_length=2, max_length=100, description="Volunteer role / responsibility (e.g. Gate Volunteer)")
    volunteers_needed: int = Field(ge=1, default=1, description="Number of volunteers required")
    description: str | None = None
    deadline: str | None = None
    gate_area: str | None = None  # Optional initial preferred gate/area


class VolunteerOpeningUpdate(BaseModel):
    role: str | None = None
    volunteers_needed: int | None = None
    description: str | None = None
    deadline: str | None = None
    gate_area: str | None = None
    status: str | None = None  # "open", "closed"


class VolunteerOpeningResponse(BaseModel):
    id: int
    event_id: int
    role: str
    volunteers_needed: int
    description: str | None = None
    deadline: str | None = None
    gate_area: str | None = None
    status: str  # "open", "closed"
    created_at: datetime
    created_by: int
    event_title: str | None = None
    event_date: str | None = None
    event_venue: str | None = None
    applications_count: int = 0
    approved_count: int = 0
    remaining_count: int = 0

    model_config = {
        "from_attributes": True
    }


# ==========================================
# VOLUNTEER APPLICATIONS SCHEMAS
# ==========================================

class VolunteerApplicationApply(BaseModel):
    event_id: int
    opening_id: int | None = None
    experience: str | None = None


class VolunteerApplicationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    opening_id: int | None = None
    role_name: str | None = None
    status: str  # pending, approved, rejected
    experience: str | None = None
    applied_at: datetime
    reviewed_at: datetime | None = None
    student_name: str | None = None
    student_email: str | None = None
    student_phone: str | None = None
    volunteer_code: str | None = None
    event_title: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    assignment_id: int | None = None
    assigned_position: str | None = None  # e.g. "Gate 1", "Unassigned"

    model_config = {
        "from_attributes": True
    }


# ==========================================
# APPROVED VOLUNTEERS SCHEMAS
# ==========================================

class ApprovedVolunteerResponse(BaseModel):
    application_id: int
    volunteer_id: int
    student_name: str
    student_email: str
    student_phone: str | None = None
    volunteer_code: str | None = None
    avatar_url: str | None = None
    event_id: int
    event_title: str
    opening_id: int | None = None
    role_name: str
    approved_at: datetime | None = None
    assignment_id: int | None = None
    assigned_position: str | None = None  # null/None indicates "Unassigned"

    model_config = {
        "from_attributes": True
    }


# ==========================================
# VOLUNTEER ASSIGNMENT SCHEMAS
# ==========================================

class VolunteerAssignmentCreate(BaseModel):
    volunteer_id: int
    event_id: int
    position: str = Field(min_length=1, max_length=100)


class VolunteerAssignmentResponse(BaseModel):
    id: int
    volunteer_id: int
    event_id: int
    position: str
    status: str
    assigned_at: datetime
    volunteer_name: str | None = None
    volunteer_email: str | None = None
    volunteer_code: str | None = None
    event_title: str | None = None
    avatar_url: str | None = None
    bio: str | None = None

    model_config = {
        "from_attributes": True
    }


class AvailableVolunteerEventResponse(BaseModel):
    id: int
    title: str
    description: str
    venue: str
    date: date | str
    capacity: int
    volunteers_limit: int = 10
    approved_volunteers_count: int = 0
    banner_url: str | None = None
    status: str = "approved"
    application_status: str
    openings: list[VolunteerOpeningResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }


# ==========================================
# NOTIFICATION SCHEMAS
# ==========================================

class VolunteerNotificationCreate(BaseModel):
    event_id: int
    title: str = Field(min_length=2, max_length=150)
    message: str = Field(min_length=2, max_length=1000)


class VolunteerNotificationResponse(BaseModel):
    id: int
    event_id: int
    sender_id: int
    title: str
    message: str
    created_at: datetime
    event_title: str | None = None
    sender_name: str | None = None

    model_config = {
        "from_attributes": True
    }
