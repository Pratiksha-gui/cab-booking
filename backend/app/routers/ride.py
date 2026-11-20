import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.utils.distance import calculate_distance_km
from app.database import get_db
from app.models.ride import Ride
from app.models.user import User
from app.schemas.ride import RideCreate, RideResponse
from app.core.dependencies import role_required, get_current_user
from app.core.fare import calculate_fare
router = APIRouter(
    prefix="/rides",
    tags=["Rides"]
)



@router.post("/", response_model=RideResponse, status_code=status.HTTP_201_CREATED)
def create_ride(
    ride_data: RideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("rider"))
):
    # Validate coordinates
    coordinates = [
        ride_data.pickup_latitude,
        ride_data.pickup_longitude,
        ride_data.drop_latitude,
        ride_data.drop_longitude,
    ]

    if not all(math.isfinite(value) for value in coordinates):
        raise HTTPException(
            status_code=400,
            detail="Coordinates must be valid numbers."
        )

    if not (
        -90 <= ride_data.pickup_latitude <= 90
        and -90 <= ride_data.drop_latitude <= 90
        and -180 <= ride_data.pickup_longitude <= 180
        and -180 <= ride_data.drop_longitude <= 180
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid latitude or longitude."
        )

    # Calculate actual distance
    distance = calculate_distance_km(
        ride_data.pickup_latitude,
        ride_data.pickup_longitude,
        ride_data.drop_latitude,
        ride_data.drop_longitude
    )

    # Calculate fare
    fare = calculate_fare(distance)

    # Create ride
    new_ride = Ride(
        rider_id=current_user.id,
        pickup_location=ride_data.pickup_location,
        drop_location=ride_data.drop_location,
        pickup_latitude=ride_data.pickup_latitude,
        pickup_longitude=ride_data.pickup_longitude,
        drop_latitude=ride_data.drop_latitude,
        drop_longitude=ride_data.drop_longitude,
        estimated_distance_km=distance,
        estimated_fare=fare,
        status="requested"
    )

    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)

    return new_ride


@router.get("/available", response_model=List[RideResponse])
def get_available_rides(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("driver"))
):
    return db.query(Ride).filter(
        Ride.status == "requested",
        Ride.driver_id.is_(None)
    ).order_by(
        Ride.created_at.desc()
    ).all()


@router.get("/{ride_id}", response_model=RideResponse)
def get_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ride = db.query(Ride).filter(
        Ride.id == ride_id
    ).first()

    if not ride:
        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )

    if current_user.id != ride.rider_id and current_user.id != ride.driver_id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this ride"
        )

    return ride


@router.post("/{ride_id}/accept", response_model=RideResponse)
def accept_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("driver"))
):
    updated = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.status == "requested",
        Ride.driver_id.is_(None)
    ).update(
        {
            "driver_id": current_user.id,
            "status": "accepted"
        },
        synchronize_session=False
    )

    if updated == 0:
        db.rollback()

        ride = db.query(Ride).filter(
            Ride.id == ride_id
        ).first()

        if not ride:
            raise HTTPException(
                status_code=404,
                detail="Ride not found"
            )

        raise HTTPException(
            status_code=409,
            detail="Ride is no longer available"
        )

    db.commit()

    ride = db.query(Ride).filter(
        Ride.id == ride_id
    ).first()

    return ride


@router.post("/{ride_id}/start", response_model=RideResponse)
def start_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("driver"))
):

    active_ride = db.query(Ride).filter(
        Ride.driver_id == current_user.id,
        Ride.status == "started",
        Ride.id != ride_id
    ).first()

    if active_ride:
        raise HTTPException(
            status_code=409,
            detail="You already have an active ride. Complete it before starting another ride."
        )
    updated = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.driver_id == current_user.id,
        Ride.status == "accepted"
    ).update(
        {"status": "started"},
        synchronize_session=False
    )

    if updated == 0:
        db.rollback()

        ride = db.query(Ride).filter(
            Ride.id == ride_id
        ).first()

        if not ride:
            raise HTTPException(
                status_code=404,
                detail="Ride not found"
            )

        raise HTTPException(
            status_code=409,
            detail="Ride cannot be started"
        )

    db.commit()

    ride = db.query(Ride).filter(
        Ride.id == ride_id
    ).first()

    return ride


