# Aking Kaganapan – Event Booking System

A web app for event reservations. Clients browse packages and venues, request bookings, and pay approved
bookings with proof of payment. Coordinators review requests, set prices, verify payments, track expenses, and manage the package and venue catalog.

**Stack:** Node.js, Express 5, MongoDB (Mongoose), JWT auth, Cloudinary (payment proofs) · React 19, React Router 7, Vite.

## Project structure

```
server.js                 API entry point
config/                   MongoDB + Cloudinary setup
controllers/              Auth logic
middleware/               auth (protect, allowRoles), uploads, central error handling
models/                   User, Booking, Package, Venue, Payment, Expense
routes/                   One router per resource
utils/paymentSummary.js   Recalculates amountPaid / paymentStatus from verified payments
createCoordinator.js      Creates the coordinator account
frontend/src/             React app (pages, components, api, context, hooks, utils)
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   cd frontend/src && npm install
   ```
2. **Create `.env`** in the project root and fill in:
   `MONGO_URI`, `JWT_SECRET`, `COORDINATOR_NAME/EMAIL/PASSWORD`, and the `CLOUDINARY_*` keys.
   Optional: `PORT` (default 3000) and `CLIENT_ORIGIN` (default `http://localhost:5173`).
3. **Create the coordinator account** (coordinators cannot self-register):
   ```bash
   npm run create-coordinator
   ```
4. **Run**
   ```bash
   npm run dev                  # API on http://localhost:3000
   cd frontend/src && npm run dev   # app on http://localhost:5173
   ```
   The frontend reads `VITE_API_BASE` from `frontend/src/.env` (e.g. `http://localhost:3000`).

## Roles

| | Client | Coordinator |
|---|---|---|
| Register / sign in | Self-register | Created with `create-coordinator` |
| Bookings | Create, view own, cancel own (until a payment is verified) | View all, edit, set price, change status, delete |
| Payments | Submit proof for approved bookings, view own history | Verify or reject, with remarks |
| Packages & venues | Browse available ones | Add, edit, toggle availability, delete |
| Expenses | – | Add, cancel, see revenue vs. expenses |

The UI shows each role only its own navigation and pages, and the API enforces the same rules.

## Booking flow

1. Client submits a request (optionally with a package, venue and preferred payment method). The price starts
   as package price + venue rental.
2. Coordinator sets or adjusts the total price and approves (a price is required to approve).
3. Client submits payment proof; coordinator verifies or rejects it. Only verified payments count.
4. `amountPaid` and `paymentStatus` (Unpaid / Half Payment / Fully Paid) update automatically.
5. Coordinator marks the event Completed.

Allowed status changes: Pending → Approved or Cancelled · Approved → Completed or Cancelled · Cancelled → Pending · Completed is final.

## API overview

All routes except register/login need `Authorization: Bearer <token>`.

| Route | Access |
|---|---|
| `POST /api/users/register`, `POST /api/users/login` | Public |
| `GET /api/users/me` | Signed in |
| `GET /api/bookings`, `GET /api/bookings/:id` | Signed in (clients see only their own) |
| `POST /api/bookings`, `PATCH /api/bookings/:id/cancel` | Client |
| `PUT /api/bookings/:id`, `DELETE /api/bookings/:id` | Coordinator |
| `GET /api/packages`, `GET /api/venues` | Signed in |
| `POST/PUT/DELETE /api/packages`, `/api/venues` | Coordinator |
| `POST /api/payments`, `GET /api/payments/my-payments` | Client |
| `GET /api/payments`, `PUT /api/payments/:id/verify` | Coordinator |
| `GET/POST /api/expenses`, `PATCH /api/expenses/:id/cancel` | Coordinator |

## Error handling

Every error returns JSON shaped like `{ "message": "...", "errors": [{ "field", "message" }] }` (`errors` is optional).

- 400 validation or bad ID · 401 not signed in / expired token · 403 wrong role · 404 not found
- 409 conflict (duplicate, or deleting something still in use) · 503 database unavailable
- Server errors (500) are logged on the server and show a generic message to the user.


