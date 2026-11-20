
from app.core.security import hash_password, verify_password

password = "MySecurePassword123"

hashed_password = hash_password(password)

print("Original password:", password)
print("Hashed password:", hashed_password)

print("Password verification:",
      verify_password(password, hashed_password))
