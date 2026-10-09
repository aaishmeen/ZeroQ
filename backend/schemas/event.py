from pydantic import BaseModel, Field
from datetime import date

class EventsCreate(BaseModel):
    title:str = Field(min_length=3)
    description:str
    venue:str = Field(min_length=1)
    date:date
    capacity:int = Field(gt=0)
    price:float = Field(ge=0)
    volunteers_limit: int = Field(default=10, ge=1)

class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    venue: str
    date: date
    capacity: int
    price: float
    volunteers_limit: int = 10
    owner_id: int
    status: str
    rejection_reason: str | None
    banner_url: str | None = None
    banner_public_id: str | None = None
    payment_qr_url: str | None = None

    model_config = {
        "from_attributes": True
    }

class EventReject(BaseModel):
    reason: str = Field(
        min_length=5,
        max_length=500
    )    