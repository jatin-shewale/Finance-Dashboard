# Finance Dashboard - Full-Stack Application with RBAC

A full-stack finance tracking application featuring a clean **backend** with role-based access control (RBAC) and a modern **React frontend** with toast notifications, powered by MongoDB aggregation pipelines.

## 🚀 Features

- **Role-Based Access Control**: Viewer, Analyst, Admin with granular permissions
- **Financial Tracking**: Income/expense recording with category management
- **Dashboard Analytics**: Real-time aggregated insights, trends, and category breakdowns
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **Toast Notifications**: User-friendly success/error feedback (frontend)
- **Clean Architecture**: Layered backend with separation of concerns
- **Responsive UI**: Built with React, Tailwind CSS, and Framer Motion

---

## 📁 Project Structure

The project is organized into two independent applications:

```
e:/Project/
├── backend/                 # Express.js REST API
│   ├── src/
│   │   ├── app.js          # Middleware & route configuration
│   │   ├── server.js       # Server entry point (listen)
│   │   ├── config/
│   │   │   └── db.js       # MongoDB connection
│   │   ├── controllers/    # HTTP request/response handlers
│   │   ├── services/       # Business logic layer
│   │   ├── models/         # Mongoose schemas (User, FinancialRecord)
│   │   ├── routes/         # API endpoint definitions
│   │   ├── policies/       # Authorization logic
│   │   ├── middlewares/    # Auth, error handling
│   │   └── utils/          # Helpers (hashing, formatting)
│   ├── scripts/
│   │   └── seed.js         # Database seeder
│   ├── .env                # Backend environment variables
│   ├── package.json
│   └── node_modules/
│
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── main.jsx        # App entry point with Toaster
│   │   ├── App.jsx         # Router configuration
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Login, Register, Dashboard, Records
│   │   ├── context/        # AuthContext (state management)
│   │   ├── services/       # API client with interceptors
│   │   ├── hooks/          # Custom React hooks
│   │   └── assets/         # Static assets
│   ├── .env                # Frontend env (Vite proxy config)
│   ├── vite.config.js      # Vite + proxy setup
│   ├── tailwind.config.js  # Tailwind CSS
│   ├── package.json
│   └── node_modules/
│
├── postman/                 # Postman collection for API testing
│   └── Finance Dashboard API.postman_collection.json
│
├── README.md
└── SETUP.md
```

## Problem Understanding

The goal is to build a **finance dashboard** where users can track income and expenses with **strict role-based permissions**. The system needs to:

- Support three distinct user roles (Viewer, Analyst, Admin) with granular permissions
- Provide aggregated financial insights (totals, trends, category breakdowns)
- Maintain clean, testable code with proper separation of concerns
- Ensure secure authentication and authorization
- Handle data efficiently using MongoDB aggregation pipelines

## Architecture Design

### Backend Layered Architecture

The backend follows a strict **layered architecture** pattern:

```
src/
├── app.js                 # Application entry point, middleware setup
├── server.js              # Server startup
├── config/
│   └── db.js              # Database connection configuration
├── models/                # Mongoose schemas
│   ├── User.js
│   └── FinancialRecord.js
├── controllers/           # Request/response handlers (NO business logic)
│   ├── userController.js
│   ├── financialRecordController.js
│   └── dashboardController.js
├── services/              # Business logic layer (ALL business rules)
│   ├── userService.js
│   ├── financialRecordService.js
│   └── dashboardService.js
├── routes/                # API endpoint definitions
│   ├── auth.js
│   ├── users.js
│   ├── records.js
│   └── dashboard.js
├── policies/              # Permission/access control logic
│   ├── userPolicy.js
│   └── financialRecordPolicy.js
├── middlewares/           # HTTP middleware
│   ├── auth.js            # JWT verification, role restriction
│   ├── roleCheck.js       # Role-based permission checks
│   └── errorHandler.js    # Centralized error handling
└── utils/
    └── helpers.js         # Helper functions (hashing, formatting)
```

### Why This Architecture?

1. **Separation of Concerns**: Controllers handle only HTTP concerns; services contain all business logic.
2. **Testability**: Services can be tested independently of HTTP layer.
3. **Maintainability**: Each layer has a single responsibility, making the codebase easier to navigate.
4. **Security**: All authorization logic is centralized in policies and middlewares, not scattered.
5. **Scalability**: Easy to add new features or modify existing ones without affecting other layers.

