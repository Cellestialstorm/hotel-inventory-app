# Hotel Inventory Management System - Parallel Development Plan

**Project Duration:** October 19 - December 1, 2025 (43 days / 6 weeks)
**Team Size:** 7 Members working in parallel
**Strategy:** Maximum parallelization with clear boundaries and minimal dependencies

---

## 🎯 Team Assignment Strategy

### **Phase 1 (Week 1-2): Foundation - Oct 19 to Nov 1**

All members work on independent foundational modules

### **Phase 2 (Week 3-4): Core Features - Nov 2 to Nov 15**

Integration begins, members continue on separate features

### **Phase 3 (Week 5): Advanced Features - Nov 16 to Nov 22**

Advanced functionality and cross-team integration

### **Phase 4 (Week 6): Integration & Launch - Nov 23 to Dec 1**

Testing, bug fixes, and deployment

---

## 👥 Rohan Sharma: DevOps & Infrastructure Lead

**Focus:** Project setup, database, deployment, CI/CD, and coordination

### **WEEK 1 (Oct 19-25): Infrastructure Setup**

#### **Day 1-2: Complete Project Setup** ⏰ 2 days

- Initialize Git repository with complete directory structure
- Set up all package.json files for monorepo
- Configure TypeScript for all packages
- Set up ESLint, Prettier configurations
- Create comprehensive README.md with setup instructions
- **Deliverable:** Team can clone and run `yarn install` successfully

#### **Day 3-4: Database & Shared Package** ⏰ 2 days

- Set up MongoDB Atlas cluster (or local instance)
- Create database connection module (packages/server/src/config/database.ts)
- Define ALL TypeScript interfaces in shared package:
  ```typescript
  // packages/shared/src/types/
  - user.types.ts
  - hotel.types.ts
  - department.types.ts
  - inventory.types.ts
  - transaction.types.ts
  - report.types.ts
  - api.types.ts (request/response types)
  ```
- Define enums (UserRole, TransactionType, Status)
- Build shared package: `yarn workspace @hotel-inventory/shared build`
- **Deliverable:** Shared package ready for import by other members

#### **Day 5: Environment Configuration** ⏰ 1 day

- Create .env.example for client and server
- Document all environment variables
- Set up environment validation
- Create setup script for easy onboarding
- **Deliverable:** Environment configuration guide

### **WEEK 2 (Oct 26-Nov 1): CI/CD & Monitoring**

#### **Day 1-3: CI/CD Pipeline** ⏰ 3 days

- Set up GitHub Actions or GitLab CI
- Create workflows:
  - Automated linting on PR
  - TypeScript type checking
  - Build verification
  - Test runner (when tests added)
- Configure branch protection (main/develop)
- Set up code review requirements
- **Deliverable:** Working CI/CD pipeline

#### **Day 4-5: Deployment Infrastructure** ⏰ 2 days

- Set up staging environment:
  - Backend on Railway/Render/DigitalOcean
  - Frontend on Vercel/Netlify
- Configure production environment variables
- Set up SSL certificates
- Create deployment scripts
- **Deliverable:** Staging environment URL

### **WEEK 3-4 (Nov 2-15): API Documentation & Monitoring**

#### **Ongoing: Team Support** ⏰ Daily

- Daily standup coordination (15 min)
- Resolve merge conflicts
- Code review for all PRs
- Monitor CI/CD pipeline
- Help unblock team members

#### **Day 1-3: API Documentation** ⏰ 3 days

- Create comprehensive API documentation (docs/API.md)
- Document all endpoints from Members 2 & 3
- Include request/response examples
- Document error codes
- **Deliverable:** Complete API docs

#### **Day 4-5: Monitoring Setup** ⏰ 2 days

- Set up error logging (Winston configuration)
- Add health check endpoints
- Set up basic monitoring dashboard
- Configure alerts for errors
- **Deliverable:** Monitoring system

### **WEEK 5 (Nov 16-22): Performance & Security**

#### **Day 1-3: Performance Optimization** ⏰ 3 days

- Database indexing optimization
- Implement caching strategy (Redis if needed)
- Backend response time optimization
- Frontend bundle optimization
- **Deliverable:** Performance improvements

