from sqlalchemy.orm import Session
from models.user import User

def ensure_volunteer_id(user: User, db: Session) -> str:
    """
    Ensures a unique, non-editable, backend-generated Volunteer ID
    in the format ZQ-VOL-XXXXXX permanently associated with the user account.
    """
    if not user.volunteer_id:
        user.volunteer_id = f"ZQ-VOL-{user.id:06d}"
        db.commit()
        db.refresh(user)
    return user.volunteer_id
