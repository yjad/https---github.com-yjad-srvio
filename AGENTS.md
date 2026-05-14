# AGENTS.md — srvio

> **Purpose**: This file is the single source of truth for AI agents (AntiGravity, Cursor, Copilot) working on the srvio codebase. Read it entirely before making changes. Follow every rule without deviation.

---

## 🏗️ Architecture Overview

srvio is a **React 19 SPA** — an on-demand service marketplace connecting customers with local providers (plumbing, cleaning, electrical, handyman, painting, landscaping). It uses a **mock API layer** backed by `json-server` (REST API on port 3000, data in `db.json`) that simulates a Spring Boot REST backend with JWT auth.

### Tech Stack (locked — do NOT change versions)

| Layer | Library | Version | Purpose |
|-------|---------|---------|---------|
| Framework | React | 19.2 | UI with concurrent features |
| Language | TypeScript | 5.9 | Strict type safety |
| Build | Vite | 7.3 | Dev server + bundler (single-file output) |
| Routing | react-router-dom | 7.x | Client-side routing |
| Client state | zustand | latest | Auth, UI, filter stores |
| Server state | @tanstack/react-query | latest | API caching & mutations |
| Validation | zod | latest | Form + API schema validation |
| Styling | tailwindcss | 4.1 | Utility-first CSS (no config file) |
| Icons | lucide-react | latest | Icon library |
| Charts | recharts | latest | Dashboard visualizations |
| Class merging | clsx + tailwind-merge | latest | `cn()` utility |
| Backend Mock | json-server | latest | REST API simulation |

### Project Tree

```
├── AGENTS.md                 ← THIS file (read first!)
├── index.html                ← Single HTML entry (title: srvio)
├── package.json
├── db.json                   ← json-server database
├── vite.config.ts            ← Alias: @/ → src/
├── tsconfig.json
└── src/
    ├── main.tsx              ← Entry: StrictMode, createRoot
    ├── App.tsx               ← QueryClient + BrowserRouter + Routes
    ├── index.css             ← Tailwind + custom theme + animations
    │
    ├── api/
    ├── api/
    │   └── mockApi.ts        ← ALL data access (json-server REST API)
    │
    ├── types/
    │   └── index.ts          ← All domain interfaces
    │
    ├── schemas/
    │   └── index.ts          ← All Zod validation schemas
    │
    ├── store/
    │   ├── authStore.ts      ← user, token, login, register, logout
    │   ├── uiStore.ts        ← sidebar, modal, notifications
    │   └── filterStore.ts    ← category, price, search, sort
    │
    ├── components/
    │   ├── shared.tsx        ← Reusable UI primitives
    │   ├── Navbar.tsx        ← Top navigation (responsive, auth-aware)
    │   └── ProtectedRoute.tsx← Role-based route guard
    │
    ├── pages/
    │   ├── HomePage.tsx              ← Landing (hero, categories, services)
    │   ├── AuthPages.tsx             ← LoginPage + RegisterPage
    │   ├── ServiceListPage.tsx       ← Browse/filter/sort services
    │   ├── ServiceDetailPage.tsx     ← Detail + booking modal
    │   ├── BookingsPage.tsx          ← Customer & provider booking list
    │   ├── ProviderDashboardPage.tsx ← Provider: earnings, CRUD services, jobs
    │   └── AdminDashboardPage.tsx    ← Admin: analytics, users, bookings, reviews
    │
    └── utils/
        └── cn.ts             ← clsx + tailwind-merge
```

---

## ⚡ Absolute Rules (Never Violate)

1. **NO unused imports** — TypeScript strict mode enforces this. Remove any icon, type, or component you don't use.
2. **NO `any` type** — Use `unknown` and narrow, or define a proper interface.
3. **NO raw `fetch`** — All data goes through `mockApi` + TanStack Query.
4. **NO CSS files** — Tailwind utilities only. Custom styles go in `index.css` `@theme`.
5. **NO `tailwind.config.js`** — Tailwind v4 uses `@theme` in CSS only.
6. **NO editing `package.json` or `vite.config.ts`** — Use `install_npm_packages` for new deps.
7. **ALWAYS validate forms with Zod** — No manual validation logic.
8. **ALWAYS use `cn()` for conditional classes** — Never concatenate className strings.
9. **ALWAYS handle loading + empty states** — Every page needs both.
10. **ALWAYS invalidate query cache after mutations** — `queryClient.invalidateQueries()`.

