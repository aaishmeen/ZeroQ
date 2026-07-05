from pydantic import BaseModel, Field
from datetime import date

class EventsCreate(BaseModel):
    title:str = Field(min_length=3)
    description:str
    venue:str = Field(min_length=1)
    date:date
    capacity:int = Field(gt=0)
    price:float = Field(ge=0)

class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    venue: str
    date: date
    capacity: int
    price: float
    owner_id: int
    status: str
    rejection_reason: str | None

    model_config = {
        "from_attributes": True
    }

class EventReject(BaseModel):
    reason: str = Field(
        min_length=5,
        max_length=500
    )    