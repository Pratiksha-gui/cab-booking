from fastapi import (APIRouter, Depends, HTTPException, status,UploadFile,File)
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ride import Ride
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.user import User
from app.schemas.user import (UserCreate, UserResponse, UserUpdate, DriverProfileUpdate, AddressProofReview, UserStatusUpdate)
from app.core.dependencies import get_current_user, role_required   
from pathlib import Path
from uuid import uuid4
from fastapi.responses import FileResponse
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/admin/drivers",
    response_model=list[UserResponse]
)
def get_all_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    drivers = db.query(User).filter(
        User.role == "driver"
    ).all()

    return drivers

@router.get(
    "/admin/all",
    response_model=list[UserResponse]
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    users = db.query(User).filter(
        User.role.in_(["rider", "driver"])
    ).order_by(User.id.desc()).all()

    return users


@router.patch("/admin/{user_id}/status")
def update_user_status(
    user_id: int,
    user_status: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    user = db.query(User).filter(
        User.id == user_id,
        User.role.in_(["rider", "driver"])
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = user_status.is_active

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update user status"
        )

    return {
        "message": "User account status updated successfully",
        "user_id": user.id,
        "is_active": user.is_active
    }

@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required("admin"))):

    # Check whether email already exists
    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Check whether phone already exists
    if user.phone:
        existing_phone = db.query(User).filter(
            User.phone == user.phone
        ).first()

        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number already registered"
            )

    # Create user
    db_user = User(**user.model_dump())

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or phone number already registered"
        )

    return db_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),current_user: User = Depends(role_required("admin"))
):
    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    update_data = user_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)

    return db_user

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # First check whether user exists
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Then check authorization
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this user"
        )

    return user



@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(role_required("admin"))):

    db_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(db_user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }



@router.get("/me/profile", response_model=UserResponse)
def get_driver_profile(
    current_user: User = Depends(role_required("driver"))
):
    return current_user


@router.put("/me/profile", response_model=UserResponse)
def update_driver_profile(
    profile_data: DriverProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("driver"))
):
    update_data = profile_data.model_dump(exclude_unset=True)

    # Check duplicate email
    if "email" in update_data:
        existing_email = db.query(User).filter(
            User.email == update_data["email"],
            User.id != current_user.id
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=409,
                detail="Email already registered"
            )

    # Check duplicate phone
    if update_data.get("phone"):
        existing_phone = db.query(User).filter(
            User.phone == update_data["phone"],
            User.id != current_user.id
        ).first()

        if existing_phone:
            raise HTTPException(
                status_code=409,
                detail="Phone number already registered"
            )

    # Check duplicate vehicle number
    if update_data.get("vehicle_number"):
        existing_vehicle = db.query(User).filter(
            User.vehicle_number == update_data["vehicle_number"],
            User.id != current_user.id
        ).first()

        if existing_vehicle:
            raise HTTPException(
                status_code=409,
                detail="Vehicle number already registered"
            )

    for key, value in update_data.items():
        setattr(current_user, key, value)

    try:
        db.commit()
        db.refresh(current_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email, phone or vehicle number already registered"
        )

    return current_user

@router.post("/me/address-proof")
async def upload_address_proof(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("driver"))
):
    allowed_extensions = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png"
    }

    extension = Path(file.filename or "").suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, JPG and PNG files are allowed"
        )

    content = await file.read(5 * 1024 * 1024 + 1)

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 5 MB"
        )

    valid_file = (
        (extension == ".pdf" and content.startswith(b"%PDF-"))
        or (
            extension in [".jpg", ".jpeg"]
            and content.startswith(b"\xff\xd8\xff")
        )
        or (
            extension == ".png"
            and content.startswith(b"\x89PNG\r\n\x1a\n")
        )
    )

    if not valid_file:
        raise HTTPException(
            status_code=400,
            detail="File content does not match its extension"
        )

    upload_dir = (
        Path(__file__).resolve().parents[2]
        / "private_uploads"
        / "address_proofs"
    )

    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{extension}"
    file_path = upload_dir / filename

    try:
        file_path.write_bytes(content)

        current_user.address_proof_document = filename
        current_user.address_proof_status = "pending"

        db.commit()
        db.refresh(current_user)

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Failed to upload address proof"
        )

    return {
        "message": "Address proof uploaded successfully",
        "address_proof_status": current_user.address_proof_status
    }

@router.get("/admin/drivers/{driver_id}/address-proof")
def view_driver_address_proof(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    driver = db.query(User).filter(
        User.id == driver_id,
        User.role == "driver"
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if not driver.address_proof_document:
        raise HTTPException(
            status_code=404,
            detail="Address proof has not been uploaded"
        )

    upload_dir = (
        Path(__file__).resolve().parents[2]
        / "private_uploads"
        / "address_proofs"
    )

    file_path = upload_dir / driver.address_proof_document

    if not file_path.is_file() or file_path.parent != upload_dir:
        raise HTTPException(
            status_code=404,
            detail="Address proof document not found"
        )

    media_types = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png"
    }

    media_type = media_types.get(file_path.suffix.lower())

    if not media_type:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document format"
        )

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name
    )

@router.put("/admin/drivers/{driver_id}/address-proof/review")
def review_driver_address_proof(
    driver_id: int,
    review: AddressProofReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    driver = db.query(User).filter(
        User.id == driver_id,
        User.role == "driver"
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if not driver.address_proof_document:
        raise HTTPException(
            status_code=400,
            detail="Driver has not uploaded address proof"
        )

    driver.address_proof_status = review.status
    driver.address_proof_rejection_reason = (
    review.rejection_reason.strip()
    if review.status == "rejected"
    else None
)

    try:
        db.commit()
        db.refresh(driver)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update address proof status"
        )

    return {
        "message": f"Address proof {review.status} successfully",
        "driver_id": driver.id,
        "address_proof_status": driver.address_proof_status,
        "rejection_reason": driver.address_proof_rejection_reason
    }


@router.get("/admin/statistics")
def get_admin_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    total_riders = db.query(User).filter(
        User.role == "rider"
    ).count()

    total_drivers = db.query(User).filter(
        User.role == "driver"
    ).count()

    active_users = db.query(User).filter(
        User.role.in_(["rider", "driver"]),
        User.is_active == True
    ).count()

    deactivated_users = db.query(User).filter(
        User.role.in_(["rider", "driver"]),
        User.is_active == False
    ).count()

    total_rides = db.query(Ride).count()

    return {
        "total_users": total_riders + total_drivers,
        "total_riders": total_riders,
        "total_drivers": total_drivers,
        "active_users": active_users,
        "deactivated_users": deactivated_users,
        "total_rides": total_rides
    }


