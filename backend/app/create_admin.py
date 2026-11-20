
from getpass import getpass

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password


def create_admin():
    db = SessionLocal()

    try:
        name = input("Enter admin name: ").strip()
        email = input("Enter admin email: ").strip().lower()
        password = getpass("Enter admin password: ")
        confirm_password = getpass("Confirm admin password: ")

        if not name or not email or not password:
            print("All fields are required.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        if db.query(User).filter(User.email == email).first():
            print("An account with this email already exists.")
            return

        admin = User(
            name=name,
            email=email,
            role="admin",
            password=hash_password(password)
        )

        db.add(admin)
        db.commit()

        print("Admin account created successfully!")

    except Exception:
        db.rollback()
        print("Failed to create admin account.")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
