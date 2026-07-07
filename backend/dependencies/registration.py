from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from dependencies.auth import get_current_user
from models.registration import Registration
from models.user import User


def get_owned_registration(
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    registration = db.query(Registration).filter(
        Registration.id == registration_id
    ).first()

    if not registration:
        raise HTTPException(
            status_code=404,
            detail="Registration not found."
        )

    if current_user.role == "admin":
        return registration

    if (
        current_user.role == "student"
        and registration.user_id == current_user.id
    ):
        return registration

    if (
        current_user.role == "organizer"
        and registration.event.owner_id == current_user.id
    ):
        return registration

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this registration."
    )