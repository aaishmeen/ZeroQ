from pydantic import BaseModel, Field

class RegistrationCreate(BaseModel):
    user_id: int = Field(gt=0)
    event_id: int = Field(gt=0)