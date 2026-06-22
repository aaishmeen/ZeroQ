from fastapi import APIRouter , HTTPException
from schemas.event import Events

router = APIRouter (
    prefix ="/events",
    tags=["Events"]
)

events =[]

@router.get("/")
def get_events():
    return events

@router.post("/")
def create_event(event: Events):
    events.append(event)
    return event

@router.get("/{event_id}")
def get_event(event_id:int):
    if event_id> len(events):
        return HTTPException(status_code=404,detail="Event not found")
    
    return events[event_id]

@router.put("/{event_id}")
def update_event(event_id:int,updated_event=Events):
    if event_id> len(events):
        return HTTPException(status_code=404,detail="Event not found")
    
    events[event_id]=update_event
    return update_event

@router.delete("/{event_id}")
def delete_event(event_id:int):
    
    if event_id >= len(events):
        raise HTTPException(status_code=404, detail="Event not found")
    
      
    deleted_event=events.pop(event_id)
    
    return{
        "message": "Event deleted successfully",
        "event": deleted_event}