---

## 🎨 Styling System

### Custom Color Palette (defined in `index.css` `@theme`)

```
Primary   (blue):   primary-50 → primary-900   — buttons, links, accents
Accent    (green):  accent-50  → accent-700    — success, confirmations
Warning   (yellow): warning-50 → warning-600   — pending states, alerts
Danger    (red):    danger-50  → danger-700    — errors, destructive actions
```

### Custom Animations

| Class | Effect |
|-------|--------|
| `animate-fade-in` | Opacity 0→1 + translateY 10px→0 (0.4s) |
| `animate-slide-in` | Opacity 0→1 + translateX -20px→0 (0.3s) |
| `animate-pulse-slow` | Pulse opacity (2s loop) |
| `.skeleton` | Shimmer loading placeholder |

### Shared UI Components (`src/components/shared.tsx`)

| Component | Props | Usage |
|-----------|-------|-------|
| `Button` | `variant?`, `size?`, `loading?`, `children` | All interactive buttons |
| `Input` | `label?`, `error?`, plus native input props | Text inputs |
| `Select` | `label?`, `error?`, `options[]` | Dropdown selects |
| `Textarea` | `label?`, `error?` | Multi-line text |
| `Card` | `children`, `className?`, `onClick?` | Content containers |
| `Badge` | `children`, `className?` | Status/role tags (auto-colors) |
| `StarRating` | `rating`, `size?` | 5-star display |
| `Avatar` | `name`, `size?`, `className?` | Initials-based avatars |
| `Skeleton` | `className?` | Loading placeholder |
| `ServiceCardSkeleton` | (none) | Full card skeleton |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | Dialog overlay |
| `NotificationToast` | `notifications[]`, `onRemove` | Toast system |
| `EmptyState` | `icon`, `title`, `description`, `action?` | Zero-data states |
| `PageHeader` | `title`, `subtitle?`, `action?` | Page title bar |

### Importing shared components

```ts
import { Button, Input, Card, Badge, Avatar, StarRating } from '@/components/shared';
```

Only import what you use. Unused imports will break the build.

---

## 🔐 Authentication System

### Flow

```
LoginPage/RegisterPage
  → mockApi.login() / mockApi.register()
    → Returns { token: string, user: User }
      → localStorage.setItem('ss_token', token)
        → useAuthStore.sets { user, token, isAuthenticated }
          → App re-renders with auth context
            → ProtectedRoute validates on navigation
```

### Token Format

```ts
// Token: "ss_" + base64(JSON.stringify({ userId, email, role, name, exp }))
// Expires: 24 hours from creation
```

### Roles & Route Guards

```tsx
// Public routes — no guard needed
<Route path="/" element={<HomePage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="/services" element={<ServiceListPage />} />
<Route path="/services/:id" element={<ServiceDetailPage />} />

// Authenticated — any logged-in user
<Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />

// Role-specific
<Route path="/provider" element={<ProtectedRoute role="PROVIDER"><ProviderDashboardPage /></ProtectedRoute>} />
<Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | `john@email.com` | `user123` |
| Provider | `mike@email.com` | `provider123` |
| Admin | `admin@srvio.com` | `admin123` |

### Auth Store API

```ts
const { user, token, isAuthenticated, isLoading, error } = useAuthStore();

