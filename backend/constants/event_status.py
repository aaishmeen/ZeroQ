from enum import Enum


class EventStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    UPCOMING = "upcoming"
    ACTIVE = "active"
    REJECTED = "rejected"
    COMPLETED = "completed"
    ARCHIVED = "archived"