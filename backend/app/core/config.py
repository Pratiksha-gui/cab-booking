
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = "replace-this-with-a-secure-random-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
