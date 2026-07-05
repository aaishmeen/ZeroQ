from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
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

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user