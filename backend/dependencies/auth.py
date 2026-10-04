from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User
from auth.jwt_handler import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/users/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    email = payload.get("sub")

    if email is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    clean_email = email.strip().lower()

    user = db.query(User).filter(
        func.lower(func.trim(User.email)) == clean_email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user

oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/users/login",
    auto_error=False
)

def get_optional_current_user(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> User | None:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload or not payload.get("sub"):
            return None
        clean_email = payload.get("sub").strip().lower()
        return db.query(User).filter(func.lower(func.trim(User.email)) == clean_email).first()
    except Exception:
        return None

def require_role(*roles: str):
    def role_checker(
        current_user: User = Depends(get_current_user)
    ):
        user_role = current_user.role
        allowed = user_role in roles
        if not allowed and "admin" in roles and user_role == "superadmin":
            allowed = True

        if not allowed:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action."
            )

        # Enforce status check only for users whose primary role is "admin"
        if user_role == "admin":
            user_status = getattr(current_user, "status", "approved") or "approved"
            if user_status != "approved":
                raise HTTPException(
                    status_code=403,
                    detail=f"Admin account status is '{user_status}'. Pending superadmin approval."
                )

        return current_user

    return role_checker

def require_volunteer_access(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role in ["volunteer", "admin", "superadmin", "organizer"]:
        return current_user

    from models import VolunteerApplication, VolunteerAssignment
    approved_app = db.query(VolunteerApplication).filter(
        VolunteerApplication.user_id == current_user.id,
        VolunteerApplication.status == "approved"
    ).first()
    if approved_app:
        return current_user

    approved_assign = db.query(VolunteerAssignment).filter(
        VolunteerAssignment.volunteer_id == current_user.id,
        VolunteerAssignment.status == "active"
    ).first()
    if approved_assign:
        return current_user

    raise HTTPException(
        status_code=403,
        detail="Volunteer Portal access is restricted to approved volunteers only."
    )