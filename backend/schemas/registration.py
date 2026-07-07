from pydantic import BaseModel

class RegistrationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    status: str

    model_config = {
        "from_attributes": True
    }

class RegistrationDetailsResponse(BaseModel):
    id: int
    status: str

    user_id: int
    student_name: str
    student_email: str
    registration_number: str

    model_config = {
        "from_attributes": True
    }    