#### **Day 4-5: Security Audit** ⏰ 2 days

- Security review of authentication
- API rate limiting
- Input validation review
- CORS configuration review
- **Deliverable:** Security audit report

### **WEEK 6 (Nov 23-Dec 1): Final Deployment**

#### **Day 1-5: Production Launch** ⏰ 5 days

- Final integration testing
- Production deployment
- Database migration to production
- Monitor for errors
- Create incident response plan
- **Deliverable:** Live production system

---

## 🔐 Pratik Chettri: Authentication & User Management (Backend)

**Focus:** Complete authentication system and user/role management

### **WEEK 1 (Oct 19-25): Authentication Foundation**

#### **Day 1-2: User Model & Auth Utils** ⏰ 2 days

- Create User model (models/User.model.ts):
  ```typescript
  - userId, username, password (hashed)
  - role (ADMIN, MANAGER, STAFF)
  - assignedHotelId, assignedDepartmentId
  - isActive, createdAt, updatedAt
  - Pre-save hook for password hashing
  - comparePassword() method
  ```
- Create JWT utilities (utils/jwt.util.ts):
  - generateAccessToken()
  - generateRefreshToken()
  - verifyToken()
- Create bcrypt utilities (utils/bcrypt.util.ts)
- **Deliverable:** User model and auth utilities

#### **Day 3-4: Authentication Service & Middleware** ⏰ 2 days

- Create auth.service.ts:
  - login(username, password)
  - refreshToken(refreshToken)
  - changePassword(userId, oldPassword, newPassword)
  - validateToken(token)
- Create middleware/auth.middleware.ts:
  - authenticateToken() - Extract and verify JWT
  - Attach user to req.user
- Create middleware/roleCheck.middleware.ts:
  - checkRole(['ADMIN', 'MANAGER'])
  - checkAdminOnly()
- **Deliverable:** Auth service and middleware

#### **Day 5: Auth API Endpoints** ⏰ 1 day

- Create auth.controller.ts:
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/refresh-token
  - PUT /api/auth/change-password
  - GET /api/auth/me (get current user)
- Create auth.routes.ts
- Add rate limiting to auth routes
- Test with Postman
- **Deliverable:** Working auth API

### **WEEK 2 (Oct 26-Nov 1): User Management**

#### **Day 1-2: User Service** ⏰ 2 days

- Create user.service.ts:
  - createUser(userData) - Admin only
  - updateUser(userId, userData)
  - deleteUser(userId) - Soft delete
  - getUserById(userId)
  - getAllUsers(filters, pagination)
  - getUsersByHotel(hotelId)
  - getUsersByDepartment(deptId)
  - assignUserToHotelDept(userId, hotelId, deptId)
- Add input validation
- Add error handling
- **Deliverable:** User management service

#### **Day 3-4: User API Endpoints** ⏰ 2 days

- Create user.controller.ts:
  - POST /api/users (admin only)
  - GET /api/users (with filters & pagination)
  - GET /api/users/:id
  - PUT /api/users/:id (admin only)
  - DELETE /api/users/:id (admin only)
  - PUT /api/users/:id/assign (assign hotel/dept)
- Create user.routes.ts
- Add validation middleware
- Apply role-based access control
- **Deliverable:** User management API

#### **Day 5: Testing & Documentation** ⏰ 1 day

- Test all auth and user endpoints
- Create Postman collection
- Document API endpoints
- Fix any bugs
- **Deliverable:** Tested auth system

### **WEEK 3 (Nov 2-8): Hotel & Department Management**

#### **Day 1-2: Models & Services** ⏰ 2 days

- Create Hotel model (models/Hotel.model.ts)
- Create Department model (models/Department.model.ts)
- Create hotel.service.ts:
  - createHotel(), updateHotel(), deleteHotel()
  - getAllHotels(), getHotelById()
- Create department.service.ts:
  - createDepartment(), updateDepartment(), deleteDepartment()
  - getDepartmentsByHotel(), getDepartmentById()
- **Deliverable:** Hotel/Department services

#### **Day 3-4: API Endpoints** ⏰ 2 days

