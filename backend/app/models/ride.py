
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)

    rider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    pickup_location = Column(String(255), nullable=False)
    drop_location = Column(String(255), nullable=False)

    pickup_latitude = Column(Float, nullable=False)
    pickup_longitude = Column(Float, nullable=False)

    drop_latitude = Column(Float, nullable=False)
    drop_longitude = Column(Float, nullable=False)

    status = Column(String(20), default="requested", nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    estimated_distance_km = Column(Float, nullable=False)
    estimated_fare = Column(Float, nullable=False)
        # Live driver location
    driver_latitude = Column(Float, nullable=True)
    driver_longitude = Column(Float, nullable=True)
    driver_location_updated_at = Column(
        DateTime(timezone=True),
        nullable=True
    )