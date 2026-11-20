
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Numeric,
    DateTime
)
from sqlalchemy.sql import func

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    ride_id = Column(
        Integer,
        ForeignKey("rides.id"),
        nullable=False,
        index=True
    )

    rider_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    status = Column(
        String(20),
        default="pending",
        nullable=False
    )

    razorpay_order_id = Column(String(100), unique=True, nullable=False)
    razorpay_payment_id = Column(String(100), unique=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