- Create hotel.controller.ts & hotel.routes.ts:
  - POST /api/hotels (admin)
  - GET /api/hotels
  - GET /api/hotels/:id
  - PUT /api/hotels/:id (admin)
  - DELETE /api/hotels/:id (admin)
- Create department.controller.ts & department.routes.ts:
  - POST /api/departments (admin)
  - GET /api/departments
  - GET /api/departments/hotel/:hotelId
  - PUT /api/departments/:id (admin)
  - DELETE /api/departments/:id (admin)
- **Deliverable:** Hotel/Department APIs

#### **Day 5: Integration & Testing** ⏰ 1 day

- Integrate all routes in routes/index.ts
- Test complete user management flow
- Test hotel/department CRUD
- **Deliverable:** Complete user/hotel/dept system

### **WEEK 4-6 (Nov 9-Dec 1): Support & Refinement**

#### **Ongoing Tasks:**

- Code review for Member 3's work
- Support frontend integration (Member 4)
- Add unit tests for auth system
- Bug fixes and optimizations
- Add missing features based on feedback
- **Deliverable:** Stable backend auth system

---

## 📦 Solan Gurung: Inventory & Transactions (Backend)

**Focus:** Complete inventory logic, transactions, and stock calculations

### **WEEK 1 (Oct 19-25): Inventory Models**

#### **Day 1-2: Item Model** ⏰ 2 days

- Create Item model (models/Item.model.ts):
  ```typescript
  - itemId, itemName, itemCode
  - category, unit (kg, liters, pieces)
  - hotelId, departmentId
  - minimumStock
  - isActive
  - Compound index: hotelId + departmentId + itemCode
  ```
- Add validation rules
- Add duplicate check methods
- **Deliverable:** Item model

#### **Day 3-5: Transaction Model** ⏰ 3 days

- Create Transaction model (models/Transaction.model.ts):
  ```typescript
  - transactionId, itemId
  - hotelId, departmentId
  - transactionType (enum: 8 types)
  - quantity (+/-)
  - fromHotelId, fromDepartmentId
  - toHotelId, toDepartmentId
  - notes, performedBy
  - transactionDate
  - Validation based on type
  ```
- Create InventorySnapshot model (for daily snapshots)
- **Deliverable:** Transaction and Snapshot models

### **WEEK 2 (Oct 26-Nov 1): Stock Calculation Engine**

#### **Day 1-3: Stock Calculation Service** ⏰ 3 days

- Create stockCalculation.service.ts:
  ```typescript
  - calculateClosingBalance(itemId, date)
    Formula: A + B - C - D + E - F + G - H
    A = Opening Balance
    B = Added
    C = Returned to Vendor
    D = Damages
    E = Transfer IN (Dept)
    F = Transfer OUT (Dept)
    G = Transfer IN (Hotel)
    H = Transfer OUT (Hotel)
  - getCurrentStock(itemId)
  - getOpeningBalance(itemId, date)
  - getStockForDateRange(itemId, startDate, endDate)
  - calculateAllItemsStock(hotelId, deptId)
  - identifyReorderItems(hotelId, deptId)
  ```
- Optimize with MongoDB aggregation
- Add caching for performance
- **Deliverable:** Stock calculation engine

#### **Day 4-5: Inventory Service** ⏰ 2 days

- Create inventory.service.ts:
  - createItem(itemData)
  - updateItem(itemId, data)
  - deleteItem(itemId)
  - getItemById(itemId)
  - getItemsByDepartment(hotelId, deptId, filters)
  - searchItems(query)
  - checkDuplicateItemCode(hotelId, deptId, itemCode)
- Add validation
- **Deliverable:** Inventory management service

### **WEEK 3 (Nov 2-8): Transaction System**

#### **Day 1-4: Transaction Service** ⏰ 4 days

- Create transaction.service.ts:
  ```typescript
  - recordTransaction(transactionData) - Master function
  - recordOpeningBalance(itemId, quantity, date)
  - recordAddedStock(itemId, quantity, date, notes)
  - recordReturnToVendor(itemId, quantity, date, notes)
  - recordDamage(itemId, quantity, date, reason)
  - recordInterDepartmentTransfer(itemId, quantity, fromDept, toDept)
    * Creates TWO transactions (OUT + IN)
  - recordInterHotelTransfer(itemId, quantity, fromHotel, toHotel, toDept)
    * Creates TWO transactions (OUT + IN)
  - validateTransfer(itemId, quantity) - Check sufficient stock
  - getTransactionHistory(itemId, dateRange)
  - cancelTransaction(transactionId) - Admin only, reverse entry
  ```
- Implement transaction atomicity (use MongoDB sessions for transfers)
- Add rollback on failure
- **Deliverable:** Complete transaction system

#### **Day 5: Snapshot Service** ⏰ 1 day

- Create snapshot service to generate daily closing balances
- Create cron job setup for automated snapshots
- Improves report performance
- **Deliverable:** Snapshot system

### **WEEK 4 (Nov 9-15): API Endpoints**

#### **Day 1-3: Inventory API** ⏰ 3 days

- Create inventory.controller.ts:
  - POST /api/inventory/items
  - GET /api/inventory/items (with filters, pagination, search)
  - GET /api/inventory/items/:id
  - PUT /api/inventory/items/:id
  - DELETE /api/inventory/items/:id
  - GET /api/inventory/items/department/:deptId
  - GET /api/inventory/stock/:itemId - Current stock
  - GET /api/inventory/stock/:itemId/history - Stock over time
  - GET /api/inventory/reorder/:hotelId/:deptId - Reorder items
- Create inventory.routes.ts
- **Deliverable:** Inventory API

#### **Day 4-5: Transaction API** ⏰ 2 days

- Create transaction.controller.ts:
  - POST /api/transactions/opening-balance
  - POST /api/transactions/add-stock
  - POST /api/transactions/return-vendor
  - POST /api/transactions/damage
  - POST /api/transactions/transfer-department
  - POST /api/transactions/transfer-hotel
  - GET /api/transactions/item/:itemId
  - GET /api/transactions/department/:deptId
  - DELETE /api/transactions/:id (admin only)
- Create transaction.routes.ts
- **Deliverable:** Transaction API

### **WEEK 5 (Nov 16-22): Reporting System**

#### **Day 1-4: Report Service** ⏰ 4 days

- Create report.service.ts:
  ```typescript
  - generateStockReport(hotelId, deptId, date)
    Returns: All items with A, B, C, D, E, F, G, H, Closing Balance
  - generateStockReportDateRange(hotelId, deptId, startDate, endDate)
  - generateItemDetailReport(itemId, startDate, endDate)
    Transaction-by-transaction history
  - generateReorderReport(hotelId, deptId)
    Items where current stock < minimum stock
  - generateConsumptionReport(hotelId, deptId, startDate, endDate)
    Usage analysis and trends
  - generateTransferReport(hotelId, startDate, endDate)
    All inter-dept and inter-hotel transfers
  ```
- Use MongoDB aggregation for performance
- Implement report caching
- **Deliverable:** Reporting engine

#### **Day 5: Report API** ⏰ 1 day

- Create report.controller.ts:
  - GET /api/reports/stock
  - GET /api/reports/stock/item/:itemId
  - GET /api/reports/reorder
  - GET /api/reports/consumption
  - GET /api/reports/transfers
- Create report.routes.ts
- **Deliverable:** Report API

### **WEEK 6 (Nov 23-Dec 1): Testing & Optimization**

#### **Day 1-5: Final Testing** ⏰ 5 days

- Test all inventory operations
- Test all transaction types
- Test stock calculation accuracy
- Test report generation
- Performance optimization
- Bug fixes
- **Deliverable:** Production-ready inventory system

---

## 🎨 Prajal Bhattarai: Frontend Foundation & Authentication

**Focus:** React setup, routing, layout, authentication UI, state management

### **WEEK 1 (Oct 19-25): Frontend Foundation**

#### **Day 1-2: React & Vite Setup** ⏰ 2 days

- Set up Vite + React + TypeScript
- Configure vite.config.ts (paths, proxy)
- Install and configure Tailwind CSS
- Create base folder structure
- Set up path aliases
- **Deliverable:** React app running on localhost:3000

