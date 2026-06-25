from pydantic import BaseModel, Field
from datetime import date

class EventsCreate(BaseModel):
    title:str = Field(min_length=3)
    description:str
    venue:str = Field(min_length=1)
    date:date
    capacity:int = Field(gt=0)
    price:float = Field(ge=0)