## Data Flow

### Request Flow

```
HTTP Request
   ↓
Routes (URL matching)
   ↓
Middlewares (auth, role checks)
   ↓
Controller (validate request)
   ↓
Services (business logic)
   ↓
Models (MongoDB operations)
   ↓
Services (process data)
   ↓
Controller (format response)
   ↓
HTTP Response
```

### Example: Fetch Dashboard Summary

1. Client sends `GET /api/v1/dashboard/summary` with JWT token
2. `auth` middleware validates token, attaches user to request
3. `dashboardController.getSummary` receives request
4. Controller calls `dashboardService.getDashboardSummary(userId, role, filters)`
5. Service builds MongoDB aggregation pipeline
6. `FinancialRecord.aggregate()` executes database operations
7. Results are processed and returned through the stack
8. Client receives JSON with financial summary

## Database Design

### Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,           // User's full name
  email: String,          // Unique, indexed
  password: String,       // Hashed with bcryptjs (select: false by default)
  role: String,           // enum: ['viewer', 'analyst', 'admin']
  status: String,         // enum: ['active', 'inactive']
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ email: 1 }` - Fast lookup by email
- `{ role: 1 }` - Role-based queries
- `{ status: 1 }` - Status filtering

#### FinancialRecords Collection
```javascript
{
  _id: ObjectId,
  amount: Number,         // Positive only
  type: String,           // enum: ['income', 'expense']
  category: String,       // e.g., "Salary", "Rent", "Food"
  date: Date,             // Transaction date
  description: String,    // Optional, max 500 chars
  createdBy: ObjectId,    // Reference to User
  isDeleted: Boolean,     // Soft delete flag
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ createdBy: 1 }` - User's records lookup
- `{ date: -1 }` - Recent records sorting
- `{ category: 1 }` - Category aggregation
- `{ type: 1 }` - Type filtering
- `{ createdBy: 1, date: -1 }` - User's recent records
- `{ isDeleted: 1 }` - Filter deleted records

### Relationship

- One-to-Many: One User can create many FinancialRecords
- `FinancialRecord.createdBy` references `User._id`

## API Design

### Base URL
```
http://localhost:5000/api/v1
```

### Public Endpoints

#### POST `/auth/register`
Register a new user. Default role is `viewer`.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/auth/login`
Authenticate and receive JWT token.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Protected Endpoints (Require JWT)

#### GET `/dashboard/summary`
Get aggregated financial data including totals, recent transactions, trends.

