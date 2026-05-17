# Dispute Management System — PRD

## 1. Domain Types (`src/types/index.ts`)

```ts
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'MEDIATION' | 'ESCALATED' | 'RESOLVED' | 'REJECTED' | 'REFUNDED' | 'CLOSED';
export type DisputeCategory = 'SERVICE_NOT_DELIVERED' | 'POOR_QUALITY' | 'WRONG_PRICE' | 'DAMAGED_PROPERTY' | 'PROVIDER_NO_SHOW' | 'CUSTOMER_ABUSE' | 'INCOMPLETE_WORK' | 'PAYMENT_ISSUE' | 'OTHER';
export type DisputeResolutionType = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'REWORK' | 'PAYMENT_RELEASE' | 'ACCOUNT_REVIEW' | 'OTHER';
export type AdminAction = 'APPROVE_REFUND' | 'REJECT_DISPUTE' | 'PARTIAL_SETTLEMENT' | 'REQUEST_MORE_INFO' | 'RELEASE_ESCROW' | 'CLOSE_CASE' | 'ESCALATE';

export interface Dispute {
  id: number;
  bookingId: number;
  raisedById: number;
  raisedByRole: 'CUSTOMER' | 'PROVIDER';
  disputeCategory: DisputeCategory;
  title: string;
  description: string;
  requestedResolution: DisputeResolutionType;
  status: DisputeStatus;
  resolution?: {
    type: DisputeResolutionType | 'NO_REFUND' | 'REWORK_APPROVED' | 'PROVIDER_PAID' | 'SPLIT_SETTLEMENT' | 'ACCOUNT_WARNING';
    adminComment: string;
    financialSummary: string;
    actorId: number;
    timestamp: string;
  };
  holdAmount: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface DisputeMessage {
  id: number;
  disputeId: number;
  fromId: number;
  fromRole: UserRole;
  message: string;
  isInternalNote: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface DisputeEvidence {
  id: number;
  disputeId: number;
  uploaderId: number;
  fileType: string;
  fileName: string;
  filePath: string;
  checksum: string;
  uploadedAt: string;
}

export interface DisputeTimelineEntry {
  id: number;
  disputeId: number;
  action: string;
  actorId: number;
  actorRole: UserRole;
  description: string;
  createdAt: string;
}
```

> **⚠️ Existing `DisputeStatus`** in `types/index.ts:6` has outdated values (`RESOLVED_PROVIDER`, `RESOLVED_CUSTOMER`). Replace with the enum above.

## 2. Zod Schema (`src/schemas/index.ts`)

```ts
export const disputeCreateSchema = z.object({
  bookingId: z.number().positive(),
  disputeCategory: z.enum([
    'SERVICE_NOT_DELIVERED', 'POOR_QUALITY', 'WRONG_PRICE',
    'DAMAGED_PROPERTY', 'PROVIDER_NO_SHOW', 'CUSTOMER_ABUSE',
    'INCOMPLETE_WORK', 'PAYMENT_ISSUE', 'OTHER',
  ] as const),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requestedResolution: z.enum([
    'FULL_REFUND', 'PARTIAL_REFUND', 'REWORK',
    'PAYMENT_RELEASE', 'ACCOUNT_REVIEW', 'OTHER',
  ] as const),
});

export const disputeMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  isInternalNote: z.boolean().optional(),
  attachments: z.array(z.string()).max(5).optional(),
});
```

## 3. Mock API Methods (`src/api/mockApi.ts`)

```
async getDisputes(params?: { userId?: number; role?: string }): Promise<Dispute[]>
async getDisputeById(id: number): Promise<Dispute | null>
async createDispute(data: DisputeCreateInput): Promise<Dispute>
async updateDisputeStatus(id: number, status: DisputeStatus): Promise<Dispute>
async resolveDispute(id: number, resolution: DisputeResolution): Promise<Dispute>

async getDisputeMessages(disputeId: number): Promise<DisputeMessage[]>
async addDisputeMessage(disputeId: number, data: { fromId: number; fromRole: UserRole; message: string; isInternalNote?: boolean }): Promise<DisputeMessage>

async getDisputeEvidence(disputeId: number): Promise<DisputeEvidence[]>
async uploadEvidence(disputeId: number, data: { uploaderId: number; fileType: string; fileName: string; filePath: string }): Promise<DisputeEvidence>

async getDisputeTimeline(disputeId: number): Promise<DisputeTimelineEntry[]>

// Admin
async getAllDisputes(): Promise<Dispute[]>
async getAdminDisputeStats(): Promise<{ open: number; underReview: number; escalated: number; resolved: number }>
```

