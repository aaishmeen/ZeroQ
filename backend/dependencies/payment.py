from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from dependencies.auth import get_current_user
from models.payment import Payment
from models.user import User


def get_owned_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found."
        )

    if current_user.role == "admin":
        return payment

    if (
        current_user.role == "organizer"
        and payment.registration.event.owner_id == current_user.id
    ):
        return payment

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this payment."
    )