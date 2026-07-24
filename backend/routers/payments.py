from fastapi import APIRouter, Depends,UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

import os
import shutil
from uuid import uuid4

from database.database import get_db

from models.payment import Payment
from models.registration import Registration
from models.user import User
from models.event import Event

from dependencies.auth import require_role
from dependencies.payment import get_owned_payment

from services.payment import approve_payment , reject_payment
from schemas.payment import PaymentResponse , PaymentReject

from constants.registration_status import RegistrationStatus
from constants.payment_status import PaymentStatus

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


@router.get(
    "/",
    response_model=list[PaymentResponse]
)
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(Payment).all()

@router.get(
    "/me",
    response_model=list[PaymentResponse]
)
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):

    return (
        db.query(Payment)
        .join(Registration)
        .filter(
            Registration.user_id == current_user.id
        )
        .all()
    )



@router.post(
    "/registrations/{registration_id}/payment",
    response_model=PaymentResponse
)
def upload_payment(
    registration_id: int,
    transaction_id: str | None = Form(None),
    screenshot: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):

    registration = db.query(Registration).filter(
        Registration.id == registration_id
    ).first()

    if not registration:
        raise HTTPException(
            status_code=404,
            detail="Registration not found."
        )

    if registration.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only upload payment for your own registration."
        )

    if registration.status != RegistrationStatus.PENDING.value:
        raise HTTPException(
            status_code=400,
            detail="Payment can only be uploaded for pending registrations."
        )

    existing_payment = db.query(Payment).filter(
        Payment.registration_id == registration_id
    ).first()

    if existing_payment:

        if existing_payment.status == PaymentStatus.PENDING.value:
            raise HTTPException(
                status_code=400,
                detail="Your payment is currently under review."
            )

        if existing_payment.status == PaymentStatus.APPROVED.value:
            raise HTTPException(
                status_code=400,
                detail="Payment has already been approved."
            )

        if existing_payment.status == PaymentStatus.REJECTED.value:

            try:
                if os.path.exists(existing_payment.screenshot_path):
                    os.remove(existing_payment.screenshot_path)

                db.delete(existing_payment)
                db.commit()

            except Exception:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail="Failed to replace rejected payment."
                )

    allowed_types = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ]

    if screenshot.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and PDF files are allowed."
        )

    extension = os.path.splitext(
        screenshot.filename
    )[1]

    filename = f"{uuid4()}{extension}"

    upload_dir = "uploads/payments"

    os.makedirs(
        upload_dir,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_dir,
        filename
    )

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                screenshot.file,
                buffer
            )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to save payment screenshot."
        )

    payment = Payment(
        registration_id=registration.id,
        amount=registration.event.price,
        screenshot_path=file_path,
        transaction_id=transaction_id
    )

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)

    except Exception:
        db.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Failed to save payment."
        )

    finally:
        screenshot.file.close()

    return payment

@router.post(
    "/{payment_id}/approve",
    response_model=PaymentResponse
)
def approve_payment_route(
    payment: Payment = Depends(get_owned_payment),
    current_user: User = Depends(require_role("admin", "organizer")),
    db: Session = Depends(get_db)
):
    return approve_payment(
        payment=payment,
        current_user=current_user,
        db=db
    )

@router.post(
    "/{payment_id}/reject",
    response_model=PaymentResponse
)
def reject_payment_route(
    rejection: PaymentReject,
    payment: Payment = Depends(get_owned_payment),
    current_user: User = Depends(require_role("admin", "organizer")),
    db: Session = Depends(get_db)
):
    return reject_payment(
        payment=payment,
        reason=rejection.reason,
        current_user=current_user,
        db=db
    )

@router.get(
    "/pending",
    response_model=list[PaymentResponse]
)
def get_pending_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "organizer"))
):

    if current_user.role == "admin":
        return db.query(Payment).filter(
            Payment.status == PaymentStatus.PENDING.value
        ).all()

    return (
        db.query(Payment)
        .join(Registration)
        .join(Event)
        .filter(
            Payment.status == PaymentStatus.PENDING.value,
            Event.owner_id == current_user.id
        )
        .all()
    )