from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from passlib.exc import UnknownHashError

from database.database import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse, Token, UserBioUpdate, UserPasswordChange, UserProfileUpdate
from auth.hashing import hash_password, verify_password
from auth.jwt_handler import create_access_token
from dependencies.user import get_owned_user
from dependencies.auth import require_role, get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/",
    response_model=list[UserResponse]
)
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(User).all()


@router.post(
    "/",
    response_model=UserResponse
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    clean_email = user.email.strip().lower() if user.email else ""

    existing_user = db.query(User).filter(
        func.lower(func.trim(User.email)) == clean_email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    if user.reg_no:
        clean_reg_no = user.reg_no.strip()
        existing_reg_no = db.query(User).filter(
            func.lower(func.trim(User.reg_no)) == clean_reg_no.lower()
        ).first()

        if existing_reg_no:
            raise HTTPException(
                status_code=400,
                detail="Registration number already exists"
            )

    hashed_password = hash_password(user.password)
    initial_status = "pending" if user.role == "admin" else "approved"

    new_user = User(
        name=user.name.strip() if user.name else "",
        email=clean_email,
        reg_no=user.reg_no.strip() if user.reg_no else None,
        phone=user.phone_no.strip() if user.phone_no else "",
        password=hashed_password,
        role=user.role or "student",
        status=initial_status
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.patch("/{user_id}/approve-admin", response_model=UserResponse)
def approve_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("superadmin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "admin":
        raise HTTPException(status_code=400, detail="User is not an administrator applicant")
    user.status = "approved"
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/reject-admin", response_model=UserResponse)
def reject_admin_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("superadmin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "admin":
        raise HTTPException(status_code=400, detail="User is not an administrator applicant")
    user.status = "rejected"
    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/login",
    response_model=Token
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    clean_username = form_data.username.strip().lower() if form_data.username else ""

    existing_user = db.query(User).filter(
        func.lower(func.trim(User.email)) == clean_username
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        password_valid = verify_password(
            form_data.password,
            existing_user.password
        )
    except Exception:
        password_valid = False

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


from models import User, VolunteerApplication, VolunteerAssignment

def _build_user_response(user: User, db: Session) -> UserResponse:
    from models import VolunteerApplication, VolunteerAssignment
    approved_app = db.query(VolunteerApplication).filter(
        VolunteerApplication.user_id == user.id,
        VolunteerApplication.status == "approved"
    ).first()

    approved_assign = None
    if not approved_app:
        approved_assign = db.query(VolunteerAssignment).filter(
            VolunteerAssignment.volunteer_id == user.id,
            VolunteerAssignment.status == "active"
        ).first()

    is_vol = bool(approved_app or approved_assign or user.role in ["volunteer", "admin", "superadmin"])
    res = UserResponse.model_validate(user)
    res.is_approved_volunteer = is_vol
    return res


@router.get(
    "/me",
    response_model=UserResponse
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.volunteer_id:
        current_user.volunteer_id = f"ZQ-VOL-{current_user.id:06d}"
        db.commit()
        db.refresh(current_user)

    return _build_user_response(current_user, db)


@router.post("/me/avatar", response_model=UserResponse)
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from services.cloudinary_service import (
        validate_and_read_image,
        upload_image_to_cloudinary,
        delete_cloudinary_image
    )

    file_bytes = validate_and_read_image(file, max_size_mb=5.0)
    upload_res = upload_image_to_cloudinary(file_bytes, folder="zeroq/profiles")

    new_secure_url = upload_res["secure_url"]
    new_public_id = upload_res["public_id"]
    old_public_id = current_user.avatar_public_id

    current_user.avatar_url = new_secure_url
    current_user.avatar_public_id = new_public_id

    try:
        db.commit()
        db.refresh(current_user)
    except Exception:
        db.rollback()
        delete_cloudinary_image(new_public_id)
        raise HTTPException(
            status_code=500,
            detail="Database failed to update avatar. Cloudinary upload reverted."
        )

    if old_public_id:
        delete_cloudinary_image(old_public_id)

    return _build_user_response(current_user, db)


@router.delete("/me/avatar", response_model=UserResponse)
def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import os
    from services.cloudinary_service import delete_cloudinary_image

    old_public_id = current_user.avatar_public_id
    old_avatar_url = current_user.avatar_url

    current_user.avatar_url = None
    current_user.avatar_public_id = None
    db.commit()
    db.refresh(current_user)

    if old_public_id:
        delete_cloudinary_image(old_public_id)
    elif old_avatar_url and old_avatar_url.startswith("/uploads/"):
        relative_path = old_avatar_url.lstrip("/")
        if os.path.exists(relative_path):
            try:
                os.remove(relative_path)
            except Exception:
                pass

    return _build_user_response(current_user, db)


@router.put("/me/bio", response_model=UserResponse)
def update_user_bio(
    payload: UserBioUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.bio = payload.bio
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password", response_model=UserResponse)
def change_password(
    payload: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if not verify_password(payload.current_password, current_user.password):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
    except UnknownHashError:
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.password = hash_password(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/profile", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.name:
        current_user.name = payload.name.strip()
    if payload.phone:
        current_user.phone = payload.phone.strip()
    if payload.bio is not None:
        current_user.bio = payload.bio.strip() if payload.bio else None

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user: User = Depends(get_owned_user)
):

    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    updated_user: UserCreate,
    user: User = Depends(get_owned_user),
    db: Session = Depends(get_db)
):

    clean_email = updated_user.email.strip().lower() if updated_user.email else ""

    existing_email = db.query(User).filter(
        func.lower(func.trim(User.email)) == clean_email,
        User.id != user.id
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    if updated_user.reg_no:
        clean_reg_no = updated_user.reg_no.strip()
        existing_reg_no = db.query(User).filter(
            func.lower(func.trim(User.reg_no)) == clean_reg_no.lower(),
            User.id != user.id
        ).first()

        if existing_reg_no:
            raise HTTPException(
                status_code=400,
                detail="Registration number already exists"
            )

    user.name = updated_user.name.strip() if updated_user.name else ""
    user.email = clean_email
    user.reg_no = updated_user.reg_no.strip() if updated_user.reg_no else None
    user.phone = updated_user.phone_no.strip() if updated_user.phone_no else ""
    user.password = hash_password(updated_user.password)

    db.commit()
    db.refresh(user)

    return user


@router.delete(
    "/{user_id}"
)
def delete_user(
    user: User = Depends(get_owned_user),
    db: Session = Depends(get_db)
):

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }