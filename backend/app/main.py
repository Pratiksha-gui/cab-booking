from fastapi import FastAPI
from app.database import engine, Base
from app.models.user import User
from app.routers import user
from app.routers import auth
from app.routers.ride import router as ride_router
from fastapi.middleware.cors import CORSMiddleware
from app.routers.payment import router as payment_router
app = FastAPI(
title="Cab Booking API",
description="This is a simple API for booking cabs.",       
version="0.162.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(auth.router)
app.include_router(ride_router)
app.include_router(payment_router)

Base.metadata.create_all(bind=engine)

@app.get("/")       
def read_root():
    return {"message": "Welcome to the Cab Booking API!"}       

@app.get("/health")
def health_check():
    return {"status": "healthy"}    