#### **Day 2-3: Routing & Layout** ⏰ 2 days

- Install React Router v6
- Create route structure:
  ```typescript
  / -> Redirect based on auth
  /login -> LoginPage
  /dashboard -> DashboardPage (protected)
  /inventory -> InventoryPage (protected)
  /reports -> ReportsPage (protected)
  /admin -> AdminPage (protected, admin only)
  ```
- Create ProtectedRoute component
- Create layout components:
  - layout/Navbar.tsx (logo, user menu, selectors)
  - layout/Sidebar.tsx (navigation links)
  - layout/Footer.tsx
- **Deliverable:** Layout and routing system

#### **Day 4-5: State Management** ⏰ 2 days

- Set up Redux Toolkit
- Create store structure
- Create slices:
  - authSlice (user, token, isAuthenticated)
  - hotelSlice (selectedHotel, selectedDepartment, lists)
  - uiSlice (loading, notifications, modals)
- Create typed hooks (useAppDispatch, useAppSelector)
- **Deliverable:** Redux store configured

### **WEEK 2 (Oct 26-Nov 1): Common Components & API Setup**

#### **Day 1-3: Common UI Components** ⏰ 3 days

- Create components/common/:
  - Button (variants: primary, secondary, danger)
  - Input (text, number, date, select)
  - Table (sortable, paginated, with column toggle)
  - Modal (reusable wrapper)
  - Alert (success, error, warning, info)
  - Loader/Spinner
  - FormField (label + input + error)
- Style with Tailwind
- Make responsive
- **Deliverable:** Component library

#### **Day 4-5: API Service Layer** ⏰ 2 days

- Create services/api.ts:
  - Axios instance with interceptors
  - Request interceptor (add auth token)
  - Response interceptor (handle errors)
  - Token refresh on 401
- Create services/authService.ts:
  - login(username, password)
  - logout()
  - refreshToken()
  - getCurrentUser()
  - changePassword()
- **Deliverable:** API service layer

### **WEEK 3 (Nov 2-8): Authentication UI**

#### **Day 1-3: Login Page** ⏰ 3 days

- Create pages/LoginPage.tsx
- Create components/auth/LoginForm.tsx:
  - Username and password fields
  - Form validation (react-hook-form + zod)
  - Loading state
  - Error display
  - Remember me checkbox
  - Password visibility toggle
- Integrate with authService
- Handle login success (store token, redirect)
- **Deliverable:** Working login page

#### **Day 4-5: Hotel/Department Selectors** ⏰ 2 days

- Create components/selectors/HotelSelector.tsx:
  - Dropdown to select hotel
  - Fetch from API
  - Store in Redux
  - Persist in localStorage
- Create components/selectors/DepartmentSelector.tsx:
  - Filter by selected hotel
  - Store in Redux
- Integrate into Navbar
- **Deliverable:** Hotel/Department selection system

### **WEEK 4 (Nov 9-15): Dashboard Foundation**

#### **Day 1-3: Dashboard Widgets** ⏰ 3 days

- Create components/dashboard/DashboardWidget.tsx (reusable container)
- Create components/dashboard/StockSummary.tsx:
  - Total items, stock value, categories
  - Simple charts (Recharts)
- Create components/dashboard/UrgentReorderWidget.tsx:
  - Table of items below minimum
  - Highlight in red
  - Show shortage amount
  - Sort by urgency
- **Deliverable:** Dashboard widgets

#### **Day 4-5: Dashboard Page** ⏰ 2 days

- Create pages/DashboardPage.tsx:
  - Grid layout for widgets
  - Quick stats cards
  - Responsive design
- Create services/inventoryService.ts:
  - getStockSummary()
  - getReorderItems()
- Connect to API
- **Deliverable:** Working dashboard

### **WEEK 5 (Nov 16-22): Advanced Features**

#### **Day 1-3: Notification System** ⏰ 3 days

- Create components/common/Notification.tsx (toast)
- Create notification context/hook
- Integrate throughout app
- Add auto-dismiss
- **Deliverable:** Global notification system

#### **Day 4-5: Error Handling** ⏰ 2 days

