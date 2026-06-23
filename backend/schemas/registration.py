from pydantic import BaseModel

class Registration(BaseModel):
    user_id:int
    event_id:int
    