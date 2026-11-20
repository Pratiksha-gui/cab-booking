
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    field_validator,
    model_validator,
)
from typing import Optional, Literal


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    age: Optional[int] = None
    vehicle_number: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    is_active: bool
    age: Optional[int] = None
    vehicle_number: Optional[str] = None
    address_proof_status: Optional[str] = None
    address_proof_rejection_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    age: Optional[int] = None
    vehicle_number: Optional[str] = None


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: Literal["rider", "driver"]
    age: Optional[int] = None
    password: str
    vehicle_number: Optional[str] = None

    @field_validator("vehicle_number")
    @classmethod
    def normalize_vehicle_number(cls, value):
        if value is not None:
            value = value.strip().upper()
            if not value:
                return None
        return value

    @model_validator(mode="after")
    def validate_driver_vehicle(self):
        if self.role == "driver" and not self.vehicle_number:
            raise ValueError("Vehicle number is required for drivers")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class DriverProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    vehicle_number: Optional[str] = None

    @field_validator("vehicle_number")
    @classmethod
    def normalize_vehicle_number(cls, value):
        if value is not None:
            value = value.strip().upper()

            if not value:
                return None

        return value

class AddressProofReview(BaseModel):
    status: Literal["verified", "rejected"]
    rejection_reason: Optional[str] = None

    @model_validator(mode="after")
    def validate_rejection_reason(self):
        if self.status == "rejected":
            if not self.rejection_reason or not self.rejection_reason.strip():
                raise ValueError("Rejection reason is required")

        if self.status == "verified":
            self.rejection_reason = None

        return self