- Create ErrorBoundary component
- Create 404 page
- Global error handler
- Loading states
- **Deliverable:** Error handling system

### **WEEK 6 (Nov 23-Dec 1): Polish & Integration**

#### **Day 1-5: Final Polish** ⏰ 5 days

- Responsive design refinement
- Cross-browser testing
- Performance optimization
- Code review and refactoring
- Support team integration
- **Deliverable:** Polished frontend foundation

---

## 📋 Prenisa Thakuri: Inventory Management UI (Frontend)

**Focus:** Complete inventory management interface with CRUD operations

### **WEEK 1 (Oct 19-25): Setup & Planning**

#### **Day 1-2: Environment Setup & Study** ⏰ 2 days

- Clone repo and set up environment
- Study project structure
- Review inventory requirements
- Create component mockups/wireframes
- **Deliverable:** Ready to code

#### **Day 3-5: Form Components** ⏰ 3 days

- Create components/common/FormComponents:
  - FormField (label + input + error)
  - FormSelect (dropdown)
  - FormTextarea (notes)
  - FormDatePicker
  - FormNumberInput (with +/- buttons)
- Integrate react-hook-form
- Add validation
- **Deliverable:** Reusable form components

### **WEEK 2 (Oct 26-Nov 1): Inventory Table**

#### **Day 1-4: Inventory Table Component** ⏰ 4 days

- Create components/inventory/InventoryTable.tsx:
  ```typescript
  Columns:
  - Item Code
  - Item Name
  - Category
  - Current Stock
  - Minimum Stock
  - Unit
  - Status (OK/Low/Out)
  - Actions (Edit, Delete)

  Features:
  - Sortable columns
  - Row highlighting (red if stock < minimum)
  - Pagination (10/25/50/100 per page)
  - Loading skeleton
  - Empty state
  - Row click to view details
  - Responsive design
  ```
- Style with Tailwind
- **Deliverable:** Complete inventory table

#### **Day 5: Search & Filter** ⏰ 1 day

- Create components/inventory/SearchBar.tsx (with debounce)
- Create components/inventory/FilterPanel.tsx:
  - Category filter
  - Stock status filter
  - Clear filters button
- **Deliverable:** Search and filter UI

### **WEEK 3 (Nov 2-8): Inventory Forms**

#### **Day 1-3: Add/Edit Item Form** ⏰ 3 days

- Create components/inventory/InventoryForm.tsx:
  ```typescript
  Fields:
  - Item Name (required)
  - Item Code (required, unique check)
  - Category (dropdown)
  - Unit (dropdown: kg, liters, pieces, etc.)
  - Minimum Stock (number, required)

  Modes:
  - Add mode (empty form)
  - Edit mode (pre-filled)

  Validation:
  - All fields required
  - Item code unique per hotel-dept
  - Minimum stock > 0
  ```
- Modal-based form
- API integration
- Success/error notifications
- **Deliverable:** Add/Edit item form

#### **Day 4-5: Delete & Item Details** ⏰ 2 days

- Create delete confirmation modal
- Create components/inventory/ItemDetailView.tsx:
  - All item information
  - Current stock calculation
  - Recent transactions (last 10)
  - Quick action buttons
- **Deliverable:** Delete and detail view

### **WEEK 4 (Nov 9-15): Transaction Forms**

#### **Day 1-5: Transaction Form** ⏰ 5 days

- Create components/inventory/TransactionForm.tsx:
  ```typescript
  Multi-step form:

  Step 1: Select Transaction Type
  - Opening Balance
  - Add Stock
  - Return to Vendor
  - Damage
  - Transfer to Department
  - Transfer to Hotel

  Step 2: Transaction Details (dynamic based on type)
  - Quantity (required)
  - Date (default today)
  - Notes/Reason
  - For transfers: Destination hotel/department

  Step 3: Confirmation
  - Summary of transaction
  - Stock preview (Before -> After)
  - Confirm/Cancel buttons

  Validation:
  - Quantity > 0
  - For transfers: Check sufficient stock
  - Required fields based on type
  ```
- Modal or side-panel design
- Real-time stock preview
- API integration
- **Deliverable:** Complete transaction form

