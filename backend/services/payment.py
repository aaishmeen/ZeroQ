from datetime import datetime, UTC

from fastapi import HTTPException
from sqlalchemy.orm import Session

from constants.payment_status import PaymentStatus
from constants.registration_status import RegistrationStatus
from models.payment import Payment
from models.user import User


def approve_payment(
    payment: Payment,
    current_user: User,
    db: Session
):

    if payment.status != PaymentStatus.PENDING.value:
        raise HTTPException(
            status_code=400,
            detail="Payment has already been reviewed."
        )

    payment.status = PaymentStatus.APPROVED.value
    payment.reviewed_by = current_user.id
    payment.reviewed_at = datetime.now(UTC)

    payment.registration.status = RegistrationStatus.APPROVED.value

    try:
        db.commit()
        db.refresh(payment)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to approve payment."
        )

    return payment

def reject_payment(
    payment: Payment,
    reason: str,
    current_user: User,
    db: Session
):

    if payment.status != PaymentStatus.PENDING.value:
        raise HTTPException(
            status_code=400,
            detail="Payment has already been reviewed."
        )

    payment.status = PaymentStatus.REJECTED.value
    payment.rejection_reason = reason
    payment.reviewed_by = current_user.id
    payment.reviewed_at = datetime.now(UTC)

    try:
        db.commit()
        db.refresh(payment)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to reject payment."
        )

    return payment