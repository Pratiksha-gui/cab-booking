# Cab Booking Platform 🚖

A full-stack cab booking application built using FastAPI, Python, PostgreSQL, React, and Next.js. The platform connects riders and drivers and provides ride booking, driver management, fare estimation, and live driver location tracking.

## Project Overview

The Cab Booking Platform provides separate interfaces for riders, drivers, and administrators. It simplifies ride booking and management through a modern web application.

## Features

### 1. User Management
- User registration and login
- Token-based authentication
- Rider and driver account management
- Driver profile management
- Vehicle number management

### 2. Ride Booking
- Pickup and drop location selection
- Geographic coordinates for pickup and drop
- Estimated fare calculation
- Ride request management
- Ride status management

### 3. Driver Management
- Driver dashboard
- Driver profile and vehicle information
- Address proof document upload
- Address proof verification status
- Address proof rejection reason

### 4. Live Driver Location
- GPS-based driver location updates
- Latitude and longitude tracking
- Last GPS update information
- Driver location display on an interactive map

### 5. Payment Management
- Payment-related API functionality
- Payment database model
- Ride and payment data management

### 6. Admin Management
- Administrative dashboard
- User and driver management
- Driver verification information

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| API Documentation | Swagger UI |
| Maps | React Leaflet |
| Authentication | Token-based authentication |

## Project Structure

```text
cab-booking/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── utils/
│   │   ├── main.py
│   │   └── database.py
│   ├── tests/
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Pratiksha-gui/cab-booking.git
cd cab-booking
```

### 2. Backend Setup

```powershell
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Database Configuration

1. Install PostgreSQL.
2. Create a database for the application.
3. Configure your database connection and secret keys using environment variables.
4. Never upload your `.env` file or database credentials to GitHub.

Run database migrations:

```powershell
python -m alembic upgrade head
```

### 4. Start Backend

From the backend directory:

```powershell
uvicorn app.main:app --reload
```

Backend URL:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 5. Frontend Setup

Open another terminal:

```powershell
cd frontend

npm install

npm run dev
```

Frontend URL:

http://localhost:3000

## Testing

The backend includes tests for user and ride functionality.

From the backend directory:

```powershell
pytest
```

## Security

- Keep database credentials in environment variables.
- Do not commit API keys or secret tokens.
- Keep private uploaded documents out of the public repository.
- Use appropriate authentication and authorization.

## Future Improvements

- Real-time ride updates
- Automated driver matching
- Production payment gateway integration
- Ride history and ratings
- Rider and driver notifications
- Production deployment

## Author

**Pratiksha Gaonkar**

GitHub: https://github.com/Pratiksha-gui

## Project Repository

https://github.com/Pratiksha-gui/cab-booking

---

Developed as a full-stack Cab Booking Platform using Python, FastAPI, PostgreSQL, React, and Next.js.