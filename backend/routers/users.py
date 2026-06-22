from fastapi import APIRouter , HTTPException
from schemas.user import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

users = []
next_user_id=1

@router.get("/")
def get_users():
    return users

@router.post("/")
def create_user(user:User):
    global next_user_id

    new_user= user.model_dump()
    new_user["id"] =  next_user_id

    users.append(new_user)
    next_user_id+=1

    return new_user

@router.get("/{user_id}")
def get_user(user_id: int):

    for user in users:
        if user["id"] == user_id:
            return user

    raise HTTPException(
        status_code=404,
        detail="User not found"
    )


@router.put("/{user_id}")
def update_user(user_id: int, updated_user: User):

    for user in users:
        if user["id"] == user_id:

            updated_data = updated_user.model_dump()
            updated_data["id"] = user_id

            user.update(updated_data)

            return user

    raise HTTPException(
        status_code=404,
        detail="User not found"
    )


@router.delete("/{user_id}")
def delete_user(user_id: int):

    for index , user in enumerate(users):
        if user["id"] == user_id:

            deleted_user = users.pop(index)

            return {
                "message": "User deleted successfully",
                "user": deleted_user
            }

    raise HTTPException(
        status_code=404,
        detail="User not found"
    )