> **Every POST must include `id: await nextId('disputes')`** (or respective collection name) to avoid json-server UUID generation.

## 4. DB Collections & Query Keys

| Collection | POST id Strategy | Query Key |
|---|---|---|
| `disputes` | `nextId('disputes')` | `['disputes', userId, role]`, `['dispute', id]`, `['admin-disputes']`, `['admin-dispute-stats']` |
| `disputeMessages` | `nextId('disputeMessages')` | `['dispute-messages', disputeId]` |
| `disputeEvidence` | `nextId('disputeEvidence')` | `['dispute-evidence', disputeId]` |
| `disputeTimeline` | `nextId('disputeTimeline')` | `['dispute-timeline', disputeId]` |

`seed.js` and `db.json` must include `disputes: [], disputeMessages: [], disputeEvidence: [], disputeTimeline: []`.

## 5. Create Dispute

### Preconditions
- Booking exists, status = `COMPLETED`
- Current date within dispute window (`SystemSettings.disputeWindowDays` param)
- No active dispute exists for this booking

### Inputs
- `bookingId` — number
- `disputeCategory` — `DisputeCategory`
- `title` — string
- `description` — string
- `requestedResolution` — `DisputeResolutionType`

### Acceptance Criteria
- Dispute created with status `OPEN`
- Timeline entry recorded
- Booking `paymentStatus` set to `DISPUTED`
- Notifications via toast + query invalidation

## 6. Dispute Messaging

### Participants
- Dispute creator (customer or provider)
- Customer Service staff
- Internal notes visible only to CS roles (`CUSTOMER_SERVICE`)

### Rules
- Messages immutable after send (no edit/delete)
- `isInternalNote: true` filtered from non-admin view (`src/store/authStore.ts` role check)

### Acceptance Criteria
- Chronological thread via `['dispute-messages', disputeId]`
- Optimistic UI update or refetch after mutation succeed
- Attachment resolve uses `mockApi.getImageBlob()` (see image storage IP)

## 7. Evidence Upload

### Supported Files
- JPG, PNG, PDF

### Constraints (mock — enforced client-side only)
- Max 5 MB per file
- Max 20 files per dispute

### Storage
- Images → `mockApi.saveImage(data, 'attachments')` → path string
- PDFs → kept as data URL strings (small)

### Metadata
- `uploaderId`, `fileType`, `fileName`, `filePath`, `checksum`

> Checksum = simple `btoa(fileName + uploaderId + uploadedAt)` mock hash, not cryptographic.

## 8. Mediation Workflow

### Description
Self-resolution phase before admin escalation.

### Rules
- Duration defined by `SystemSettings.mediationDurationHours` (default 48h)
- Messages (existing messaging) used for negotiation
- Either side may request escalation → status `ESCALATED`
- Timeout auto-triggers escalation (checked on query load: compare `createdAt` + duration to now)

### Outcomes
- Agreement reached → admin applies resolution
- Timeout → automatic `ESCALATED`
- Escalation requested → `ESCALATED`

## 9. CS Review

### Access
- Restricted to `CUSTOMER_SERVICE` role via `ProtectedRoute role="CUSTOMER_SERVICE"` (route `/customer-service/disputes`)

### Actions
- View full timeline, evidence, messages
- `APPROVE_REFUND` → `RESOLVED`, financial summary recorded
- `REJECT_DISPUTE` → `REJECTED`
- `PARTIAL_SETTLEMENT` → `RESOLVED`
- `RELEASE_ESCROW` → `RESOLVED`
- `CLOSE_CASE` → `CLOSED` (any non-CLOSED status)
- `ESCALATE` → `ESCALATED`

### Requirements
- Mandatory CS comment for all actions
- Action recorded in timeline
- Notification to involved parties

## 10. Resolution & Refund

### Resolution Types
- `FULL_REFUND` — full amount returned
- `PARTIAL_REFUND` — partial amount returned
- `NO_REFUND` — dispute rejected, no financial action
- `REWORK_APPROVED` — provider must redo the service
- `PROVIDER_PAID` — provider receives full payout
- `SPLIT_SETTLEMENT` — amount split between parties
- `ACCOUNT_WARNING` — warning issued, no financial change