**Query Params (optional):**
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "financials": {
      "totalIncome": 50000,
      "totalExpenses": 30000,
      "netBalance": 20000,
      "transactionCount": 50
    },
    "recentTransactions": [...],
    "topCategories": [...],
    "monthlyTrends": [...]
  }
}
```

#### GET `/records`
List all records with pagination and filtering.

**Query Params:**
- `type` (income/expense)
- `category`
- `startDate`
- `endDate`
- `page` (default: 1)
- `limit` (default: 50)
- `sortBy` (default: date)
- `sortOrder` (asc/desc, default: desc)

#### POST `/records`
Create a new record (Admin only)

**Body:**
```json
{
  "amount": 1500.00,
  "type": "expense",
  "category": "Rent",
  "date": "2025-04-01",
  "description": "Monthly rent payment"
}
```

#### PUT `/records/:id`
Update a record (Admin only)

#### DELETE `/records/:id`
Soft delete a record (Admin only)

#### GET `/users/me`
Get current user profile.

#### GET `/users` (Admin only)
Get all users with pagination and filters.

#### PUT `/users/:id` (Admin only)
Update user details.

#### POST `/users/:id/activate` (Admin only)
Activate a deactivated user.

#### POST `/users/:id/deactivate` (Admin only)
Deactivate a user.

## Access Control Strategy

### Role Permissions Matrix

| Role   | Users                        | Financial Records                  | Dashboard |
|--------|------------------------------|------------------------------------|-----------|
| Viewer | read:own (own profile only)  | read:own (own records only)        | read      |
| Analyst| read:all                     | read:all, create                   | read      |
| Admin  | read:all, create, update, delete | read:all, create, update, delete | read      |

### Implementation

1. **Authentication (`middlewares/auth.js`)**
   - JWT verification with secret key
   - Token attached to request as user object
   - Automatically checks user status (active/inactive)

2. **Authorization (`middlewares/roleCheck.js`)**
   - `checkRolePermission(action, resource)` - checks if user's role has permission for action on resource
   - Role-permission mapping defined centrally

3. **Policy Layer (`policies/`)**
   - `canAccessRecord()` - Verifies ownership or admin privileges
   - `filterRecordsByPermission()` - Applies user-specific filtering to queries
   - `canModifyRole()` - Prevents admins from changing other admins' roles

4. **Route-Level Guards**
   - Admin-only routes explicitly protected with `restrictTo('admin')`
   - Record creation/edit/delete restricted in route definitions

### Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens expire in 7 days (configurable)
- Passwords never returned in API responses (select: false)
- Soft delete for financial records (preserves data for audit)
- Input validation with express-validator
- CORS configured for frontend whitelisting
- MongoDB injection prevented via Mongoose

## Trade-offs

### Why MongoDB?
- **Advantages**: Schema flexibility for future enhancements, good aggregation pipeline capabilities for dashboard queries, JSON-like documents match our data structures.
- **Trade-off**: No joins, but we manage relationships in application code. Acid transactions available in newer versions but we don't need complex multi-document transactions for this use case.

### Why JWT?
- **Advantages**: Stateless authentication, scalable horizontally, no session store needed. Client-side storage convenient for distributed systems.
- **Trade-off**: Token revocation requires additional infrastructure (we could add a token blacklist if needed). 7-day expiration limits risk.

### Why Service Layer?
- **Advantages**: Business logic is testable, reusable, and independent of HTTP concerns. Controllers remain thin. Easy to swap out HTTP framework without touching business logic.
- **Trade-off**: Extra layer of indirection. For simple CRUD apps this might feel like boilerplate, but it demonstrates professional architecture.

### Why RBAC Design?
- **Advantages**: Clear separation of responsibilities, secure by default, easy to audit. Policy layer centralizes authorization logic.
- **Trade-off**: More verbose than simple middleware checks, but much more maintainable and secure as the system grows.

## Assumptions Made

1. **Only admins can create financial records**
   - Assumption: Analysts should not create records to maintain segregation of duties
   - Can be easily adjusted in policies if requirements change

2. **Soft delete for records**
   - Assumption: Audit trail is important; deleted data should be recoverable
   - The `isDeleted` flag filters out deleted records in all queries

3. **Default user role is 'viewer'**
   - New registrations get minimal permissions
   - Admin must be manually assigned or seeded

4. **Date-based filtering uses range queries**
   - Dashboard can filter by arbitrary date ranges
   - Aggregations respect date filters

5. **No file uploads**
   - Receipts or attachments not required
   - Simplifies the system

6. **Single currency (USD)**
   - For simplicity, all amounts in USD
   - Can be extended with currency field if needed

7. **No multi-tenancy**
   - Single organization, multiple users share same data space
   - User isolation enforced at query level

8. **Basic pagination (skip/limit)**
   - Use MongoDB cursor-based pagination would be better for large datasets, but skip/limit sufficient for this scale

## Future Improvements

1. **Enhanced Security**
   - Add rate limiting (express-rate-limit)
   - Request logging middleware for audit trail
   - Helmet.js for security headers
   - Refresh token rotation

2. **Advanced Features**
   - Export records to CSV/PDF
   - Recurring transactions
   - Budget management with alerts
   - Bulk upload via CSV
   - Email notifications for record creation

3. **Scalability**
   - Redis caching for dashboard aggregations
   - Index optimization based on query patterns
   - Database connection pooling configuration
   - Read replicas for reporting queries

4. **Testing**
   - Unit tests for services and controllers
   - Integration tests for API endpoints
   - E2E tests with Supertest
   - Load testing for aggregation endpoints

5. **Monitoring & Observability**
   - Application metrics (Prometheus)
   - Structured logging with Winston
   - Error tracking (Sentry)
   - MongoDB performance monitoring

6. **API Enhancements**
   - GraphQL alternative for flexible queries
   - WebSocket for real-time updates
   - API versioning strategy
   - Request/response compression
   - OpenAPI/Swagger documentation

7. **Data Management**
   - Database migrations tool
   - Backup and restore procedures
   - Data archival strategy for old records
   - Multi-currency support

8. **Frontend Improvements**
   - Interactive charts for trends (Chart.js or Recharts)
   - Print-friendly reports
   - Dark mode support
   - Offline capability with service workers
   - Export dashboards as images

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js 18+** ([Download](https://nodejs.org/))
- **MongoDB 6+** ([Download](https://www.mongodb.com/try/download/community)) or MongoDB Atlas cloud
- Basic knowledge of terminal/command prompt

---

### Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
# The .env file is already present with default values:
# - MONGODB_URI=mongodb://localhost:27017/finance_dashboard
# - JWT_SECRET=your_jwt_secret_key_change_in_production_32_characters_min
# - JWT_EXPIRE=7d
# - PORT=5000
# - NODE_ENV=development

# 4. Ensure MongoDB is running
# On Windows: Start MongoDB service or run 'mongod' in a separate terminal
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# 5. Start backend in development mode (with hot reload)
npm run dev

# Or for production:
npm start
```

