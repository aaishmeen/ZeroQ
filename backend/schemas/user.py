from pydantic import BaseModel , EmailStr

class UserCreate(BaseModel):
    name:str
    email:EmailStr
    reg_no:str
    phone_no: str
    password:str
    