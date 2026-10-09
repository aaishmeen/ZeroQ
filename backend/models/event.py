from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from database.database import Base
from constants.event_status import EventStatus


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        UniqueConstraint("title", "venue", "date", name="uq_event_title_venue_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    venue = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    capacity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    volunteers_limit = Column(Integer, nullable=False, default=10)
    accepting_volunteers = Column(Boolean, nullable=False, default=True)
    
    status = Column(
        String,
        nullable=False,
        default=EventStatus.DRAFT.value
    )

    rejection_reason = Column(
    String,
    nullable=True
    )

    banner_url = Column(
        String,
        nullable=True
    )

    banner_public_id = Column(
        String,
        nullable=True
    )

    payment_qr_url = Column(
        String,
        nullable=True
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