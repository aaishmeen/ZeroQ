from pydantic import BaseModel, EmailStr, Field, field_validator

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    reg_no: str | None = Field(default=None, max_length=20)
    phone_no: str = Field(pattern=r"^\d{10}$")
    password: str = Field(min_length=8)
    role: str = "student"

    @field_validator("email", mode="before")
    @classmethod
    def sanitize_email(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("reg_no", mode="before")
    @classmethod
    def sanitize_reg_no(cls, v):
        if not v or not isinstance(v, str) or not v.strip():
            return None
        return v.strip()

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    reg_no: str | None = None
    phone: str
    role: str
    status: str | None = "approved"
    volunteer_id: str | None = None
    avatar_url: str | None = None
    avatar_public_id: str | None = None
    bio: str | None = None
    is_approved_volunteer: bool = False

    model_config = {
        "from_attributes": True
    }    

class UserBioUpdate(BaseModel):
    bio: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str    

    @field_validator("email", mode="before")
    @classmethod
    def sanitize_email(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

class Token(BaseModel):
    access_token: str
    token_type: str    

from typing import Literal

class UserRoleUpdate(BaseModel):
    role: Literal[
        "admin",
        "organizer",
        "student",
        "volunteer"
    ]

class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, pattern=r"^\d{10}$")
    bio: str | None = None

class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)