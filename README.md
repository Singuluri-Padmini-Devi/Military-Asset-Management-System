# Military Asset Management System

This workspace contains a full-stack project with separate frontend and backend folders.

## Tech Stack
- Frontend: React + Vite + Axios + React Router
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: JWT + Role Based Access Control (RBAC)

## Project Structure
- `frontend/` - React app
- `backend/` - Express API

## Default Login Credentials
- Email: `admin@military.local`
- Password: `Admin@123`

## Roles
- Admin
- Base Commander
- Logistics Officer

## Backend Setup
1. Open terminal in `backend`
2. Update `.env` if needed:
   - `PORT=5000`
   - `MONGO_URI=mongodb://127.0.0.1:27017/military_asset_management`
   - `JWT_SECRET=supersecretkey`
3. Run: `npm run dev`

## Frontend Setup
1. Open terminal in `frontend`
2. `.env` already contains `VITE_API_URL=http://localhost:5000/api`
3. Run: `npm run dev`

## API Endpoints
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Assets
- `GET /api/assets`

### Purchases
- `GET /api/purchases`
- `POST /api/purchases`

### Transfers
- `GET /api/transfers`
- `POST /api/transfers`

### Assignments & Expenditures
- `GET /api/assignments`
- `POST /api/assignments`

### Dashboard
- `GET /api/dashboard?base=&category=`

## Implemented Assignment Features
- Asset balance tracking by base
- Purchases, transfers, assignments, and expenditures
- Dashboard totals and filters
- Net movement pop-up modal in dashboard
- JWT authentication and RBAC middleware
- Role-aware data visibility