await useAuthStore.getState().login(email, password);
await useAuthStore.getState().register({ name, email, password, phone, role });
useAuthStore.getState().logout();
await useAuthStore.getState().init();  // Call on app mount
useAuthStore.getState().clearError();
```

---

## 🗄️ Mock API Reference (`src/api/mockApi.ts`)

All methods are async HTTP calls to json-server on port 3000. Data persists in `db.json`.

### Auth

| Method | Signature | Returns |
|--------|-----------|---------|
| `login(email, password)` | `(string, string)` | `{ token, user }` |
| `register(data)` | `{ name, email, password, phone, role }` | `{ token, user }` |
| `getMe(token)` | `(string)` | `User \| null` |

### Categories

| Method | Returns |
|--------|---------|
| `getCategories()` | `Category[]` |

### Services

| Method | Params | Returns |
|--------|--------|---------|
| `getServices({ category?, search?, priceMin?, priceMax?, sortBy? })` | Filter object | `Service[]` |
| `getServiceById(id)` | `number` | `Service \| null` |
| `createService(data)` | `Omit<Service, 'id'...'createdAt'>` | `Service` |
| `updateService(id, data)` | `number, Partial<Service>` | `Service` |
| `deleteService(id)` | `number` | `void` |

### Bookings

| Method | Params | Returns |
|--------|--------|---------|
| `getBookings({ userId?, role?, providerId? })` | Filter | `Booking[]` |
| `createBooking(data)` | `{ serviceId, customerId, date, time, address, notes }` | `Booking` |
| `updateBookingStatus(id, status)` | `number, BookingStatus` | `Booking` |

### Reviews

| Method | Params | Returns |
|--------|--------|---------|
| `getReviews(providerId?, serviceId?)` | Optional filters | `Review[]` |
| `createReview(data)` | `{ bookingId, rating, comment }` | `Review` |
| `deleteReview(id)` | `number` | `void` |

### Admin

| Method | Returns |
|--------|---------|
| `getAdminStats()` | `AdminStats` |
| `getAllUsers()` | `User[]` |
| `getAllServices()` | `Service[]` |
| `getAllBookings()` | `Booking[]` |
| `getAllReviews()` | `Review[]` |

### Provider

| Method | Returns |
|--------|---------|
| `getProviderEarnings(providerId)` | `{ totalEarnings, completedJobs, pendingEarnings, monthlyEarnings[] }` |

### Utility

| Method | Purpose |
|--------|---------|
| `resetDatabase()` | Deletes all records from json-server and re-seeds from `db.json` |

---

## 📐 Booking State Machine

```
                    ┌──────────┐
                    │ pending  │◄── Customer creates
                    └────┬─────┘
               Accept   │   Cancel (by customer or provider)
                    ┌───┴───────┐
                    ▼           ▼
            ┌──────────┐  ┌───────────┐
            │ accepted │  │ cancelled │ (terminal)
            └────┬─────┘  └───────────┘
        Start Job │
                  ▼
          ┌─────────────┐
          │ in_progress │
          └──────┬──────┘
      Complete   │
                  ▼
          ┌───────────┐
          │ completed │ → Customer can leave review
          └───────────┘
```

### Allowed Transitions by Role

| Current | Next | Actor |
|---------|------|-------|
| `pending` | `accepted` | Provider |
| `pending` | `cancelled` | Customer or Provider |
| `accepted` | `in_progress` | Provider |
| `in_progress` | `completed` | Provider |
| `completed` | *(review)* | Customer (separate API) |

---

## 📋 Zod Schemas (`src/schemas/index.ts`)

```ts
loginSchema       → { email, password }
registerSchema    → { name, email, password, phone, role: 'USER' | 'PROVIDER' }
bookingSchema     → { serviceId, date, time, address, notes? }
reviewSchema      → { bookingId, rating: 1-5, comment }
serviceSchema     → { name, description, categoryId, price, priceUnit, duration }
profileSchema     → { name, phone, bio? }
```

### Validation Pattern

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
// Proceed with valid data
```

---

## 🔌 TanStack Query Patterns

### Query Keys (canonical — use exactly these)

| Key | Used In |
|-----|---------|
| `['categories']` | All pages needing categories |
| `['services', ...filters]` | ServiceListPage |
| `['service', id]` | ServiceDetailPage |
| `['bookings', userId, role]` | BookingsPage |
| `['provider-bookings', providerId]` | ProviderDashboard |
| `['provider-services-list', providerId]` | ProviderDashboard |
| `['reviews', serviceId]` | ServiceDetailPage |
| `['earnings', providerId]` | ProviderDashboard |
| `['admin-stats']` | AdminDashboard |
| `['admin-users']` | AdminDashboard |
| `['admin-bookings']` | AdminDashboard |
| `['admin-reviews']` | AdminDashboard |

### Query Configuration (global defaults in `App.tsx`)

```ts
{ staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false }
```

### Mutation + Invalidation Pattern

```ts
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: (data) => mockApi.createBooking(data),
  onSuccess: () => {
    addNotification('Booking created!', 'success');
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    // Also invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  },
});
```

---

## 🧩 Page Specifications

### HomePage (`/`)
- Hero section with search bar
- Category grid (6 categories)
- Top-rated services (6 cards)
- How-it-works (3 steps)
- CTA for providers
- Footer with links

### LoginPage (`/login`)
- Split layout: branding (left) + form (right)
- Email + password with Zod validation
- Show/hide password toggle
- Demo credentials display

