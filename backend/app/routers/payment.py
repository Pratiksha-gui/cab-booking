
import uuid
import razorpay

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.ride import Ride
from app.models.payment import Payment
from app.models.user import User
from app.core.dependencies import get_current_user, role_required
from app.core.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
from pydantic import BaseModel


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

class PaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
def create_payment_order(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("rider"))
):
    # Check Razorpay configuration
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment gateway is not configured"
        )

    # Find the ride
    ride = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.rider_id == current_user.id
    ).first()

    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )

    # Prevent payment if already paid
    existing_payment = db.query(Payment).filter(
        Payment.ride_id == ride.id,
        Payment.status == "paid"
    ).first()

    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This ride has already been paid"
        )

    # Calculate amount from database fare (Razorpay uses paise)
    amount = int(round(ride.estimated_fare * 100))

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ride fare"
        )

    # Create Razorpay order
    try:
        client = razorpay.Client(
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
        )

        order = client.order.create(data={
            "amount": amount,
            "currency": "INR",
            "receipt": f"ride_{ride.id}_{uuid.uuid4().hex[:12]}",
            "notes": {
                "ride_id": str(ride.id),
                "rider_id": str(current_user.id)
            }
        })

        # Save payment record
        payment = Payment(
            ride_id=ride.id,
            rider_id=current_user.id,
            amount=ride.estimated_fare,
            currency="INR",
            status="pending",
            razorpay_order_id=order["id"]
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "payment_id": payment.id,
            "razorpay_order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to create payment order"
        )



@router.post("/verify")
def verify_payment(
    payment_data: PaymentVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("rider"))
):
    # Find the payment belonging to this rider
    payment = db.query(Payment).filter(
        Payment.razorpay_order_id == payment_data.razorpay_order_id,
        Payment.rider_id == current_user.id
    ).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found"
        )

    # Prevent duplicate verification
    if payment.status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has already been verified"
        )

    # Verify Razorpay signature
    try:
        client = razorpay.Client(
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
        )

        client.utility.verify_payment_signature({
            "razorpay_order_id": payment_data.razorpay_order_id,
            "razorpay_payment_id": payment_data.razorpay_payment_id,
            "razorpay_signature": payment_data.razorpay_signature
        })

    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature"
        )

    # Save verified payment details
    payment.razorpay_payment_id = payment_data.razorpay_payment_id
    payment.razorpay_signature = payment_data.razorpay_signature
    payment.status = "paid"

    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment verified successfully",
        "payment_id": payment.id,
        "ride_id": payment.ride_id,
        "amount": float(payment.amount),
        "currency": payment.currency,
        "status": payment.status
    }



@router.get("/my-history")
def get_my_payment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("rider"))
):
    payments = (
        db.query(Payment, Ride)
        .join(Ride, Payment.ride_id == Ride.id)
        .filter(Payment.rider_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )

    return [
        {
            "payment_id": payment.id,
            "ride_id": ride.id,
            "pickup_location": ride.pickup_location,
            "drop_location": ride.drop_location,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status,
            "razorpay_order_id": payment.razorpay_order_id,
            "razorpay_payment_id": payment.razorpay_payment_id,
            "created_at": payment.created_at
        }
        for payment, ride in payments
    ]

@router.get("/admin/all")
def get_all_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    payments = (
        db.query(Payment, Ride, User)
        .join(Ride, Payment.ride_id == Ride.id)
        .join(User, Payment.rider_id == User.id)
        .order_by(Payment.created_at.desc())
        .all()
    )

    return [
        {
            "payment_id": payment.id,
            "ride_id": ride.id,
            "rider_id": payment.rider_id,
            "rider_name": user.name,
            "rider_email": user.email,
            "pickup_location": ride.pickup_location,
            "drop_location": ride.drop_location,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status,
            "razorpay_order_id": payment.razorpay_order_id,
            "razorpay_payment_id": payment.razorpay_payment_id,
            "created_at": payment.created_at
        }
        for payment, ride, user in payments
    ]


@router.get("/admin/statistics")
def get_payment_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("admin"))
):
    total_payments = db.query(func.count(Payment.id)).scalar() or 0

    successful_payments = db.query(func.count(Payment.id)).filter(
        Payment.status == "paid"
    ).scalar() or 0

    pending_payments = db.query(func.count(Payment.id)).filter(
        Payment.status == "pending"
    ).scalar() or 0

    total_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == "paid"
    ).scalar() or 0

    return {
        "total_payments": total_payments,
        "successful_payments": successful_payments,
        "pending_payments": pending_payments,
        "total_revenue": float(total_revenue)
    }