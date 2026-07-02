from pydantic import BaseModel, Field

class RegistrationCreate(BaseModel):
    user_id: int = Field(gt=0)
    event_id: int = Field(gt=0)

class RegistrationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int

    model_config = {
        "from_attributes": True
    }    