### Refund Lifecycle (simplified for mock API)
Refund is NOT a separate transaction entity. Instead:
- `paymentStatus` on the booking is set to `REFUNDED`
- `totalAmountRefunded` field on booking tracks cumulative refund
- Dispute resolution stores the financial summary in `dispute.resolution`

> Rationale: Separate `RefundTransaction` entity adds 6 states + 5 refund types that serve no mock API purpose. The existing `paymentStatus: 'REFUNDED'` on Booking is sufficient.

## 11. State Machine

### States

| Status | Meaning |
|---|---|
| `OPEN` | Created, awaiting initial review |
| `UNDER_REVIEW` | Admin is reviewing |
| `MEDIATION` | Parties negotiating |
| `ESCALATED` | Sent to admin for final decision |
| `RESOLVED` | Decision issued |
| `REJECTED` | Invalid dispute |
| `REFUNDED` | Refund processed (financial outcome of RESOLVED) |
| `CLOSED` | Terminal archive state |

### Allowed Transitions

```
                 ┌── CLOSED (withdrawn by creator)
                 │
OPEN ───────► UNDER_REVIEW ──────► REJECTED
                  │                      │
                  ▼                      ▼
              MEDIATION               CLOSED
                  │
            ╱     │     ╲
           ▼      ▼      ▼
        RESOLVED  │   ESCALATED
           │      │       │
           ▼      ▼       ▼
         REFUNDED  │    RESOLVED
              ╲    │    ╱
               ▼   ▼   ▼
                CLOSED
```

- `OPEN → CLOSED`: Dispute creator may withdraw at any time
- `REJECTED → CLOSED`: Closed after admin rejection (auto or via action)
- `RESOLVED → CLOSED`: Auto-close after resolution applied
- `REFUNDED → CLOSED`: Auto-close after refund processed

## 12. System Parameters (`src/types/index.ts` — add to `SystemSettings`)

```ts
disputeWindowDays: 7;            // How many days after COMPLETED a dispute can be opened
mediationDurationHours: 48;      // Auto-escalation timeout
maxDisputeFiles: 20;             // Max evidence files per dispute
```

## 13. UI Integration

### Routes (`src/App.tsx`)

```tsx
<Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
<Route path="/disputes/:id" element={<ProtectedRoute><DisputeDetailPage /></ProtectedRoute>} />
<Route path="/customer-service/disputes" element={<ProtectedRoute role="CUSTOMER_SERVICE"><CSDisputesPage /></ProtectedRoute>} />
```

### Pages

| Page | Route | Role | Purpose |
|---|---|---|---|---|
| `DisputesPage` | `/disputes` | Any auth | List user's disputes, create new |
| `DisputeDetailPage` | `/disputes/:id` | Involved parties | Full dispute view + messaging + evidence |
| `CSDisputesPage` | `/customer-service/disputes` | CUSTOMER_SERVICE | All disputes, CS review actions |

### Components (new in `src/components/shared.tsx`)
- `DisputeStatusBadge` — color-coded status chip
- `DisputeTimeline` — vertical timeline component

### UI hooks on existing pages
- **BookingsPage**: "Dispute" button on `COMPLETED` bookings with no existing dispute
- **CSDashboardPage** (or existing CS tab in AdminDashboardPage): "Open Disputes" count in stats; "Disputes" tab

## 14. Notifications

Since the app has no notification backend, "notifications" means:
- Toast via `addNotification('message', 'info')` from `uiStore`
- Query invalidation to refresh relevant lists
- Console log for audit trail (existing pattern)

## 15. Implementation Order

1. Types + schemas + db.json/seed.js collections
2. Mock API methods
3. DisputesPage (list + create modal)
4. DisputeDetailPage (messaging + evidence + timeline)
5. AdminDisputesPage (admin actions + resolution)
6. BookingsPage + AdminDashboardPage integration hooks
7. E2E flow test (create → escalate → resolve → close)

## 16. Known Simplifications (Mock API)

- No real file upload limit enforcement (5 MB / 20 files checked client-side only)
- No real escrow system — `holdAmount` is a stored number, booking `paymentStatus` set to `DISPUTED`
- No virus scan, no signed URLs
- Checksum is a mock string, not cryptographic
- Mediation timeout checked on query load, not by a background job
- Admin role guard is client-side (`ProtectedRoute`) — no real authorization layer
