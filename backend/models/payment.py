from sqlalchemy import Column , Integer ,String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime , UTC

from database.database import Base
from constants.payment_status import PaymentStatus

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True , index =  True)

    registration_id = Column(
        Integer,
        ForeignKey("registrations.id"),
        nullable=False,
        unique=True
    )

    amount = Column(
        Float,
        nullable=False
    )

    screenshot_path = Column(
        String,
        nullable=False
    )

    transaction_id = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        nullable=False,
        default=PaymentStatus.PENDING.value
    )

    rejection_reason = Column(
        String,
        nullable=True
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    uploaded_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        nullable=False
    )

    reviewed_at = Column(
        DateTime,
        nullable=True
    )

    registration = relationship(
        "Registration",
        back_populates="payment"
    )

    reviewer = relationship(
        "User"
    )