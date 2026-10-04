from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    reg_no = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")
    status = Column(String, nullable=False, default="approved")
    volunteer_id = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)


    registrations = relationship(
        "Registration",
        back_populates="user"
    )

    events = relationship(
    "Event",
    back_populates="owner"
    )