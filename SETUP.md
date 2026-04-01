# Quick Setup Guide

## Option 1: Automated Setup (Recommended)

```bash
# Install backend dependencies
npm install

# Start MongoDB (if not running)
# macOS/Linux:
# brew services start mongodb-community
#
# Windows:
# net start MongoDB
# or run: mongod

# Seed the database with sample data
node scripts/seed.js

# Start backend server
npm run dev

# In another terminal, start frontend
cd frontend
npm install
npm run dev
```

## Option 2: Manual Setup

### Backend

1. Navigate to project directory
2. Run `npm install`
3. Ensure MongoDB is running on `mongodb://localhost:27017`
4. Copy `.env` and configure if needed
5. Run `npm run dev` (or `npm start` for production)

### Frontend

1. Navigate to `frontend/` directory
2. Run `npm install`
3. Run `npm run dev`
4. Open `http://localhost:5173` in browser

## Initial Admin User

After setup, create an admin user:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@finance.com",
    "password": "admin123"
  }'
```

Then manually update that user's role to `admin` in MongoDB or use MongoDB shell:

```javascript
use finance_dashboard
db.users.updateOne(
  { email: "admin@finance.com" },
  { $set: { role: "admin" } }
)
```

## Project Structure

```
finance-dashboard/
├── src/                 # Backend source
├── frontend/            # React frontend
├── README.md            # Full documentation
├── POSTMAN/             # API collection
├── .env                 # Environment config (create from .env.example)
├── package.json         # Backend deps
└── SETUP.md             # This file
```

## Features Overview

- ✅ User authentication with JWT
- ✅ Three roles: Viewer, Analyst, Admin
- ✅ Create/Read/Update/Delete financial records (Admin only)
- ✅ Dashboard with aggregated statistics
- ✅ Monthly trends, category breakdowns
- ✅ Responsive frontend with Framer Motion
- ✅ Clean layered backend architecture
- ✅ MongoDB aggregation pipelines

## Troubleshooting

**MongoDB connection refused:**
- Ensure MongoDB service is running
- Check connection string in `.env`

**Port already in use:**
- Backend: change `PORT` in `.env` (default 5000)
- Frontend: change `port` in `frontend/vite.config.js` (default 5173)

**Token not working:**
- Ensure `Authorization: Bearer <token>` header is set
- Check token expiration (default 7 days)

## Seeding Sample Data

The `scripts/seed.js` file creates sample users and records for testing.

```bash
node scripts/seed.js
```

Sample users created:
- admin@finance.com (role: admin, password: admin123)
- analyst@finance.com (role: analyst, password: analyst123)
- viewer@finance.com (role: viewer, password: viewer123)

## Testing the Flow

1. Login as any user to get JWT token
2. Access dashboard to see aggregated data (requires auth)
3. View records page (see all records if admin/analyst, own only if viewer)
4. Create/Edit/Delete records (admin only)
5. Try accessing user management (admin only)

## Learn more

See [README.md](./README.md) for full documentation on architecture, trade-offs, and future improvements.
