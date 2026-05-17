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
* *Vite* (build tool, single-file output)
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
* Token stored in localStorage
* Roles: `CUSTOMER`, `PROVIDER`, `ADMIN`, `CUSTOMER_SERVICE`

### 🌐 API Layer

* *json-server + lowdb* (port 3000)
  * Custom Node.js HTTP server (`start-api.mjs`) handling POST with numeric ID generation
  * All data persisted in `db.json`
  * Vite proxies `/api` → `localhost:3000`
  * `normalizeIds()` interceptor coerces all ID fields from string → number on every response

### 🗃️ Database

* *json-server + lowdb* → lightweight JSON-based storage
* *db.json* → single-file database (seeded on empty startup via `seed.js`)
* Custom `start-api.mjs` server handles:
  * POST requests (json-server v1 strips client-set IDs — custom handler fixes this)
  * Numeric ID generation via `nextId()` helper
  * File upload endpoints (POST/DELETE `/upload`)
  * Static file serving for `/uploads/*`
  * ID normalization interceptor
  * Request body size limit: `JSON_SERVER_BODY_LIMIT='50mb'`

#### Tech Stack Details

| Layer | Library | Version | Purpose |
|-------|---------|---------|---------|
| Framework | React | 19 | UI |
| Language | TypeScript | 5.x | Type safety |
| Build | Vite | 7.x | Dev server + bundler |
| Routing | react-router-dom | 7.x | Client-side routing |
| Client State | Zustand | latest | Auth, UI, filters |
| Server State | @tanstack/react-query | latest | API caching |
| Validation | zod | latest | Form + API validation |
| Styling | tailwindcss | 4.x | Utility-first CSS |
| Icons | lucide-react | latest | Icon library |
| Charts | Recharts | latest | Dashboard visualizations |
| Class Merging | clsx + tailwind-merge | cn() utility |
| Backend Mock | json-server + lowdb (custom `start-api.mjs`) | REST API on port 3000, seed on startup |
| File Storage | File system (`uploads/`) | Images stored on disk, served via Vite proxy, configurable via `SRVIO_UPLOADS_DIR` |

---

## 4. 📐 Architecture Decisions

### Why json-server + lowdb (not localStorage)?

1. **Real API semantics** — HTTP methods, request/response lifecycle
2. **Persistence** — survives page refresh and browser restart
3. **Dev tools** — can inspect data directly
4. **Easy migration** — replace with real backend later (swap API base URL)

### Why React 19 + Suspense?

* Concurrent rendering for smoother UX
* Suspense boundaries for data-dependent rendering

### Why TanStack Query?

* Automatic caching + invalidation
* Loading/error state management
* Retry logic + stale-while-revalidate

### Why Zod?

* Single source of truth for data shapes
* TypeScript type inference
* Runtime validation safety net

### Why Zustand (not Redux)?

* Minimal boilerplate
* React 19 compatible
* Good enough for this app's state needs

---

## 5. 🚀 Core Features

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
* Raise disputes on completed bookings
* Upload evidence (images/files) to support disputes
* Communicate via dispute messages

### 🧑‍🔧 5.2 Provider Features

* Register as provider (set `isVerified: false`, admin must approve)
* Create/manage services (name, description, category, price, duration, image)
* Accept/reject bookings
* Update job status:

  * Pending → Accepted → In Progress → Completed
* View earnings dashboard (total, pending, monthly bar chart)
* View and reply to disputes raised against their services
* Upload evidence to disputes
* Communicate via dispute messages

### 🛠️ 5.3 Admin Features

* Dashboard analytics:

  * Total users, providers, services, bookings, revenue
  * Monthly bookings bar chart
  * Booking status pie chart
  * Revenue by category chart
* Manage:

  * Users (view all, filter by role)
  * Categories (add/edit/activate/deactivate)
  * Services (add/edit/activate/deactivate)
* View all bookings
* Moderate reviews (delete inappropriate reviews)
* Handle disputes with CS actions:

  * Request More Info, Escalate, Approve Refund
  * Partial Settlement, Release Escrow, Reject, Close Case

### 👩‍💼 5.4 Customer Service Features

* View all disputes (open, under review, escalated, resolved)
* Execute CS actions on disputes (status transitions)
* Add internal notes to dispute messages
* View mediation timeouts

