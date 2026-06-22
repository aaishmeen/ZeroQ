from fastapi import APIRouter , HTTPException
from schemas.event import Events

router = APIRouter (
    prefix ="/events",
    tags=["Events"]
)

events =[]
next_event_id =1

@router.get("/")
def get_events():
    return events

@router.post("/")
def create_event(event: Events):
    global next_event_id

    new_event =  event.model_dump()
    new_event["id"]= next_event_id

    events.append(new_event)
    next_event_id+=1

    return new_event

@router.get("/{event_id}")
def get_event(event_id:int):

    for event in events:
        if event["id"]==event_id:
            return event
        
    raise HTTPException(
        status_code=404,
        detail="Event not found"
    )

@router.put("/{event_id}")
def update_event(event_id:int,updated_event:Events):
    
    for event in events:
        if event["id"] == event_id:

            updated_data = updated_event.model_dump()
            updated_data["id"] = event_id

            event.update(updated_data)

            return event

    raise HTTPException(
        status_code=404,detail="Event not found"
        )

@router.delete("/{event_id}")
def delete_event(event_id:int):
    
    for event in events:
        if event["id"] == event_id:

            events.remove(event)

            return {
                "message": "Event deleted successfully"
            }

    raise HTTPException(
        status_code=404,
        detail="Event not found"
    )