@router.post("/{ride_id}/location")
def update_driver_location(
    ride_id: int,
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("driver"))
):
    ride = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.driver_id == current_user.id,
        Ride.status == "started"
    ).first()

    if not ride:
        raise HTTPException(
            status_code=404,
            detail="Active ride not found or access denied"
        )

    if not (-90 <= latitude <= 90):
        raise HTTPException(
            status_code=422,
            detail="Invalid latitude"
        )

    if not (-180 <= longitude <= 180):
        raise HTTPException(
            status_code=422,
            detail="Invalid longitude"
        )

    ride.driver_latitude = latitude
    ride.driver_longitude = longitude
    ride.driver_location_updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ride)

    return {
        "message": "Driver location updated successfully",
        "latitude": ride.driver_latitude,
        "longitude": ride.driver_longitude,
        "updated_at": ride.driver_location_updated_at
    }

@router.post("/{ride_id}/complete", response_model=RideResponse)
def complete_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("driver"))
):
    updated = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.driver_id == current_user.id,
        Ride.status == "started"
    ).update(
        {"status": "completed"},
        synchronize_session=False
    )

    if updated == 0:
        db.rollback()

        ride = db.query(Ride).filter(
            Ride.id == ride_id
        ).first()

        if not ride:
            raise HTTPException(
                status_code=404,
                detail="Ride not found"
            )

        raise HTTPException(
            status_code=409,
            detail="Ride cannot be completed"
        )

    db.commit()

    ride = db.query(Ride).filter(
        Ride.id == ride_id
    ).first()

    return ride



@router.get("/", response_model=List[RideResponse])
def get_my_rides(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Ride)

    if current_user.role == "rider":
        query = query.filter(
            Ride.rider_id == current_user.id
        )

    elif current_user.role == "driver":
        query = query.filter(
            Ride.driver_id == current_user.id
        )

    rides = query.order_by(
        Ride.created_at.desc()
    ).all()

    results = []

    for ride in rides:
        driver = None

        if ride.driver_id is not None:
            driver = db.query(User).filter(
                User.id == ride.driver_id
            ).first()

        ride_data = {
            "id": ride.id,
            "rider_id": ride.rider_id,
            "driver_id": ride.driver_id,
            "driver_vehicle_number": (
                driver.vehicle_number if driver else None
            ),
            "driver_address_proof_status": (
                driver.address_proof_status if driver else None
        ),
            "pickup_location": ride.pickup_location,
            "drop_location": ride.drop_location,
            "pickup_latitude": ride.pickup_latitude,
            "pickup_longitude": ride.pickup_longitude,
            "drop_latitude": ride.drop_latitude,
            "drop_longitude": ride.drop_longitude,
               # Driver live location
            "driver_latitude": ride.driver_latitude,
            "driver_longitude": ride.driver_longitude,
            "driver_location_updated_at": ride.driver_location_updated_at,
            "status": ride.status,
            "created_at": ride.created_at,
            "estimated_distance_km": ride.estimated_distance_km,
            "estimated_fare": ride.estimated_fare

        }

        results.append(ride_data)

    return results


@router.get("/admin/all", response_model=List[RideResponse])
def get_all_rides_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    rides = db.query(Ride).order_by(
        Ride.created_at.desc()
    ).all()

    results = []

    for ride in rides:
        driver = None

        if ride.driver_id is not None:
            driver = db.query(User).filter(
                User.id == ride.driver_id
            ).first()

        ride_data = {
            "id": ride.id,
            "rider_id": ride.rider_id,
            "driver_id": ride.driver_id,
            "driver_vehicle_number": (
                driver.vehicle_number if driver else None
            ),
            "driver_address_proof_status": (
                driver.address_proof_status if driver else None
            ),
            "pickup_location": ride.pickup_location,
            "drop_location": ride.drop_location,
            "pickup_latitude": ride.pickup_latitude,
            "pickup_longitude": ride.pickup_longitude,
            "drop_latitude": ride.drop_latitude,
            "drop_longitude": ride.drop_longitude,
            "status": ride.status,
            "created_at": ride.created_at,
            "estimated_distance_km": ride.estimated_distance_km,
            "estimated_fare": ride.estimated_fare
        }

        results.append(ride_data)

    return results
