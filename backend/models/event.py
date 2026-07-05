from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base
from constants.event_status import EventStatus


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    venue = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    capacity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    status = Column(
        String,
        nullable=False,
        default=EventStatus.DRAFT.value
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    owner = relationship(
        "User",
        back_populates="events"
    )

    registrations = relationship(
        "Registration",
        back_populates="event"
    )