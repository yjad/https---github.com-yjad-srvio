
# 🚀 Product Requirements Document (PRD)

## *srvio – On-Demand Service Marketplace*

---

## 1. 🧭 Product Overview

*srvio* is a web-based platform that connects users with local service providers 
(e.g., plumbing, cleaning, electrical, handyman) through a fast, reliable, and user-friendly booking system.

### 🎯 Vision

Deliver *instant, trusted, and trackable services* with a scalable SaaS-ready architecture.

### 🎯 Goals

* Reduce time to find and book services
* Provide transparent pricing & provider ratings
* Enable providers to manage and monetize services
* Build a scalable SaaS foundation

---

## 2. 👥 Target Users

### 👤 Customers

* Book services
* Track orders
* Review providers

### 🧑‍🔧 Service Providers

* Offer services
* Manage bookings
* Track earnings

### 🛠️ Admin

* Manage platform
* Monitor activity
* Configure system

---

## 3. 🧱 Tech Stack Architecture

### 🎨 Frontend

* *React 19* (Concurrent features + Suspense)
* *TypeScript* (type safety)
* *TailwindCSS v4* (UI system)
* *Vite* (build tool)
* *Lucide React* (icons)

### 🧠 State & Data

* *Zustand* → global state (auth, UI, filters)
* *TanStack Query* → server state (API caching)
* *React Router v7* → routing

### ✅ Validation

* *Zod*

  * Schema validation (forms + API)
  * Shared schemas between FE/BE (future)

### 🔐 Authentication

* *JWT-based authentication*
* Token stored in localStorage (current implementation)

### 🌐 API Layer

* *Mock API Layer* (localStorage-backed)
  * Simulates REST API
  * All data persisted in localStorage
  * Includes artificial delay to simulate network

---

## 3.1 Implemented Tech Stack Details

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | React 19.2 | |
| Language | TypeScript 5.9 | |
| Build Tool | Vite 7.3 | Single-file output |
| Routing | react-router-dom 7.x | Client-side routing |
| Client State | Zustand | Auth, UI, filter stores |
| Server State | @tanstack/react-query | API caching & mutations |
| Validation | Zod | Form + API schema validation |
| Styling | TailwindCSS 4.1 | No config file, uses @theme |
| Icons | Lucide React | |
| Charts | Recharts | Dashboard visualizations |
| Class Merging | clsx + tailwind-merge | cn() utility |

---

## 4. 🧪 Environment Strategy

### 🧪 Development / Testing

* *Mock API Layer* (localStorage-backed)
  * Simulates REST API endpoints
  * Data persists in localStorage under `srvio_db` key
  * Includes artificial delay (~300ms) to simulate network latency
  * Database seeded on first load

### 🚀 Production

* *Spring Boot API* (planned)
* Same endpoints as mock API
* JWT secured endpoints

👉 *Critical Requirement:*

> API contract MUST remain identical between mock API and Spring Boot

---

## 5. 🧩 Core Features

---

### 👤 5.1 Customer Features

* Register / Login (JWT)
* Browse services
* Filter by:

  * Category
  * Location
  * Price
* View provider profile
* Book service
* Track booking status
* Leave reviews

---

### 🧑‍🔧 5.2 Provider Features

* Register as provider
* Create/manage services
* Accept/reject bookings
* Update job status:

  * Pending → Accepted → In Progress → Completed
* View earnings

---

### 🛠️ 5.3 Admin Features

* Manage:

  * Users
  * Providers
  * Categories (add/edit/activate/deactivate)
  * Services (add/edit/activate/deactivate)
* View bookings
* Moderate reviews
* Dashboard analytics (basic in v1)

---

## 5.4 Category Management (Admin)

* **Category Model Enhancement**:
  * Added `isActive?: boolean` - controls visibility in customer-facing lists
  * Added `activationDate?: string` - controls when category becomes visible

* **API Functions**:
  * `getCategories()` - returns active categories (filtered by isActive and activationDate)
  * `getAllCategories()` - returns all categories (for admin view)
  * `createCategory(data)` - creates new category with default isActive=true
  * `updateCategory(id, data)` - updates category, can toggle isActive
  * When a category is deactivated (isActive: false), all its services are automatically set to isActive: true

