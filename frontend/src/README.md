# Aking Kaganapan — Frontend

Responsive React + Vite frontend for the existing Event Booking System API.

## Requirements
- Node.js 20.19+ or 22.12+ (required by current Vite version)
- MongoDB connection configured for the backend

## Run the system (Windows / VS Code)

### 1. Configure backend
From the project root (`event-booking-system`), create `.env` using the existing backend's required variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
COORDINATOR_NAME=Event Coordinator
COORDINATOR_EMAIL=coordinator@example.com
COORDINATOR_PASSWORD=UseYourOwnStrongPassword123!
```

Do not share or commit the real `.env` file.

### 2. Install backend packages
Open a terminal at the project root:

```powershell
npm install
node test-db.js
npm run create-coordinator
npm run dev
```

Leave this terminal running. The API should be at `http://localhost:3000`.

### 3. Install and start frontend
Open a second terminal:

```powershell
cd frontend/src
npm install
npm run dev
```

Open the Local URL Vite prints, normally `http://localhost:5173`.

### Frontend features
- Responsive landing page
- Client registration and sign-in forms
- Event booking request form
- Client booking list and status filters
- Coordinator booking dashboard, status/payment updates, and delete action
- Account profile page
- API requests through Vite's `/api` proxy

## Important existing backend limitation
The backend login controller in `controllers/userController.js` currently does not compare the entered password with the stored hash and does not handle a missing user before reading `user._id`. This frontend intentionally does not change backend code. Therefore, signup can use the existing registration endpoint, but real sign-in and authenticated booking flows require the backend login controller to be corrected. Do not use this system with real customer data until that is fixed.

## Demonstration checklist
1. Start MongoDB / confirm `node test-db.js` succeeds.
2. Start the backend in terminal 1 and frontend in terminal 2.
3. Open `http://localhost:5173` and show the responsive landing page.
4. Open the page on a narrow browser width or use Chrome DevTools device toolbar to demonstrate mobile responsiveness.
5. Open Create account and show the registration form; submit a test client account.
6. Show the sign-in form and explain that sign-in is currently blocked by the existing backend login defect until it is fixed.
7. Once backend login is fixed, sign in as a client, submit an event booking, and show it in My Bookings.
8. Sign in with the coordinator account created by `npm run create-coordinator`, show all booking requests, edit booking/payment status, save, refresh, and verify the update.
9. Show the profile page and sign out.

## Build check
From `frontend/src`:

```powershell
npm run build
```
