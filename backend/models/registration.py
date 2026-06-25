from sqlalchemy import Column, Integer
from database.database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    event_id = Column(Integer, nullable=False)