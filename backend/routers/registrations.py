from fastapi import HTTPException,APIRouter
from schemas.registration import Registration

router = APIRouter(
    tags=["Registartions"],
    prefix ="/registrations"
)

registrations=[]
next_registration_id =1

@router.get("/")
def get_registration():
    return registrations

@router.post("/")
def create_registration(registration: Registration):
    global next_registration_id

    for existing_registration in registrations:

        if (
            existing_registration["user_id"] == registration.user_id
            and
            existing_registration["event_id"] == registration.event_id
        ):
            raise HTTPException(
                status_code=400,
                detail="User already registered for this event"
            )

    new_registration = registration.model_dump()
    new_registration["id"]=next_registration_id

    registrations.append(new_registration)

    next_registration_id+=1

    return new_registration

@router.get("/{registration_id}")
def get_registartion(registration_id:int):

    for registration in registrations:
       if registration["id"] == registration_id:
            return registration
       
    return HTTPException(
        status_code=404,
        detail="Registration not found"
    )   

@router.delete("/{registration_id}")
def delete_registration(registartion_id:int):
    
    for index , registration in enumerate(registrations):
        if registration["id"]==registartion_id:

            deleted_registration = registrations.pop(index)

            return {
                "message":"Registration deleted successfully",
                "registration": deleted_registration
            }
    raise HTTPException(
        status_code=404,
        detail="Registration not found"
    )
            

