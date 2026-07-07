from pydantic import BaseModel, Field

from pydantic import BaseModel

class RegistrationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    status: str

    model_config = {
        "from_attributes": True
    }