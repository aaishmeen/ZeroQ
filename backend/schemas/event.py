from pydantic import BaseModel

class Events(BaseModel):
    title:str
    description:str
    venue:str
    date:str
    capacity:int
    price:float
