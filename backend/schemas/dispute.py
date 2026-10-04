from pydantic import BaseModel, Field
from datetime import datetime


class DisputeCreate(BaseModel):
    category: str = Field(min_length=2, max_length=100)
    registration_id: int | None = None
    description: str = Field(min_length=5, max_length=1000)


class DisputeStatusUpdate(BaseModel):
    status: str  # OPEN, IN_REVIEW, RESOLVED, CLOSED


class DisputeResponse(BaseModel):
    id: int
    event_id: int
    volunteer_id: int
    position: str
    category: str
    registration_id: int | None = None
    description: str
    status: str
    created_at: datetime
    resolved_at: datetime | None = None
    volunteer_name: str | None = None
    event_title: str | None = None

    model_config = {
        "from_attributes": True
    }