* **Admin Dashboard Features**:
  * Categories tab displays all categories (active and inactive)
  * Add Category modal with fields: Name, Icon, Description, Color, Activation Date
  * Edit Category modal with pre-filled data
  * Activate/Deactivate toggle button
  * Status badge shows Active/Inactive

---

## 5.5 Service Management (Admin)

* **Service Model Enhancement**:
  * Added `isActive?: boolean` - controls visibility in marketplace

* **API Functions**:
  * `getServices()` - returns active services only (filtered by isActive)
  * `updateService(id, data)` - can toggle isActive flag

* **Admin Dashboard Features**:
  * Services tab displays all services
  * Activate/Deactivate toggle button
  * Status badge shows Active/Inactive

---

## 6. 🔄 Core User Flows

### 🧭 Booking Flow

1. User browses services
2. Selects provider
3. Chooses date/time
4. Confirms booking
5. Provider accepts
6. Service delivered
7. User reviews

---

### 🔐 Authentication Flow

1. User logs in
2. Backend returns JWT
3. Axios interceptor attaches token
4. Protected routes validated

---

## 7. 🧠 State Management Design (Zustand)

### Global Stores

ts
authStore:
  - user
  - token
  - isAuthenticated

uiStore:
  - theme
  - modal states

filterStore:
  - category
  - location
  - price range


---

## 8. 🔁 API Design (Contract First)

### Example Endpoints

#### Auth

POST /auth/login
POST /auth/register
GET /auth/me

#### Services

GET /services
GET /services/:id
POST /services
PUT /services/:id

#### Bookings

POST /bookings
GET /bookings
PUT /bookings/:id/status

#### Categories (Implemented)

GET /categories - Returns active categories
GET /categories/all - Returns all categories (admin)
POST /categories - Create new category
PUT /categories/:id - Update category

#### Admin

GET /admin/stats - Platform statistics
GET /admin/users - All users
GET /admin/bookings - All bookings
GET /admin/reviews - All reviews


---

## 9. 📡 Axios Configuration

* Base URL (env-based)
* Interceptors:

  * Attach JWT
  * Handle 401 (auto logout)
  * Global error handler

---

## 10. 📊 Data Fetching Strategy (TanStack Query)

### Rules

* Cache service listings
* Refetch on:

  * Window focus
  * Booking updates
* Use:

  * useQuery → GET
  * useMutation → POST/PUT

---

## 11. 🧾 Validation Strategy (Zod)

### Example

ts
const bookingSchema = z.object({
  serviceId: z.number(),
  date: z.string(),
  address: z.string().min(10)
});


👉 Used in:

* Forms (TanStack Form)
* API validation layer

---

## 12. 🎨 UI/UX Guidelines

* Clean marketplace layout
* Mobile-first design
* Fast interactions (no blocking UI)
* Skeleton loaders (React Suspense)

---

## 13. 🔐 Security Requirements

* JWT validation on all protected routes
* Role-based access:

  * USER
  * PROVIDER
  * ADMIN
* Input validation (Zod)
* Prevent:

  * XSS
  * CSRF (later with cookies)

---

## 14. ⚙️ Non-Functional Requirements

### Performance

* Lazy loading routes
* Query caching

### Scalability

* API abstraction layer
* Ready for microservices later

### Maintainability

* Feature-based folder structure
* Typed APIs

---

## 15. 📁 Suggested Frontend Structure


src/
 ├── app/
 ├── features/
 │    ├── auth/
 │    ├── services/
 │    ├── bookings/
 ├── store/
 ├── api/
 ├── schemas/
 ├── routes/
 └── components/


---

## 16. 🚀 Future Enhancements (Important)

* 📱 Mobile app (React Native)
* 💬 Real-time chat (WebSockets)
* 🤖 AI provider matching
* 💳 Payment integration (Stripe)
* 📍 Map integration (Google Maps)

---

## 17. ⚠️ Risks & Considerations

* json-server ≠ real backend behavior
* JWT handling must be secure in production
* Need strict API contract discipline
* Scaling requires backend redesign later

---

## 🧠 Final Strategic Advice

You’re doing something smart here:

👉 *Mock first (json-server) → Validate → Replace with Spring Boot*

But the real success factor will be:

> *How clean your API contract + frontend architecture is from day one*