from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    reg_no: str = Field(min_length=5, max_length=20)
    phone_no: str = Field(pattern=r"^\d{10}$")
    password: str = Field(min_length=8)

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    reg_no: str
    phone: str

    model_config = {
        "from_attributes": True
    }    

class UserLogin(BaseModel):
    email:EmailStr
    password: str    

class Token(BaseModel):
    access_token: str
    token_type: str    