### 🔄 5.5 Shared Features

* **Confirm modals** before destructive actions
* **Notifications** (toast system via UI store)
* **Loading states** (skeleton loaders)
* **Empty states** (placeholder component with icon, title, description, optional action button)
* **Error handling** (retry, fallback UI)
* **Responsive design** (320px+ mobile to desktop)

---

## 5.6 Dispute System

* **Dispute Creation**:
  * Customer/Provider can raise dispute on `COMPLETED` bookings within configurable window (default: 7 days)
  * Fields: category (SERVICE_NOT_DELIVERED, QUALITY_UNSATISFACTORY, etc.), title, description, requested resolution (FULL_REFUND, PARTIAL_REFUND, REWORK, etc.)
  * Dispute amount held = `totalPrice - paidAmount`

* **Dispute Statuses**: `OPEN → UNDER_REVIEW → MEDIATION → ESCALATED → RESOLVED | REJECTED | CLOSED`

* **Dispute Detail Page**:
  * Overview tab: description, category, requested resolution, raiser info (avatar + name), created date, resolution info
  * Messages tab: threaded communication between all parties, internal notes for CS
  * Evidence tab: upload/view images and documents, file storage on disk
  * Timeline tab: full audit trail of all actions

* **CS Actions**:
  * Request More Info, Escalate, Approve Refund (FULL_REFUND), Partial Settlement (PARTIAL_REFUND), Release Escrow (PAYMENT_RELEASE), Reject Dispute, Close Case

