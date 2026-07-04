from fastapi import APIRouter , HTTPException , Depends
from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User
from schemas.user import UserCreate , UserResponse
from auth.hashing import hash_password


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get(
        "/",
        response_model=list[UserResponse])
def get_users(db:Session=Depends(get_db)):
    return db.query(User).all()


@router.post(
        "/",
        response_model=UserResponse)
def create_user(
    user:UserCreate , 
    db:Session=Depends(get_db)
    ):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )
      
    existing_reg_no = db.query(User).filter(
        User.reg_no == user.reg_no
    ).first()

    if existing_reg_no:
        raise HTTPException(
            status_code=400,
            detail="Registration number already exists"
        )
    new_user =  User(
        name=user.name,
        email=user.email,
        reg_no=user.reg_no,
        phone=user.phone_no,
        password = hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.get(
        "/{user_id}",
          response_model= UserResponse)

def get_user(
    user_id: int,
    db: Session = Depends(get_db)
    ):

    user = db.query(User).filter(
        User.id == user_id
        ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


@router.put(
        "/{user_id}",
        response_model=UserResponse)
def update_user(
    user_id: int,
    updated_user: UserCreate,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    existing_email = db.query(User).filter(
    User.email == updated_user.email,
    User.id != user_id
     ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    existing_reg_no = db.query(User).filter(
        User.reg_no == updated_user.reg_no,
        User.id != user_id
    ).first()

    if existing_reg_no:
        raise HTTPException(
            status_code=400,
            detail="Registration number already exists"
        )

    user.name = updated_user.name
    user.email = updated_user.email
    user.reg_no = updated_user.reg_no
    user.phone = updated_user.phone_no
    user.password = hash_password(updated_user.password)

    db.commit()
    db.refresh(user)

    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }