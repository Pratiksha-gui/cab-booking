
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin
from app.core.security import hash_password, verify_password
from app.core.token import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    if user.phone:
        existing_phone = db.query(User).filter(
            User.phone == user.phone
        ).first()

        if existing_phone:
            raise HTTPException(
                status_code=409,
                detail="Phone number already registered"
            )

    if user.vehicle_number:
        existing_vehicle = db.query(User).filter(
            User.vehicle_number == user.vehicle_number
        ).first()

        if existing_vehicle:
            raise HTTPException(
                status_code=409,
                detail="Vehicle number already registered"
            )

    user_data = user.model_dump(exclude={"password"})

    db_user = User(
        **user_data,
        password=hash_password(user.password)
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "message": "User registered successfully",
        "user_id": db_user.id,
        "vehicle_number": db_user.vehicle_number
    }


@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact admin."
    )

    if not db_user.password or not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(db_user.id),
            "role": db_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role
    }
