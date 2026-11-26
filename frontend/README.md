# CabGo – Frontend

## Overview

The CabGo frontend is built using Next.js, React, and TypeScript. It provides separate interfaces for riders, drivers, and administrators to access the cab booking platform.

## Features

- User registration and login.
- Rider dashboard and ride history.
- Cab booking with pickup and drop locations.
- Interactive maps using Leaflet.
- Driver dashboard and ride management.
- Live driver location tracking.
- Online payment integration with Razorpay.
- Admin dashboard and management features.

## Technologies Used

- Next.js
- React
- TypeScript
- Leaflet
- React Leaflet
- CSS

## Project Structure

```text
frontend/
├── app/
│   ├── admin/
│   ├── book/
│   ├── components/
│   ├── dashboard/
│   ├── driver/
│   │   └── profile/
│   ├── login/
│   └── register/
├── public/
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file inside the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

This variable connects the frontend to the local FastAPI backend.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Backend Connection

The frontend communicates with the CabGo FastAPI backend through API requests.

Make sure the backend server is running at:

```text
http://127.0.0.1:8000
```

## Running the Production Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Project Repository

[CabGo – GitHub Repository](https://github.com/Pratiksha-gui/cab-booking)

## Author

CabGo – Online Cab Booking Platform
