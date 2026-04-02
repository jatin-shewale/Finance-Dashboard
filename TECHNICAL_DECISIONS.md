# Technical Decisions and Trade-offs

## Executive Summary

This Finance Dashboard is a full-stack application implementing Role-Based Access Control (RBAC) with a modern React frontend and Express.js backend. This document details the key technical decisions, their rationale, and the trade-offs made during architecture and implementation.

---

## 1. Backend Architecture

### 1.1 Layered Architecture Pattern

**Decision**: Implemented strict separation between Controllers, Services, and Models.

**Rationale**:
- Controllers handle only HTTP concerns (request/response formatting)
- Services encapsulate all business logic
- Models handle data persistence
- Promotes single responsibility principle

**Trade-offs**:
- ✅ **Testability**: Services can be unit-tested without HTTP layer
- ✅ **Maintainability**: Clear boundaries make code easier to navigate
- ✅ **Swapability**: HTTP framework can be replaced without touching business logic
- ⚠️ **Boilerplate**: Extra files and indirection for simple CRUD operations
- ⚠️ **Learning Curve**: New developers must understand the layer boundaries

**Alternatives Considered**:
- **Fat Controllers**: Would reduce files but mix concerns; rejected for long-term maintainability
- **Clean Architecture/DDD**: Overkill for this project scope

---

### 1.2 Role-Based Access Control (RBAC)

**Decision**: Three-layer authorization approach:
1. `auth` middleware - JWT verification and user attachment
2. `roleCheck` middleware - Action/resource permission checks
3. Policy layer (`policies/`) - Business rule enforcement

**Rationale**:
- Defense in depth - multiple layers prevent authorization bypass
- Centralized permission matrix in `roleCheck.js` for auditability
- Policy layer handles ownership checks that can't be expressed in simple role matrices
- Route-level guards for admin-only endpoints as clear documentation

**Trade-offs**:
- ✅ **Security**: Multiple layers reduce attack surface
- ✅ **Clarity**: Permissions are explicitly defined and easy to audit
- ✅ **Flexibility**: Policy layer handles complex ownership scenarios
- ⚠️ **Verbosity**: More middleware/policy files than simple inline checks
- ⚠️ **Performance**: Multiple middleware calls per request (negligible in practice)

**Alternatives Considered**:
- **Casbin**: Powerful policy engine but adds dependency and complexity
- **ACL (row-level security)**: Database-level enforcement; rejected as it ties security to persistence layer

**Security Note**: The policy layer prevents horizontal privilege escalation by filtering queries based on user ownership.

---

### 1.3 Authentication: JWT (JSON Web Tokens)

**Decision**: Stateless JWT authentication with 7-day expiration.

**Rationale**:
- Stateless - no session store required, scales horizontally easily
- Client-side storage simplifies implementation
- Standard, well-understood protocol with many libraries
- Can contain user metadata (role, id) to avoid database lookups

**Trade-offs**:
- ✅ **Scalability**: No shared session store needed across server instances
- ✅ **Performance**: No database query on every request if token contains all needed data
- ⚠️ **Token Revocation**: Requires blacklist or short expiration; current 7-day window is a risk window
- ⚠️ **Storage**: localStorage vulnerable to XSS; could use httpOnly cookies instead
- ⚠️ **Size**: Tokens sent on every request increase bandwidth

**Alternatives Considered**:
- **Session-based**: Requires Redis/session store; rejected for simplicity
- **OAuth 2.0**: Overkill for single-app use case
- **Refresh Tokens**: Not implemented yet but planned for future

**Future Improvement**: Implement refresh token rotation with secure httpOnly cookies for better XSS protection.

---

### 1.4 Authorization Model: Hybrid Approach

**Decision**: Combination of:
- Role-based guards for coarse-grained control
- Ownership checks in policies for fine-grained control
- Query filtering to enforce data isolation

**Rationale**:
- Simple roles cover most scenarios
- Ownership checks prevent data leakage between users
- Query-level filtering (in `filterRecordsByPermission`) ensures database queries respect permissions

**Trade-offs**:
- ✅ **Secure by default**: Hard to accidentally expose another user's data
- ✅ **Flexible**: Can handle both "admin sees all" and "user sees own" patterns
- ⚠️ **Complexity**: Multiple places where permissions are enforced

**Example**: In `financialRecordPolicy.js`, `canAccessRecord` checks both ownership and role. `filterRecordsByPermission` modifies Mongoose queries to automatically filter by `createdBy` for non-admins.

---

### 1.5 Database: MongoDB

