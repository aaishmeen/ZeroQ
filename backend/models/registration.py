from sqlalchemy import Column, Integer, ForeignKey, String
from constants.registration_status import RegistrationStatus
from sqlalchemy.orm import relationship
from database.database import Base


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, 
        ForeignKey("users.id"),
        nullable=False
        )
    
    event_id = Column(
        Integer,
        ForeignKey("events.id"),
        nullable=False
        )
    
    user = relationship(
        "User",
        back_populates="registrations"
    )

    event = relationship(
        "Event",
        back_populates="registrations"
    )

    payment = relationship(
    "Payment",
    back_populates="registration",
    uselist=False
    )

    status = Column(
    String,
    nullable=False,
    default=RegistrationStatus.PENDING.value
    )