✅ Backend runs on **http://localhost:5000**  
✅ Health check: `GET http://localhost:5000/health`

---

### Frontend Setup

```bash
# 1. Navigate to frontend folder (in a new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Frontend will be available at:
# - http://localhost:5173 (default)
# - If port is in use, Vite will auto-select another (e.g., 5174)
```

✅ Frontend runs with Vite dev server with **HMR (Hot Module Replacement)**  
✅ API requests are proxied to `http://localhost:5000` via Vite config  
✅ Toast notifications appear in the top-right corner

---

### Database Seeding (Optional)

To populate the database with sample users and records:

```bash
cd backend
node scripts/seed.js
```

This creates:
- **3 users**:
  - `admin@finance.com` / `admin123` (Admin role)
  - `analyst@finance.com` / `analyst123` (Analyst role)
  - `viewer@finance.com` / `viewer123` (Viewer role)
- **100 sample financial records** with realistic data

---

### Quick Test with cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Dashboard (requires token):**
```bash
curl http://localhost:5000/api/v1/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Key Features & Architecture

### Backend Highlights
- **Layered Architecture**: Controllers → Services → Models with clean separation
- **RBAC Implementation**: Policy-based authorization in `policies/` folder
- **MongoDB Aggregation**: Efficient dashboard queries using aggregation pipelines
- **Validation**: `express-validator` for input sanitization
- **Error Handling**: Centralized error middleware with consistent JSON responses

### Frontend Highlights
- **Toast Notifications**: `react-hot-toast` for real-time user feedback
- **API Interceptors**: Automatic token injection and centralized error handling
- **React Context**: `AuthContext` for global authentication state
- **Protected Routes**: `PrivateRoute` component guards dashboard pages
- **Responsive Design**: Tailwind CSS with mobile-friendly layouts
- **Animations**: Framer Motion for smooth page transitions

---

## 📊 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user (default role: viewer) |
| POST | `/api/v1/auth/login` | Login and receive JWT token |

### User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get current user profile |
| GET | `/api/v1/users` | List all users (with filters) |
| PUT | `/api/v1/users/:id` | Update user details |
| POST | `/api/v1/users/:id/activate` | Activate user |
| POST | `/api/v1/users/:id/deactivate` | Deactivate user |

### Financial Records

| Method | Endpoint | Permissions |
|--------|----------|-------------|
| GET | `/api/v1/records` | List records with filters |
| POST | `/api/v1/records` | Create record (Admin only) |
| GET | `/api/v1/records/:id` | Get single record |
| PUT | `/api/v1/records/:id` | Update record (Admin only) |
| DELETE | `/api/v1/records/:id` | Soft delete (Admin only) |
| GET | `/api/v1/records/categories` | Get unique categories |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/summary` | Financial totals, trends, recent transactions |
| GET | `/api/v1/dashboard/category-summary` | Category-wise spending breakdown |

---

## 🔐 Access Control Matrix

| Action | Viewer | Analyst | Admin |
|--------|--------|--------|-------|
| View own profile | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Create financial records | ❌ | ❌ | ✅ |
| View own records | ✅ | ✅ | ✅ |
| View all records | ❌ | ✅ | ✅ |
| Update/Delete records | ❌ | ❌ | ✅ |
| Manage users (activate/deactivate) | ❌ | ❌ | ✅ |
| View dashboard | ✅ | ✅ | ✅ |

---

## 🧪 Testing with Postman

Import the Postman collection to test all endpoints:

