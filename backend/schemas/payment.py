from datetime import datetime

from pydantic import BaseModel, Field, field_validator


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

class PaymentReject(BaseModel):
    reason: str = Field(
        default="Payment verification rejected",
        max_length=500
    )

    @field_validator("reason", mode="before")
    def validate_reason(cls, v):
        if not v or not str(v).strip():
            return "Payment verification rejected"
        val = str(v).strip()
        if len(val) < 3:
            return f"Payment verification rejected: {val}"
        return val 