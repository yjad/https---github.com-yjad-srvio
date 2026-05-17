# Dispute Management — Implementation Plan

## Goal

Add a complete dispute lifecycle: **create → mediate → escalate → resolve → close**. Customers and providers can raise disputes on completed bookings; CS staff review, mediate, and resolve them. This IP covers the mock API layer, UI pages, and integration hooks.

## Current State

| Aspect | Status | Details |
|---|---|---|
| `DisputeStatus` type | ❌ Wrong enum | Has `RESOLVED_PROVIDER`, `RESOLVED_CUSTOMER` — not matching PRD |
| `Dispute` interface | ❌ Missing | No type exists |
| `DisputeMessage` / `DisputeEvidence` / `DisputeTimelineEntry` | ❌ Missing | No types exist |
| Zod schemas | ❌ Missing | No dispute schemas |
| Mock API methods | ❌ Missing | No dispute methods |
| DB collections | ❌ Missing | Not in `db.json` / `seed.js` |
| UI pages | ❌ Missing | No dispute pages |
| `SystemSettings` parameters | ❌ Missing | No dispute-related params |
| Booking `paymentStatus` | ⚠️ Has `DISPUTED` | Existing enum value, not used anywhere |

## Key Decisions

| Topic | Decision |
|---|---|
| Refund entity | **No separate `RefundTransaction`** — use booking `paymentStatus: 'REFUNDED'` + `totalAmountRefunded` field |
| Escrow | **Mock only** — `holdAmount` on dispute, booking `paymentStatus` set to `DISPUTED` |
| Mediation timeout | **Checked on query load** — compare `dispute.createdAt + mediationDurationHours` to `Date.now()`, auto-set `ESCALATED` |
| Messages immutability | **No edit/delete** — unlike `ServiceComment`, dispute messages are append-only |
| Internal notes | Field `isInternalNote: boolean` — filtered client-side by `authStore` role |

## Implementation Plan

### Step 1 — Types (`src/types/index.ts`)
- Replace `DisputeStatus` with PRD values (`'OPEN' | 'UNDER_REVIEW' | 'MEDIATION' | 'ESCALATED' | 'RESOLVED' | 'REJECTED' | 'REFUNDED' | 'CLOSED'`)
- Add `DisputeCategory`, `DisputeResolutionType`, `AdminAction` type aliases
- Add `Dispute`, `DisputeMessage`, `DisputeEvidence`, `DisputeTimelineEntry` interfaces
- Add `disputeWindowDays`, `mediationDurationHours`, `maxDisputeFiles` to `SystemSettings`

### Step 2 — Zod Schemas (`src/schemas/index.ts`)
- Add `disputeCreateSchema` — validates `bookingId`, `disputeCategory`, `title`, `description`, `requestedResolution`
- Add `disputeMessageSchema` — validates `message`, `isInternalNote?`, `attachments?`

### Step 3 — DB + Seed (`db.json`, `seed.js`)
- Add empty arrays: `disputes: [], disputeMessages: [], disputeEvidence: [], disputeTimeline: []`
- Add default system params to `systemSettings`:
  ```json
  "disputeWindowDays": 7,
  "mediationDurationHours": 48,
  "maxDisputeFiles": 20
  ```

### Step 4 — Mock API (`src/api/mockApi.ts`)
Add methods (all use `nextId()` for POST `id`):

| Method | Signature | Notes |
|---|---|---|
| `getDisputes` | `(filters: { userId?, role? }) → Dispute[]` | Filters by involved party |
| `getDisputeById` | `(id: number) → Dispute \| null` | Single dispute |
| `createDispute` | `(data) → Dispute` | Validates preconditions; sets booking `paymentStatus = 'DISPUTED'` |
| `updateDisputeStatus` | `(id, status) → Dispute` | Validates transition; adds timeline entry |
| `resolveDispute` | `(id, resolution) → Dispute` | Sets resolution, status, booking refund |
| `getDisputeMessages` | `(disputeId) → DisputeMessage[]` | Sorted by `createdAt` |
| `addDisputeMessage` | `(disputeId, data) → DisputeMessage` | Append-only; no edit |
| `getDisputeEvidence` | `(disputeId) → DisputeEvidence[]` | |
| `uploadEvidence` | `(disputeId, data) → DisputeEvidence` | |
| `getDisputeTimeline` | `(disputeId) → DisputeTimelineEntry[]` | |
| `getAllDisputes` | `() → Dispute[]` | CS only |
| `getCSDisputeStats` | `() → { open, underReview, escalated, resolved }` | |

Precondition checks for `createDispute`:
1. Booking exists and `status === 'COMPLETED'`
2. No existing dispute with `bookingId` that is not `CLOSED`
3. `Date.now() - new Date(booking.createdAt).getTime() < disputeWindowDays * 86400000`

