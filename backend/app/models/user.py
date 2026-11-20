from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(15), unique=True, nullable=True)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    age = Column(Integer, nullable=True)
    password = Column(String(255), nullable=True)
    vehicle_number = Column(String(20), unique=True, nullable=True)
    address_proof_status = Column(String(20),nullable=False,default="pending",server_default="pending")
    address_proof_document = Column(String(255),nullable=True)
    address_proof_rejection_reason = Column(String(500), nullable=True)