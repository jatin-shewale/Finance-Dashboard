# Finance Dashboard Backend with Role-Based Access Control (RBAC)

A full-stack finance tracking application with a clean backend architecture, role-based access control, and powerful data aggregation capabilities using MongoDB.

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

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB 6+ (running locally or cloud)

### Backend Setup

```bash
# Install dependencies
npm install

# Configure environment variables (copy .env.example to .env)
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start MongoDB (if running locally)
# On macOS/Linux: brew services start mongodb-community
# On Windows: net start MongoDB

# Run in development
npm run dev

# Run in production
npm start
```

The API will be available at `http://localhost:5000`. Health check: `GET /health`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend will be available at `http://localhost:5173`.

### Seeding Initial Data

You can create an initial admin user via API:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Then update role to admin via MongoDB shell or modify the endpoint
```

## Project Structure Summary

This project demonstrates:

✅ **Clean Backend Architecture** - Layered design with clear separation of concerns
✅ **Role-Based Access Control** - Policies, middlewares, and role restrictions
✅ **Well-Structured Business Logic** - All logic in services, not controllers
✅ **Data Aggregation** - MongoDB aggregation pipelines for reports
✅ **Maintainability** - Modular code with proper naming and documentation
✅ **Security** - Hashed passwords, JWT, input validation, authorization checks
✅ **Frontend UX** - React with Framer Motion animations, Tailwind styling, responsive design
✅ **Documentation** - Comprehensive README with diagrams and explanations

This is a production-ready template that can be extended for real-world finance tracking applications while maintaining high code quality standards.
