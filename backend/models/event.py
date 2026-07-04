from sqlalchemy import Column , Integer , String , Float , Date
from sqlalchemy.orm import relationship
from database.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer , primary_key=True,index=True)
    title = Column(String , nullable=False)
    description = Column(String , nullable=False)
    venue = Column(String, nullable=False)

    date = Column(Date , nullable=False)

    capacity =  Column(Integer, nullable=False)
    price = Column(Float , nullable=False)

    registrations = relationship(
        "Registration",
        back_populates="event"
    )
