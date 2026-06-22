from pydantic import BaseModel

class User(BaseModel):
    name:str
    email:str
    reg_no:str
    phone_no: str
    password:str
    