### RegisterPage (`/register`)
- Split layout
- Name, email, phone, password, role selector
- Role: Customer or Provider (toggle)

### ServiceListPage (`/services`)
- Search bar + filter toggle
- Filters: category, sort, price range sliders
- Service grid (responsive 1/2/3 columns)
- URL search param sync (`?category=`, `?search=`)

### ServiceDetailPage (`/services/:id`)
- Hero image + service info
- Provider card with avatar
- Booking modal (date, time, address, notes)
- Reviews list
- "More from provider" section
- Review modal (star picker + comment)

### BookingsPage (`/bookings`)
- Shared by customers AND providers
- Status filter tabs (all/pending/accepted/in_progress/completed/cancelled)
- Expandable booking cards
- Role-specific actions (accept/reject/complete/cancel)

### ProviderDashboardPage (`/provider`) — role: PROVIDER
- Tabs: overview / bookings / services
- Stats: earnings, pending, active, completed
- Monthly earnings bar chart
- Service CRUD (add/edit/delete modal)
- Booking management

### AdminDashboardPage (`/admin`) — role: ADMIN
- Tabs: overview / users / bookings / reviews
- Stats grid (8 metrics)
- Monthly bookings bar chart
- Booking status pie chart
- Revenue by category horizontal bar chart
- Users table (name, email, role, status)
- Bookings table (id, customer, service, date, status, amount)
- Reviews list with star display

---

## 🛠️ Development Patterns

### Creating a New Page

1. **File**: `src/pages/XxxPage.tsx`
2. **Export**: `export default function XxxPage()`
3. **Header**: `<PageHeader title="..." subtitle="..." />`
4. **Data**: `useQuery` with canonical query key
5. **Loading**: Skeleton placeholders or spinner
6. **Empty**: `<EmptyState icon={<... />} title="..." description="..." />`
7. **Route**: Add to `src/App.tsx` `<Routes>`

### Creating a New Form

1. **Schema**: Add to `src/schemas/index.ts`
2. **State**: `useState` for each field (or single object)
3. **Validate**: `schema.safeParse(data)` on submit
4. **Errors**: `Record<string, string>` displayed below fields
5. **Submit**: `useMutation` with `mockApi` call
6. **Feedback**: `addNotification('message', 'success')`

### Creating a New Shared Component

1. **Location**: `src/components/shared.tsx`
2. **Export**: Named export (not default)
3. **Props**: Always accept `className?: string`
4. **Merge**: `cn(baseClasses, className, conditionalClasses)`
5. **No side effects**: Pure component only

---

## ⚠️ Known Gotchas

| Issue | Fix |
|-------|-----|
| Recharts `Tooltip.formatter` type error | Cast: `(value: unknown) => [...] as [string, string]` |
| `issue.path[0]` type is `symbol` | Use `issue.path.join('.')` or `String(issue.path[0])` |
| `useSearchParams` ≠ Zustand filter sync | Use `useEffect` to read params → set store |
| `EmptyState` icon prop | Pass JSX: `<Calendar className="w-8 h-8" />` not `<Calendar />` |
| Mock DB only seeds on first load | Call `mockApi.resetDatabase()` to reset from `db.json` |
| Tailwind v4 has no config file | All custom values in `@theme` block in `index.css` |
| Vite single-file inlines everything | Output is one `dist/index.html` — no separate assets |
| Token expires after 24h | `init()` auto-logs out expired users |
| `role` type narrow conflicts | Use `role: 'USER' \| 'PROVIDER'` explicit union, not `as const` |

---

## 🚦 Commands

```bash
npm run dev:api # Start json-server (port 3000) — run FIRST
npm run dev     # Start Vite dev server — run SECOND
```

After every change: **run `npm run build`** to confirm no errors.

---

## ✅ Pre-Submit Checklist

- [ ] `npm run build` succeeds with zero errors
- [ ] Zero unused imports (icons, types, components)
- [ ] Zero `any` types in new code
- [ ] All forms use Zod schemas from `src/schemas/index.ts`
- [ ] All data fetches use `useQuery`/`useMutation`
- [ ] All className conditionals use `cn()`
- [ ] New routes registered in `src/App.tsx`
- [ ] Loading states present (skeleton or spinner)
- [ ] Empty states present (`EmptyState` component)
- [ ] Success/error notifications on mutations
- [ ] Query cache invalidated after mutations
- [ ] Responsive on mobile (320px+) and desktop

---

*srvio v1.0 | Last updated: 2025*
