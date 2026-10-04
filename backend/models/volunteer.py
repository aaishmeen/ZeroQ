from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, UTC
from database.database import Base


class VolunteerOpening(Base):
    __tablename__ = "volunteer_openings"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    role = Column(String, nullable=False)  # e.g., "Gate Volunteer", "Registration Desk"
    volunteers_needed = Column(Integer, nullable=False, default=1)
    description = Column(String, nullable=True)
    deadline = Column(String, nullable=True)  # e.g. "2026-09-10"
    gate_area = Column(String, nullable=True)  # Optional preferred area / gate
    status = Column(String, nullable=False, default="open")  # "open", "closed"
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    event = relationship("Event")
    creator = relationship("User", foreign_keys=[created_by])
    applications = relationship("VolunteerApplication", back_populates="opening", cascade="all, delete-orphan")


class VolunteerApplication(Base):
    __tablename__ = "volunteer_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    opening_id = Column(Integer, ForeignKey("volunteer_openings.id"), nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending, approved, rejected
    experience = Column(String, nullable=True)  # Optional prior experience / bio
    applied_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    event = relationship("Event")
    opening = relationship("VolunteerOpening", back_populates="applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class VolunteerAssignment(Base):
    __tablename__ = "volunteer_assignments"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    position = Column(String, nullable=False)  # e.g., "Gate 1", "Help Desk"
    status = Column(String, nullable=False, default="active")  # active, unassigned
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    volunteer = relationship("User", foreign_keys=[volunteer_id])
    event = relationship("Event")
    assigner = relationship("User", foreign_keys=[assigned_by])
