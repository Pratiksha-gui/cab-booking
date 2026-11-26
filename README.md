# CabGo – Online Cab Booking Platform

## Overview

CabGo is an online cab booking platform that connects riders and drivers through a web application. Users can register and log in according to their roles, book rides, manage ride requests, make online payments, and track driver locations.

The platform includes separate interfaces for riders, drivers, and administrators.

## Features

### Rider
- User registration and login.
- Book rides by selecting pickup and drop locations.
- View ride details and ride history.
- Track driver location during an active ride.
- Make online payments using Razorpay.

### Driver
- Driver registration and login.
- View available ride requests.
- Accept and manage rides.
- Update ride status.
- Share live GPS location during an active ride.
- Manage driver profile and address proof details.

### Admin
- Admin login and dashboard.
- Manage platform users and rides.
- Review driver address proof submissions.
- View and manage payment information.

## Technologies Used

### Frontend
- Next.js
- React
- TypeScript
- Leaflet
- React Leaflet
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT Authentication
- bcrypt and Passlib
- Razorpay
- Uvicorn
- pytest

## Project Structure

```text
cab-booking/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── utils/
│   ├── tests/
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   ├── book/
│   │   ├── components/
│   │   ├── dashboard/
│   │   ├── driver/
│   │   ├── login/
│   │   └── register/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── README.md
│
└── README.md
```

## Installation and Setup

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Pratiksha-gui/cab-booking.git
cd cab-booking
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
python -m venv venv
```

On Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

Configure the required database connection, authentication, and payment settings according to the backend application configuration.

Use your own PostgreSQL database credentials and Razorpay test credentials.

**Important:** Never commit `.env` files, passwords, secret keys, or private credentials to GitHub.

### 4. Database Migration

Make sure PostgreSQL is running and the configured database exists.

Run the database migrations:

```bash
alembic upgrade head
```

### 5. Start the Backend Server

From the backend directory, run:

```bash
uvicorn app.main:app --reload
```

Backend API:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 6. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file inside the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the frontend development server:

```bash
npm run dev
```

Open the application:

http://localhost:3000

## Running the Application

Start both servers:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:3000`

The frontend communicates with the backend through API requests.

## Payment Integration

CabGo uses Razorpay for online payment processing. Test credentials should be configured before testing payment functionality.

## Live Location Tracking

The application supports driver GPS location updates and rider-side tracking during active rides.

## GitHub Repository

[CabGo – Online Cab Booking Platform](https://github.com/Pratiksha-gui/cab-booking)

## Author

Developed as a cab booking platform project.
