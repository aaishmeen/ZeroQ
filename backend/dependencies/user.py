from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from dependencies.auth import get_current_user
from models.user import User


def get_owned_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if current_user.role == "admin":
        return user

    if current_user.id == user.id:
        return user

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access this user."
    )