**Decision**: Document database with Mongoose ODM.

**Rationale**:
- JSON documents naturally map to JavaScript objects
- Schema flexibility for future feature additions
- Powerful aggregation pipeline for dashboard analytics
- No impedance mismatch like ORMs with relational databases

**Trade-offs**:
- ✅ **Aggregation**: MongoDB's aggregation framework is perfect for financial summaries
- ✅ **Flexibility**: Easy to add new fields without migrations
- ✅ **Performance**: Document model fits single-user financial records well
- ⚠️ **No Joins**: Must handle relationships in application code (e.g., populating user for record)
- ⚠️ **Transactions**: Multi-document ACID transactions available but added complexity; not needed for this use case
- ⚠️ **Referential Integrity**: Application must maintain consistency

**Indexing Strategy**:
- Single-field indexes on frequently queried fields (`email`, `role`, `status`, `createdBy`, `date`, `category`, `type`)
- Compound index `{createdBy: 1, date: -1}` for common query pattern (user's recent records)
- `isDeleted` index for soft-delete filtering
- Indexes support both queries and sorts

**Alternatives Considered**:
- **PostgreSQL**: Strong consistency, ACID transactions, but requires explicit schema migrations; rejected as no need for complex joins
- **SQLite**: Too limited for scaling; rejected

---

### 1.6 Aggregation Pipelines for Analytics

**Decision**: Use MongoDB aggregation framework instead of fetching raw data and calculating in JavaScript.

**Rationale**:
- Database-level aggregation leverages MongoDB's optimization
- Reduces network transfer (only aggregated results sent)
- Single query replaces multiple round-trips

**Trade-offs**:
- ✅ **Performance**: Database does heavy lifting, transfers less data
- ✅ **Atomicity**: Aggregation runs on consistent snapshot
- ⚠️ **Complexity**: Aggregation pipelines can be harder to debug than application code
- ⚠️ **Flexibility**: Application must transform results into UI-friendly format (see `dashboardService.js` monthly trends transformation)

**Implementation**: `dashboardService.js` uses multi-stage pipelines:
- `getDashboardSummary`: `$match` → `$group` → calculate net balance
- `getCategoryWiseSummary`: `$match` → `$group` → `$sort` → `$limit`
- `getMonthlyTrends`: `$match` → `$group` (by year/month/type) → `$sort` → fill missing months in JS

---

### 1.7 Soft Deletes

**Decision**: Use `isDeleted` boolean flag instead of actual document deletion.

**Rationale**:
- Preserve audit trail for compliance
- Allow data recovery
- Maintain referential integrity (deleted records still reference users)

**Implementation**:
- All queries filter `{isDeleted: false}` automatically via policy layer
- Delete endpoint sets `isDeleted: true`
- MongoDB provides efficient filtering with index on `isDeleted`

**Trade-offs**:
- ✅ **Auditing**: Can track what was deleted and when via `createdAt`/`updatedAt`
- ⚠️ **Storage**: Database grows over time; requires archival strategy eventually
- ⚠️ **Query Complexity**: Must remember to filter out deleted records everywhere

**Future**: Implement periodic archival of old deleted records to cold storage.

---

### 1.8 Password Security

**Decision**: bcryptjs with 10 salt rounds.

**Rationale**:
- Industry standard for password hashing
- Adaptive work factor can be increased in future
- Pre-save middleware ensures all passwords are hashed

**Trade-offs**:
- ✅ **Secure**: Resistant to rainbow table attacks
- ⚠️ **Performance**: Hashing is intentionally slow (10 rounds ≈ 100ms); acceptable for registration/login
- ⚠️ **Future-Proofing**: May need to increase salt rounds as hardware improves

**Implementation**: `User.js` schema pre-save hook only hashes if password is modified. Model method `comparePassword` for login verification.

---

### 1.9 Input Validation

**Decision**: express-validator library for request validation.

**Rationale**:
- Declarative validation rules
- Built-in sanitization
- Standard in Express ecosystem

**Trade-offs**:
- ✅ **Security**: Prevents malformed data and injection attacks
- ✅ **Consistency**: Validation errors return standard format
- ⚠️ **Duplication**: Some validation rules duplicated in Mongoose schema; slight DRY violation but acceptable as defense in depth

**Future**: Consider schema validation at both layers (Express for HTTP errors, Mongoose for data integrity).

---

### 1.10 Error Handling: Centralized Middleware

**Decision**: Single `errorHandler` middleware as final Express middleware.

**Rationale**:
- Consistent JSON error response format across API
- Catch all errors from async operations
- Map different error types to appropriate HTTP status codes

**Trade-offs**:
- ✅ **Consistency**: All errors formatted identically
- ✅ **Maintainability**: One place to update error format
- ⚠️ **Loss of Stack Traces**: Production should log but not expose stack traces (currently implemented conditionally)

---

## 2. Frontend Architecture

### 2.1 State Management: React Context

**Decision**: Use React Context API (`AuthContext`) for global authentication state instead of Redux or Zustand.

**Rationale**:
- Only global state needed is authentication (user, token, role)
- No complex state transitions or middleware needed
- Avoids heavy dependencies for simple use case
- React 18 Context is performant enough for this scope

**Trade-offs**:
- ✅ **Simplicity**: No Redux boilerplate, easy to understand
- ✅ **Bundle Size**: Smaller than Redux Toolkit
- ⚠️ **Re-renders**: All context consumers re-render on any change (not an issue with only 3-4 consumers)
- ⚠️ **Scalability**: Would need to split context or move to Redux if app grows significantly

**Alternatives Considered**:
- **Redux Toolkit**: Overkill for auth-only global state
- **Zustand**: Good alternative but adds dependency
- **Local Storage Direct**: Would require manual syncing; Context provides reactive updates

---

### 2.2 API Client: Axios with Interceptors

**Decision**: Custom Axios instance with request/response interceptors.

**Request Interceptor**:
- Automatically attaches JWT token from localStorage to Authorization header
- No need to manually add token to every request

**Response Interceptor**:
- Centralized error handling
- Automatic toast notifications for common errors
- Auto-logout on 401 (session expiry)

**Rationale**:
- DRY - token injection automatic
- Central error handling reduces boilerplate in components
- Toast feedback improves UX

**Trade-offs**:
- ✅ **Maintainability**: One place for auth headers and error handling
- ✅ **UX**: User gets immediate feedback without manual error handling in each component
- ⚠️ **localStorage Vulnerability**: Token stored in localStorage accessible to XSS; consider httpOnly cookies in production
- ⚠️ **Hard-coded URLs**: API base URL is hard-coded; could use environment variables more

**Implementation**: `frontend/src/services/api.js`

---

### 2.3 Routing: React Router v6

**Decision**: Client-side routing with `PrivateRoute` wrapper for protected pages.

**Rationale**:
- SPA experience without page reloads
- Standard React routing library
- Nested routes for layout persistence

**PrivateRoute Pattern**:
- Checks auth status via `useAuth()`
- Redirects to login if not authenticated
- Preserves intended destination via location state (potential future enhancement)

**Trade-offs**:
- ✅ **UX**: Fast navigation, preserves app state
- ✅ **Flexibility**: Easy to add more protected routes
- ⚠️ **Client-Side Security**: Routes are client-protected only; backend must still enforce permissions (defense in depth)
- ⚠️ **SEO**: Client-side routing has poorer SEO than server-side; not critical for dashboard

---

### 2.4 Styling: Tailwind CSS

**Decision**: Utility-first CSS framework over traditional CSS or component libraries (Material-UI, Bootstrap).

**Rationale**:
- Rapid prototyping with built-in responsive utilities
- No need to write custom CSS classes
- Small bundle size with purging (production)
- Custom design system without being locked into component library's aesthetics

**Trade-offs**:
- ✅ **Speed**: Fast UI development with utility classes
- ✅ **Consistency**: Design tokens (colors, spacing) enforced through class names
- ⚠️ **HTML Bloat**: Utility classes can make JSX verbose ("utility-first" means long class strings)
- ⚠️ **Learning Curve**: Must learn Tailwind class naming convention
- ⚠️ **Dynamic Styles**: Can't easily compute classes conditionally without framework utilities (handled with `classnames` or template literals)

**Configuration**: `tailwind.config.js` extends default theme with custom colors.

---

### 2.5 Animations: Framer Motion

**Decision**: Declarative animation library for page transitions and micro-interactions.

**Rationale**:
- Simple API with `<motion.div>` components
- Built-in gestures (hover, tap, drag) if needed later
- Production-ready with good performance

**Trade-offs**:
- ✅ **UX**: Smooth transitions improve perceived quality
- ✅ **Ease of Use**: Less code than CSS animations or React Spring
- ⚠️ **Bundle Size**: Adds ~40KB; acceptable for dashboard
- ⚠️ **Overkill?**: Could use CSS transitions for simple effects, but Framer Motion provides consistency

**Usage**: Currently used for page transitions in `Layout.jsx`.

---

### 2.6 Build Tool: Vite

**Decision**: Modern build dev server over Create React App or Webpack.

**Rationale**:
- Lightning-fast HMR (Hot Module Replacement)
- Native ESM support without bundling in development
- Simple configuration
- Vue/React/vanilla support (flexible)

**Trade-offs**:
- ✅ **Speed**: Development startup in milliseconds vs seconds
- ✅ **Modern**: Uses latest ES features, no transpilation needed in dev
- ⚠️ **Maturity**: Smaller ecosystem than Webpack but sufficient for this project
- ⚠️ **Plugin Compatibility**: Some Webpack plugins don't have Vite equivalents (not an issue here)

**Configuration**: `vite.config.js` includes proxy to avoid CORS in development (`/api` → `http://localhost:5000`).

---

## 3. Security Considerations

### 3.1 Defense in Depth

The application implements security at multiple layers:

1. **Input Validation** (express-validator): Sanitizes incoming data
2. **Authentication** (JWT): Verifies user identity
3. **Authorization** (RBAC + Policies): Controls actions and data access
4. **Query Filtering**: Prevents horizontal privilege escalation
5. **Soft Deletes**: Preserves data for audit

### 3.2 Known Security Limitations

**XSS Risk**: JWT stored in `localStorage` accessible to any script.
- **Mitigation**: Content Security Policy headers (could add Helmet.js)
- **Future**: Move to httpOnly cookies + CSRF tokens

**JWT Theft**: No token blacklisting; stolen token valid until expiry (7 days).
- **Mitigation**: Short expiration, HTTPS required in production
- **Future**: Implement refresh token rotation

**Injection**: Mongoose prevents NoSQL injection, but user input in aggregation?
- **Mitigation**: Aggregation pipeline built from trusted filter values; validate date inputs
- **Future**: Strict schema validation with Joi or Zod

### 3.3 Missing Security Features (Planned)

- Rate limiting (prevent brute force)
- Helmet.js security headers
- Request logging for audit trail
- CSRF protection (less needed with JWT but still relevant for state-changing ops)
- Refresh token mechanism

---

## 4. Data Management

### 4.1 Soft Delete Pattern

**Why**: Audit trail requirement. All `delete` operations set `isDeleted = true`.

**Implementation**:
- Mongoose query helpers could be added to auto-filter deleted
- Currently explicit in policies and service queries
- Index on `isDeleted` for performance

### 4.2 Pagination Strategy

**Decision**: Skip/limit pagination for simplicity.

**Rationale**: 
- User count expected to be low (< 1000 records)
- Skip/limit easy to implement

**Trade-offs**:
- ✅ **Simple**: One line of code (`.skip().limit()`)
- ⚠️ **Performance**: Deep pagination becomes slow; for >10k records need cursor-based pagination

**Future**: Implement cursor-based pagination with `_id` or `createdAt` cursors.

---

## 5. Performance Considerations

### 5.1 Database Indexes

**Strategy**: Index on all fields used in queries and sorts:
- `{email: 1}` - User lookup by email
- `{role: 1}`, `{status: 1}` - User filtering
- `{createdBy: 1}` - Get user's records
- `{date: -1}` - Sort by date descending
- `{category: 1}`, `{type: 1}` - Aggregation grouping
- `{isDeleted: 1}` - Filter deleted records
- `{createdBy: 1, date: -1}` - User's recent records (compound index)

**Monitor**: Use `explain()` on aggregation queries to verify index usage.

### 5.2 Aggregation Performance

Dashboard aggregations could become slow with millions of records.
- Current design: Real-time aggregation on demand
- Future: Redis caching with TTL (e.g., 5 minutes) for summary endpoints

---

## 6. Development Experience

### 6.1 Hot Reload

- Backend: `nodemon` restarts on file changes
- Frontend: Vite HMR updates modules without full reload

**Benefit**: Fast feedback loop during development.

### 6.2 Environment Configuration

- `.env` files for both backend and frontend
- 12-factor app approach (config via environment)
- Sensitive keys (JWT_SECRET, MONGODB_URI) kept out of version control

---

## 7. Testing Strategy (Current Gaps)

**Current Status**: Minimal testing (placeholder in package.json).

**Recommended Approach**:
1. **Unit Tests**: Services and utilities with Jest; mock Mongoose models
2. **Integration Tests**: API endpoints with Supertest against in-memory MongoDB (or test database)
3. **E2E Tests**: Cypress or Playwright for critical user flows (login, create record, view dashboard)
4. **Policy Tests**: Verify RBAC logic in isolation

**Why Important**: RBAC logic is critical; tests prevent privilege escalation bugs.

---

## 8. Deployment Considerations

### 8.1 Monorepo vs Separate Repos

**Decision**: Single repository with `backend/` and `frontend/` directories.

**Rationale**:
- Single `git` repository simplifies coordination
- Easier to make cross-cutting changes
- CI/CD can deploy both together

**Trade-offs**:
- ✅ **Simplicity**: One repo to rule them all
- ⚠️ **Coupling**: Frontend and backend version together; could be issue if deploying independently
- For this project scope, monorepo is appropriate

### 8.2 Containerization (Future)

**Recommendation**: Dockerize both apps with docker-compose for consistent deployment.

**Benefits**:
- Consistent environments across dev/prod
- Easy scaling of backend instances
- MongoDB can be containerized too

---

## 9. Assumptions & Constraints

See README.md "Assumptions Made" section for full list.

**Key Assumptions**:
- Only admins create financial records (segregation of duties)
- Single currency (USD)
- Single organization (no multi-tenancy)
- No file uploads
- Soft delete required for audit

**Constraints**:
- Built for educational/small business use case
- Not designed for high-frequency trading or real-time stock tracking
- Performance adequate for ≤ 10,000 records

---

## 10. Future Improvements - Prioritized

### High Priority
1. **Refresh Tokens** - Better security than long-lived JWTs
2. **Rate Limiting** - Prevent brute force attacks
3. **Input Sanitization** - Helmet.js, stricter validation
4. **Unit Tests** - Cover critical RBAC logic

### Medium Priority
5. **Redis Caching** - Dashboard performance
6. **Cursor Pagination** - For large datasets
7. **GraphQL** - For flexible frontend queries (optional)
8. **Audit Logging** - Winston logger with MongoDB persistence

### Low Priority / Nice to Have
9. **Chart Library** - Recharts for visual dashboard
10. **Export Features** - CSV/PDF reports
11. **Multi-currency** - With exchange rate service
12. **Offline Support** - Service Workers (PWA)
13. **Real-time** - WebSocket notifications

---

## 11. Lessons Learned

1. **Policies are powerful**: Centralizing authorization logic in `policies/` made it easy to audit and modify permissions. Much better than scattering checks across controllers.

2. **Aggregation beats Application Logic**: Letting MongoDB compute summaries is faster and uses less network bandwidth. However, transformation logic in JS is still needed for UI formatting.

3. **Context over Redux**: For simple auth state, React Context is sufficient and reduces boilerplate. Don't over-engineer state management.

4. **Proxy is Your Friend**: Vite proxy eliminates CORS headaches in development. Keep backend and frontend on different ports but transparent proxy.

5. **Index Everything You Query**: Early indexing prevents performance issues later. Analyze slow queries with `explain()`.

---

## 12. Comparison Table: Decision Summary

| Decision | Chosen | Alternative | Trade-off |
|----------|--------|-------------|-----------|
| **Backend Framework** | Express.js | Fastify | Express more mature, easier to find solutions |
| **Database** | MongoDB | PostgreSQL | Flexibility vs strict schema; chosen for JSON docs & aggregation |
| **Auth** | JWT | Sessions | Stateless vs stateful; JWT scales easier but harder to revoke |
| **Frontend State** | Context API | Redux Toolkit | Simplicity vs scalability; Context sufficient for auth-only |
| **Styling** | Tailwind CSS | MUI | Custom design vs pre-built components; Tailwind more flexible |
| **RBAC** | Custom policies | Casbin | Simple matrix vs advanced policies; custom is sufficient |
| **Build Tool** | Vite | CRA | Speed vs familiarity; Vite faster but newer |
| **API Client** | Axios | Fetch | Interceptors convenience vs native; Axios better middleware support |
| **Architecture** | Layered | Fat Controllers | More files vs simplicity; layered pays off in maintainability |

---

## Conclusion

The chosen stack prioritizes:
- **Developer Experience**: Fast tooling (Vite, HMR), clear architecture
- **Security**: Defense in depth, RBAC, input validation
- **Maintainability**: Layered separation, Context API, Tailwind utilities
- **Performance**: Database indexes, aggregation pipelines, query optimization

The trade-offs are acceptable for the project's scope (small to medium finance tracking). As the application grows, specific areas (caching, testing, advanced auth) can be incrementally improved without architectural overhaul.

The modular design allows swapping components (e.g., MongoDB → PostgreSQL, Context → Redux) with moderate effort due to clear layer boundaries.