### **WEEK 5 (Nov 16-22): Inventory Page & Features**

#### **Day 1-3: Main Inventory Page** ⏰ 3 days

- Create pages/InventoryPage.tsx:
  ```typescript
  Layout:
  - Header with "Add Item" button
  - Search bar and filters
  - Summary cards (Total Items, Items Below Min, Stock Value)
  - Inventory table
  - "Record Transaction" floating button
  - Modals for forms
  ```
- Responsive layout
- State management
- API integration
- **Deliverable:** Complete inventory page

#### **Day 4-5: Bulk Operations** ⏰ 2 days

- Add row selection to table
- Create bulk action toolbar:
  - Export selected to CSV
  - Bulk update minimum stock
  - Bulk delete (with confirmation)
- Select all functionality
- **Deliverable:** Bulk operations feature

### **WEEK 6 (Nov 23-Dec 1): Testing & Polish**

#### **Day 1-5: Testing & Refinement** ⏰ 5 days

- Test all CRUD operations
- Test transaction recording
- Test search and filters
- Mobile responsiveness
- Bug fixes
- Performance optimization
- User experience improvements
- **Deliverable:** Production-ready inventory UI

---

## 📊 Swapnil Chettri: Reports & Admin Panel (Frontend)

**Focus:** Complete reporting module and admin panel

### **WEEK 1 (Oct 19-25): Setup & Report Components**

#### **Day 1-2: Environment & Planning** ⏰ 2 days

- Set up environment
- Study reporting requirements
- Create report mockups
- Plan component structure
- **Deliverable:** Ready to code

#### **Day 3-5: Report Base Components** ⏰ 3 days

- Create components/reports/ReportTable.tsx:
  ```typescript
  Features:
  - Column visibility toggle (checkboxes)
  - Export buttons (CSV, PDF, Print)
  - Row highlighting (red if shortage)
  - Freeze header on scroll
  - Responsive design
  - Print-friendly styles
  ```
- Create components/reports/ReportFilters.tsx:
  - Date range picker
  - Quick presets (Today, Last 7 days, etc.)
  - Item selector
  - Category filter
- **Deliverable:** Report base components

### **WEEK 2 (Oct 26-Nov 1): Stock Reports**

#### **Day 1-3: Stock Report (All Items)** ⏰ 3 days

- Create components/reports/StockReport.tsx:
  ```typescript
  Columns (with toggle):
  - Item Code, Name
  - Opening Balance (A)
  - Added (B)
  - Returned (C)
  - Damages (D)
  - Transfer IN Dept (E)
  - Transfer OUT Dept (F)
  - Transfer IN Hotel (G)
  - Transfer OUT Hotel (H)
  - Closing Balance
  - Minimum Stock
  - Status

  Features:
  - Color coding (Red/Yellow/Green)
  - Summary row (totals)
  - Date/range selector
  - Export functionality
  ```
- API integration
- **Deliverable:** Stock report

#### **Day 4-5: Item History Report** ⏰ 2 days

- Create components/reports/ItemHistoryReport.tsx:
  - Transaction-by-transaction history
  - Timeline view option
  - Running balance calculation
  - Chart showing stock over time (Recharts)
  - Filter by transaction type
- **Deliverable:** Item history report

### **WEEK 3 (Nov 2-8): Advanced Reports**

#### **Day 1-3: Reorder Report** ⏰ 3 days

- Create components/reports/ReorderReport.tsx:
  ```typescript
  Columns:
  - Item Code, Name
  - Current Stock
  - Minimum Stock
  - Shortage Amount
  - Last Restocked Date
  - Average Daily Consumption
  - Suggested Order Quantity

  Features:
  - Sort by shortage (highest first)
  - All rows in red (urgent)
  - Urgency indicators (Critical/High/Medium)
  - "Generate Purchase Order" button
  - Group by category
  - Export as shopping list
  ```
- **Deliverable:** Reorder report

#### **Day 4-5: Consumption Analysis** ⏰ 2 days

- Create components/reports/ConsumptionReport.tsx:
  - Consumption patterns over time
  - Charts (Line, Bar, Pie) using Recharts:
