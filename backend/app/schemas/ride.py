
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class RideCreate(BaseModel):
    pickup_location: str = Field(min_length=2, max_length=255)
    drop_location: str = Field(min_length=2, max_length=255)

    pickup_latitude: float = Field(ge=-90, le=90)
    pickup_longitude: float = Field(ge=-180, le=180)

    drop_latitude: float = Field(ge=-90, le=90)
    drop_longitude: float = Field(ge=-180, le=180)


class RideResponse(BaseModel):
    id: int
    rider_id: int
    driver_id: Optional[int] = None
    driver_vehicle_number: Optional[str] = None
    driver_address_proof_status: Optional[str] = None

    pickup_location: str
    drop_location: str

    pickup_latitude: float
    pickup_longitude: float
    drop_latitude: float
    drop_longitude: float
        # Driver live location
    driver_latitude: Optional[float] = None
    driver_longitude: Optional[float] = None
    driver_location_updated_at: Optional[datetime] = None

    status: str
    created_at: datetime
    estimated_distance_km: float
    estimated_fare: float

    model_config = ConfigDict(from_attributes=True)