```
postman/Finance Dashboard API.postman_collection.json
```

**Steps:**
1. Open Postman → Import → Upload the collection file
2. Set up environment variables:
   - `jwt_token` (will be auto-populated by the collection's test script)
3. Run the "Health Check" request to verify backend is running
4. Run "Register" or "Login" to get a JWT token
5. Subsequent requests will use `{{jwt_token}}` automatically

---

## 🏗️ Design Decisions & Trade-offs

### Why MongoDB?
- ✅ Flexible schema for future enhancements
- ✅ Powerful aggregation pipeline perfect for dashboard analytics
- ✅ JSON documents match JavaScript/TypeScript data structures
- ⚠️ Trade-off: No SQL joins (relationships handled in app code)

### Why JWT?
- ✅ Stateless authentication (no session store needed)
- ✅ Horizontal scaling friendly
- ✅ Client can store token and send with each request
- ⚠️ Trade-off: Token revocation requires blacklist/refresh strategy

### Why Service Layer?
- ✅ Business logic testable without HTTP layer
- ✅ Reusable across different controllers/routes
- ✅ Clear separation: Controllers = HTTP, Services = Logic
- ⚠️ Trade-off: Extra abstraction for simple CRUD (but pays off as complexity grows)

### Why Policy Layer for Authorization?
- ✅ Centralized permission logic (single source of truth)
- ✅ Easy to audit and modify permissions
- ✅ Reusable across controllers and services
- ⚠️ Trade-off: More files, but much more maintainable

---

## 📝 Development Notes

### Backend
- Uses **ES Modules** (`type: "module"` in package.json)
- All imports/export use `.js` extensions (required in ESM)
- Mongoose 8+ with Node.js driver 4+ (no `useNewUrlParser`/`useUnifiedTopology` options)
- Password hashing via **bcryptjs** (10 salt rounds)
- Pre-save middleware on User model auto-hashes passwords

### Frontend
- **Vite** for fast development and HMR
- **React Router v6** for navigation
- **Tailwind CSS** for styling
- **Axios** with interceptors for API calls
- **react-hot-toast** for notifications
- **Framer Motion** for animations

### Proxy Configuration
Vite dev server proxies `/api/*` to `http://localhost:5000` (see `frontend/vite.config.js`). No CORS issues in development.

---

## 🔧 Common Issues & Solutions

### Backend won't start (EADDRINUSE)
Port 5000 is already in use. Kill the process:
```bash
# Windows
netstat -ano | findstr :5000
taskkill //F //PID <pid>

# macOS/Linux
lsof -i :5000
kill -9 <pid>
```

### MongoDB connection fails
- Ensure MongoDB service is running: `mongod`
- Check connection string in `.env`
- Verify database exists or will be created automatically

### "Module not found" errors after moving files
All backend imports use relative paths from `backend/src/`. If you moved files, update import paths accordingly.

### Frontend can't reach backend (ECONNREFUSED)
- Backend must be running on port 5000
- Check Vite proxy config in `frontend/vite.config.js`
- Open browser dev tools → Network tab to see the request URL

### Toast notifications not showing
- Verify `react-hot-toast` is installed: `cd frontend && npm install`
- Check that `<Toaster />` is in `src/main.jsx`
- Ensure import: `import { toast } from 'react-hot-toast'`

---

## 🚀 Future Enhancements

- [ ] **Security**: Rate limiting, Helmet.js, refresh token rotation
- [ ] **Testing**: Jest/React Testing Library, Supertest integration tests
- [ ] **Charts**: Recharts or Chart.js for dashboard visualizations
- [ ] **Export**: CSV/PDF export for financial reports
- [ ] **Real-time**: WebSocket for live notifications
- [ ] **Multi-currency**: Support for different currencies with conversion
- [ ] **Budgeting**: Set monthly budgets with alerts
- [ ] **Recurring transactions**: Automated income/expense entries
- [ ] **API Docs**: OpenAPI/Swagger documentation
- [ ] **Monitoring**: Prometheus metrics, Winston logging

---

## 📚 Resources

- **Postman Collection**: `postman/Finance Dashboard API.postman_collection.json`
- **MongoDB Docs**: https://docs.mongodb.com/
- **Express.js**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙋 Support

For issues, questions, or contributions, please open an issue on the repository or consult the code comments for detailed implementation notes.
