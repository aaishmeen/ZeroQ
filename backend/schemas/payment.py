from datetime import datetime

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    amount: float = Field(gt=0)
    transaction_id: str | None = None


class PaymentResponse(BaseModel):
    id: int
    registration_id: int
    amount: float
    screenshot_path: str
    transaction_id: str | None
    status: str
    rejection_reason: str | None
    reviewed_by: int | None
    uploaded_at: datetime
    reviewed_at: datetime | None

    model_config = {
        "from_attributes": True
    }