### Step 5 — Shared Components (`src/components/shared.tsx`)
- `DisputeStatusBadge` — color-coded badge (OPEN=blue, UNDER_REVIEW=yellow, MEDIATION=purple, ESCALATED=orange, RESOLVED=green, REJECTED=red, REFUNDED=teal, CLOSED=gray)
- `DisputeTimeline` — vertical timeline component (accepts `DisputeTimelineEntry[]`)

### Step 6 — DisputesPage (`src/pages/DisputesPage.tsx`)
- **Route**: `/disputes` (any auth)
- **Tabs**: "My Disputes" | "Create Dispute"
- **List**: Cards showing `title`, `status` badge, `disputeCategory`, `createdAt`, booking reference
- **Create modal**: Form with `disputeCreateSchema`, booking selector (only `COMPLETED` bookings with no existing dispute)
- **Empty state**: `EmptyState` with `ShieldAlert` icon
- **Query key**: `['disputes', user.id, user.role]`

### Step 7 — DisputeDetailPage (`src/pages/DisputeDetailPage.tsx`)
- **Route**: `/disputes/:id` (involved parties + CS)
- **Sections** (tabbed or vertical):
  1. **Overview** — status badge, category, description, requested resolution, hold amount
  2. **Messages** — Thread using `getDisputeMessages`, `addDisputeMessage`, filter `isInternalNote` by role
  3. **Evidence** — Grid of uploaded files, upload button (image resolve via `mockApi.getImageBlob`)
  4. **Timeline** — Vertical timeline component
- **Actions** (CS only): Dropdown of `AdminAction` values
- **Query keys**: `['dispute', id]`, `['dispute-messages', id]`, `['dispute-evidence', id]`, `['dispute-timeline', id]`
- **Mediation timeout check**: On dispute render, if `status === 'MEDIATION'` and timeout passed, mutate to `ESCALATED`

### Step 8 — CSDisputesPage (`src/pages/CSDisputesPage.tsx`)
- **Route**: `/customer-service/disputes` (role `CUSTOMER_SERVICE`)
- **Filterable table**: By status, category, date range
- **Row click**: Navigates to `DisputeDetailPage` with CS action bar
- **Stats card**: Open count, under review, escalated
- **Query keys**: `['cs-disputes']`, `['cs-dispute-stats']`

### Step 9 — Integration Hooks
- **BookingsPage** (`src/pages/BookingsPage.tsx`): Add "Dispute" button on booking cards where `status === 'COMPLETED'` and no dispute exists. Navigates to `/disputes?create&bookingId=X`.
- **CS Dashboard** (the existing CS page/tab): Add "Open Disputes" count to stats. Add "Disputes" tab.

### Step 10 — Navigation
- **Navbar** (`src/components/Navbar.tsx`): Add "Disputes" link (any auth) + "Disputes" link in CS dropdown
- **CS sidebar**: Add disputes tab

### Step 11 — Routes (`src/App.tsx`)
```tsx
<Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
<Route path="/disputes/:id" element={<ProtectedRoute><DisputeDetailPage /></ProtectedRoute>} />
<Route path="/customer-service/disputes" element={<ProtectedRoute role="CUSTOMER_SERVICE"><CSDisputesPage /></ProtectedRoute>} />
```

## Relevant Files

| File | Change |
|---|---|
| `src/types/index.ts` | Replace `DisputeStatus`, add 3 interfaces + 3 type aliases + `SystemSettings` fields |
| `src/schemas/index.ts` | Add `disputeCreateSchema`, `disputeMessageSchema` |
| `src/api/mockApi.ts` | Add 12 dispute methods + helper functions |
| `db.json` | Add empty collections + system params |
| `seed.js` | Add empty collections + system params |
| `src/components/shared.tsx` | Add `DisputeStatusBadge`, `DisputeTimeline` |
| `src/pages/DisputesPage.tsx` | New — list + create |
| `src/pages/DisputeDetailPage.tsx` | New — detail with messaging, evidence, timeline |
| `src/pages/CSDisputesPage.tsx` | New — CS review management |
| `src/pages/BookingsPage.tsx` | Add "Dispute" button |
| `src/pages/CSDashboardPage.tsx` | Add dispute stats + tab |
| `src/components/Navbar.tsx` | Add dispute links |
| `src/App.tsx` | Add 3 dispute routes |

## Edge Cases

| Case | Handling |
|---|---|
| Booking already has active dispute | `createDispute` rejects with error "A dispute already exists for this booking" |
| Dispute window expired | `createDispute` rejects with error "Dispute window has expired" |
| Non-involved party accesses dispute | `getDisputes` / `getDisputeById` filters by userId; CS bypasses |
| Message from non-involved party | `addDisputeMessage` validates sender is CS or involved party |
| CS action without comment | `resolveDispute` requires `csComment` (Zod validated) |
| Evidence upload during CLOSED dispute | Rejected — dispute must be in active status (`OPEN`/`UNDER_REVIEW`/`MEDIATION`/`ESCALATED`) |
