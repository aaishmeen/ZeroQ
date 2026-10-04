from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
from database.database import Base


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    position = Column(String, nullable=False)
    category = Column(String, nullable=False)  # QR Issue, Payment Issue, Registration Issue, Attendee Information, Ticket Issue, Other
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=True)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False, default="OPEN")  # OPEN, IN_REVIEW, RESOLVED, CLOSED
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    event = relationship("Event")
    volunteer = relationship("User", foreign_keys=[volunteer_id])
    registration = relationship("Registration")
    resolver = relationship("User", foreign_keys=[resolved_by])