* **Provider Visibility**:
  * Providers see disputes they raised AND disputes raised against their bookings
  * Providers can view evidence and reply via messages (read-only for evidence they didn't upload)

* **Mediation Timeouts**:
  * Configurable `mediationDurationHours` in system settings
  * Auto-escalation when timeout expires

---

## 5.7 Image & File Management

* **Upload Flow**:
  * FileReader → base64 data URL → `saveImage()` POSTs to `/api/upload`
  * Server writes file to disk under `uploads/` directory
  * Returns URL path: `/uploads/{subfolder}/{timestamp}_{random}.{ext}`

* **Storage**:
  * Configurable via `SRVIO_UPLOADS_DIR` environment variable (default: `<project>/uploads/`)
  * Subfolders: `attachments/` (evidence), `services/` (service images), `avatars/` (profile pictures)
  * Static file serving via custom HTTP handler + Vite proxy

* **Legacy Support**:
  * `imageBlobs` collection in `db.json` maintained for backward compatibility with seed data
  * `getImageBlob()` falls back to blob store for legacy `images/` paths, returns URL directly for `/uploads/` paths

* **Cleanup**:
  * `deleteImage()` sends DELETE to server, removes file from disk
  * `resetDatabase()` clears entire `uploads/` directory

---

## 5.8 Service Comments

* Threaded comments on services for provider↔admin communication
* Support for image/file attachments
* Edit and delete own comments (if no replies)
* Visibility: all authenticated users

---

## 6. 🔄 Core User Flows

### 🔐 Authentication Flow

1. User logs in / registers
2. Backend returns JWT token (`ss_` + base64 encoded `{ userId, email, role, name, exp }`)
3. Token stored in `localStorage` under `ss_token` key
4. `useAuthStore.init()` checks token expiry on app mount (auto-logout after 24h)
5. Protected routes validate via `<ProtectedRoute role="PROVIDER">`
6. Roles: `CUSTOMER` | `PROVIDER` | `ADMIN` | `CUSTOMER_SERVICE`

#### Route Guards

| Route | Guard |
|-------|-------|
| `/`, `/services`, `/services/:id` | Public |
| `/login`, `/register` | Guest only |
| `/bookings` | Any authenticated |
| `/provider` | `PROVIDER` |
| `/admin` | `ADMIN` |
| `/disputes`, `/disputes/:id` | Any authenticated |

### 🧭 Booking Flow

1. User browses services
2. Selects provider
3. Chooses date/time, enters address + notes
4. Confirms booking → status: `REQUESTED`
5. Provider accepts → `ACCEPTED`
6. Provider starts job → `IN_PROGRESS`
7. Provider completes → `COMPLETED`
8. User leaves review
9. *(Optional)* Customer disputes within window → `DISPUTE`

#### Booking State Machine

```
REQUESTED ──accept──→ ACCEPTED ──start──→ IN_PROGRESS ──complete──→ COMPLETED
    │                                                                    │
    └──cancel──→ CANCELLED                      └──(if disputed)──→ DISPUTE FLOW
```

### 💳 Payment Flow

* On booking → `paymentStatus: UNPAID`
* After provider acceptance → options: full/partial
* On completion → final payment

  * `paymentStatus: PAID`
* Payment types:

  * ONLINE (card/wallet)
  * CASH (pay on completion)
  * DEPOSIT (partial upfront)

---

## 7. 📋 API Contracts

### Base URL

Development: `http://localhost:3000/api`

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email + password → JWT |
| POST | `/auth/register` | Register new user (CUSTOMER/PROVIDER) |
| GET | `/auth/me` | Get current user from token |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/services` | List active services (filter: category, search, price, sort) |
| GET | `/services/:id` | Get service details |
| POST | `/services` | Create service (provider) |
| PATCH | `/services/:id` | Update service |
| DELETE | `/services/:id` | Delete service |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create booking |
| GET | `/bookings` | List bookings (filter by userId/role/providerId) |
| PATCH | `/bookings/:id` | Update booking status |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Active categories (filtered) |
| GET | `/categories/all` | All categories (admin) |
| POST | `/categories` | Create category |
| PATCH | `/categories/:id` | Update category |

### Disputes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/disputes` | List disputes (filter: userId, role) |
| GET | `/disputes/:id` | Get dispute detail |
| POST | `/disputes` | Create dispute |
| PATCH | `/disputes/:id` | Update dispute status |
| GET | `/disputeMessages` | Messages for a dispute |
| POST | `/disputeMessages` | Add message |
| GET | `/disputeEvidence` | Evidence for a dispute |
| POST | `/disputeEvidence` | Upload evidence record |
| GET | `/disputeTimeline` | Timeline for a dispute |
| POST | `/disputeTimeline` | Add timeline entry |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/users` | All users |
| GET | `/admin/bookings` | All bookings |
| GET | `/admin/reviews` | All reviews |

### Provider

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/providers/:id/earnings` | Earnings data + monthly breakdown |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload file (base64, returns URL) |
| DELETE | `/upload` | Delete file or clear all (`__all__`) |
| GET | `/uploads/*` | Serve uploaded files (static) |

### Service Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/serviceComments` | Comments for a service |
| POST | `/serviceComments` | Add comment |
| PATCH | `/serviceComments/:id` | Edit comment |
| DELETE | `/serviceComments/:id` | Delete comment |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/systemSettings` | Platform configuration |
| PATCH | `/systemSettings` | Update settings |

---

## 8. 🎯 MVP Scoping (v1)

### ✅ In Scope

* User auth (JWT)
* Service browsing + search + category filter
* Booking with status tracking
* Reviews
* Provider dashboard (basic)
* Admin dashboard (basic)
* Profile management

### ❌ Out of Scope (v2+)

* Real payments
* Real-time chat
* Mobile app
* SMS/Email notifications
* AI features

---

## 9. 🧩 Data Models

### User

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| name | string | Display name |
| email | string | Unique login |
| password | string | Hashed (plain in mock) |
| phone | string | Contact |
| role | enum | CUSTOMER / PROVIDER / ADMIN / CUSTOMER_SERVICE |
| avatar | string | Image URL |
| createdAt | string | ISO date |
| isActive | boolean | For soft deactivation |
| isVerified | boolean | Provider verification status |

### Category

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| name | string | Display name |
| icon | string | Lucide icon name or URL |
| description | string | Short blurb |
| isActive | boolean | Visibility toggle |
| sortOrder | number | Display order |
| serviceCount | number | Count of active services (computed) |

### Service

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| name | string | Service title |
| description | string | Detailed description |
| categoryId | number | FK → Category |
| providerId | number | FK → User (PROVIDER) |
| price | number | Base price |
| priceUnit | string | Per hour / fixed / per visit |
| duration | number | Minutes |
| image | string | Image URL |
| isActive | boolean | Visibility toggle |
| createdAt | string | ISO date |

### Booking

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| serviceId | number | FK → Service |
| customerId | number | FK → User (CUSTOMER) |
| providerId | number | FK → User (PROVIDER) |
| date | string | Booking date |
| time | string | Time slot |
| address | string | Service location |
| notes | string | Optional customer notes |
| status | enum | REQUESTED / ACCEPTED / IN_PROGRESS / COMPLETED / CANCELLED / DISPUTED |
| paymentStatus | enum | UNPAID / PARTIALLY_PAID / PAID / REFUNDED |
| totalPrice | number | Total cost |
| paidAmount | number | Amount paid so far |
| createdAt | string | ISO date |

### Review

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| bookingId | number | FK → Booking |
| customerId | number | FK → User (CUSTOMER) |
| providerId | number | FK → User (PROVIDER) |
| serviceId | number | FK → Service |
| rating | number | 1–5 |
| comment | string | Review text |
| createdAt | string | ISO date |

### Dispute

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| bookingId | number | FK → Booking |
| raisedById | number | FK → User (raiser) |
| raisedByRole | enum | CUSTOMER / PROVIDER |
| disputeCategory | enum | SERVICE_NOT_DELIVERED, QUALITY_UNSATISFACTORY, etc. |
| title | string | Dispute title |
| description | string | Detailed description |
| requestedResolution | enum | FULL_REFUND / PARTIAL_REFUND / REWORK |
| amountHeld | number | `totalPrice - paidAmount` |
| status | enum | OPEN / UNDER_REVIEW / MEDIATION / ESCALATED / RESOLVED / REJECTED / CLOSED |
| resolution | string | Admin resolution notes |
| resolvedById | number | FK → User (CS/Admin) |
| resolutionType | enum | FULL_REFUND / PARTIAL_REFUND / PAYMENT_RELEASE / REJECTED |
| resolvedAt | string | ISO date |
| createdAt | string | ISO date |
| updatedAt | string | ISO date |

### Dispute Message

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| disputeId | number | FK → Dispute |
| senderId | number | FK → User (any role) |
| message | string | Message body |
| isInternal | boolean | Only visible to CS/Admin |
| createdAt | string | ISO date |

### Dispute Evidence

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| disputeId | number | FK → Dispute |
| uploadedById | number | FK → User |
| filePath | string | URL to file on disk |
| fileName | string | Original filename |
| fileType | string | MIME type |
| fileSize | number | Size in bytes |
| uploadedAt | string | ISO date |

### Dispute Timeline

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| disputeId | number | FK → Dispute |
| action | string | Status change or action description |
| actorId | number | FK → User |
| notes | string | Optional notes |
| createdAt | string | ISO date |

### Service Comment

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| serviceId | number | FK → Service |
| userId | number | FK → User |
| parentId | number | FK → Service Comment (for replies) |
| content | string | Comment body |
| attachment | string | Optional image URL |
| createdAt | string | ISO date |
| updatedAt | string | ISO date |

### Image Blob (Legacy)

| Field | Type | Notes |
|-------|------|-------|
| id | number | Auto-generated |
| data | string | Base64-encoded image data |
| type | string | Usage type (avatar/service/attachment) |
| createdAt | string | ISO date |

### System Settings

| Field | Type | Notes |
|-------|------|-------|
| id | string | `'platform'` (singleton) |
| disputeCategories | string[] | Available dispute categories |
| requestedResolutions | string[] | Available resolution options |
| csActions | string[] | CS action options |
| mediationDurationHours | number | Auto-escalation timeout |

---

## 10. 📐 Data Flow

### Booking Lifecycle

```
Create → PENDING → ACCEPTED → IN_PROGRESS → COMPLETED → REVIEW (optional)
                     ↓                                              ↓
                 CANCELLED                                    DISPUTE (optional)
```

### Review Lifecycle

```
Booking COMPLETED → User writes review → Visible on profile
                 ↓
            Can edit (24h) → Can delete (always)
```

### Dispute Lifecycle

```
Booking COMPLETED → Create Dispute (OPEN)
                         ↓
                  UNDER_REVIEW
                         ↓
              ┌──── MEDIATION ────┐
              │                   │
         ESCALATED           timeouts/actions
              │                   │
              └───────┬───────────┘
                      ↓
           RESOLVED / REJECTED / CLOSED
```

---

## 11. 🧾 Validation Strategy (Zod)

### Available Schemas

| Schema | Fields |
|--------|--------|
| `loginSchema` | email, password |
| `registerSchema` | name, email, password, phone, role |
| `bookingSchema` | serviceId, date, time, address, notes? |
| `reviewSchema` | bookingId, rating (1-5), comment |
| `serviceSchema` | name, description, categoryId, price, priceUnit, duration |
| `profileSchema` | name, phone, bio? |
| `disputeCreateSchema` | bookingId, disputeCategory, title, description, requestedResolution |

Pattern: `schema.safeParse(data)` → `result.success` / `result.error.issues`

### Example

```ts
const result = bookingSchema.safeParse(formData);
if (!result.success) {
  const errors: Record<string, string> = {};
  result.error.issues.forEach(issue => {
    const key = issue.path.join('.');
    if (key) errors[key] = issue.message;
  });
  setErrors(errors);
  return;
}
```

👉 Used in:

* Form submissions (login, register, booking, review, service, dispute)
* API validation layer (planned)

---

## 12. 🎨 UI/UX Guidelines

* Clean marketplace layout
* Mobile-first design
* Fast interactions (no blocking UI)
* Skeleton loaders (React Suspense)

---

## 13. 🔐 Security Requirements

* JWT validation on all protected routes (token stored in localStorage as `ss_token`)
* Token expiry check on app mount (`useAuthStore.init()` auto-logs out after 24h)
* Role-based access:

  * `CUSTOMER` (browse, book, review, dispute)
  * `PROVIDER` (manage services, accept/reject bookings, earnings, dispute replies)
  * `ADMIN` (system-wide management, dispute resolution, dashboard analytics)
  * `CUSTOMER_SERVICE` (dispute management, internal notes, status transitions)
* Input validation (Zod) on all forms
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

## 15. 📁 Project Structure (Current)


```
src/
 ├── main.tsx              ← Entry: StrictMode + createRoot
 ├── App.tsx               ← QueryClient + BrowserRouter + Routes
 ├── index.css             ← Tailwind + @theme + custom animations
 ├── api/
 │    └── mockApi.ts       ← ALL data access (json-server REST API)
 ├── types/
 │    └── index.ts         ← All domain interfaces
 ├── schemas/
 │    └── index.ts         ← All Zod validation schemas
 ├── store/
 │    ├── authStore.ts     ← user, token, login, register, logout
 │    ├── uiStore.ts       ← sidebar, modal, notification toasts
 │    └── filterStore.ts   ← category, price, search, sort
 ├── components/
 │    ├── shared.tsx       ← Reusable UI primitives
 │    ├── Navbar.tsx       ← Top navigation (responsive, auth-aware)
 │    └── ProtectedRoute.tsx ← Role-based route guard
 ├── pages/
 │    ├── HomePage.tsx
 │    ├── AuthPages.tsx    ← LoginPage + RegisterPage
 │    ├── ServiceListPage.tsx
 │    ├── ServiceDetailPage.tsx
 │    ├── BookingsPage.tsx
 │    ├── ProviderDashboardPage.tsx
 │    ├── AdminDashboardPage.tsx
 │    ├── DisputesPage.tsx
 │    ├── DisputeDetailPage.tsx
 │    └── BrowseDBPage.tsx
 └── utils/
      └── cn.ts            ← clsx + tailwind-merge
```

---

## 16. 🚀 Future Enhancements (Important)

* 📱 Mobile app (React Native)
* 💬 Real-time chat (WebSockets)
* 🤖 AI provider matching
* 💳 Payment integration (Stripe)
* 📍 Map integration (Google Maps)

---

## 17. ⚠️ Risks & Considerations

* json-server ≠ real backend behavior (custom `start-api.mjs` addresses some gaps like POST ID handling)
* JWT handling must be secure in production (current localStorage approach is dev-only)
* File storage on disk (`uploads/`) requires proper cleanup and CDN strategy in production
* Need strict API contract discipline
* Scaling requires backend redesign later

---

## 🧠 Final Strategic Advice

You're doing something smart here:

👉 *Mock first (json-server + lowdb) → Validate → Replace with Spring Boot*

But the real success factor will be:

> *How clean your API contract + frontend architecture is from day one*
