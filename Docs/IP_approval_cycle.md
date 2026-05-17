# Admin / CS: Pending Service Approval & Rejection

Providers set `verificationStatus: 'pending'` on new and edited services. This feature gives both **ADMIN** and **CUSTOMER_SERVICE** roles a dedicated queue to review, approve, or reject those services, with a simulated email notification to the provider on rejection.

---

## Confirmed Decisions (from review)

| Topic | Decision |
|-------|----------|
| Public visibility | **Option A** — pending & rejected services are hidden from all customers |
| Who can approve/reject | **ADMIN** and **CUSTOMER_SERVICE** |
| CS role access | CS gets the **same approvals list** in their own dashboard (`/customer-service`) |
| Rejection flow | Admin/CS must enter a **rejection comment**; a **simulated email** is sent to the provider |
| New service creates | Also flagged `pending` (not just edits) |
| Communication | Full **comment thread** per service — date/from/to stored; provider can **reply + upload documents** |

> [!IMPORTANT]
> The comment thread is the source of truth for all back-and-forth between Srvio staff and the provider. The rejection email is a notification only; the actual conversation lives in the thread.


---

## Proposed Changes

---

### 1. Types

#### [MODIFY] [index.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/types/index.ts)

Add `rejectionNote?: string` to `Service`:
```ts
rejectionNote?: string;
```

Add new **`ServiceComment`** interface:
```ts
export interface ServiceComment {
  id: number;
  serviceId: number;
  fromId: number;
  fromName: string;
  fromRole: UserRole;       // 'ADMIN' | 'CUSTOMER_SERVICE' | 'PROVIDER'
  message: string;
  attachments?: string[];   // base64 data-URIs (documents / images)
  createdAt: string;        // ISO timestamp
}
```

---

### 2. Database

#### [MODIFY] [db.json](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/db.json)

Add a new top-level collection:
```json
"serviceComments": []
```

---


### 3. Mock API

#### [MODIFY] [mockApi.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/api/mockApi.ts)

**`getServices()`** — Add public-facing filter: exclude `verificationStatus === 'pending'` and `=== 'rejected'` _unless_ a `providerId` is specified.

**`createService()`** — Default new services to `verificationStatus: 'pending'` and `isActive: false`.

**`getPendingServices()`** — Returns all services where `verificationStatus === 'pending'`.

**`getServiceComments(serviceId)`** — Returns all comments for a given service, sorted by `createdAt` ascending.

**`addServiceComment(data)`** — Creates a new comment entry:
```ts
addServiceComment(data: {
  serviceId: number;
  fromId: number;
  fromName: string;
  fromRole: UserRole;
  message: string;
  attachments?: string[];
}): Promise<ServiceComment>
```

**`sendRejectionEmail(providerEmail, serviceName, note)`** — Simulated email (console log), mirrors `sendVerificationPin`.

---

### 4. Route Guard — Multi-Role Support

#### [MODIFY] [ProtectedRoute.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/components/ProtectedRoute.tsx)

Change `role` to accept an array:
```ts
role?: UserRole | UserRole[]
// Guard: if array → user.role must be in the array
```

Backward-compatible — all existing single-role usages unchanged.

---

### 5. Shared Thread Component

#### [NEW] [ServiceCommentThread.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/components/ServiceCommentThread.tsx)

A self-contained chat-style component used inside both the approvals panel (admin/CS view) and the provider's reply page.

**Props:**
```ts
interface ServiceCommentThreadProps {
  serviceId: number;
  currentUserId: number;
  currentUserRole: UserRole;
  currentUserName: string;
  allowAttachments?: boolean;
}
```

**Behaviour:**
- `useQuery(['service-comments', serviceId])` → `mockApi.getServiceComments(serviceId)`
- Messages displayed as **chat bubbles**: staff messages (ADMIN/CS) on the left, provider messages on the right
- Each bubble shows: sender name, role badge, timestamp, message text, and any attachments as downloadable links/thumbnails
- Reply form at the bottom: textarea + optional file upload (multi-file, stored as base64 data-URIs) + **Send** button
- `useMutation` → `mockApi.addServiceComment(...)` → invalidates `['service-comments', serviceId]`

**Attachment handling:**
- Images → inline preview thumbnail
- Other documents (PDF etc.) → 📎 filename link for download

#### Comment Edit & Delete

- Users can edit or delete their own comment **only if** no other party has replied after it (checked via `canModifyComment()` in the component)
- **Edit** — Pencil icon on hover turns message into inline textarea; user modifies text and adds/removes attachments; Save (Check) and Cancel (Ban) buttons
- **Delete** — Trash icon on hover triggers `window.confirm()` then `mockApi.deleteServiceComment(id)` + cache invalidation
- Edited comments show an `(edited)` label next to the timestamp
- `ServiceComment` type gains `edited?: boolean` and `editedAt?: string` fields
- `mockApi.updateServiceComment(id, { message, attachments })` sets `edited: true` and `editedAt` via PATCH

---

### 6. Shared Approvals Panel

#### [NEW] [ServiceApprovalsPanel.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/components/ServiceApprovalsPanel.tsx)

Rendered in both AdminDashboardPage (Approvals tab) and CustomerServiceDashboardPage.

**Per-row display:**

| Column | Content |
|--------|---------|
| Image | `ServiceImage` thumbnail |
| Service | name + provider name |
| Category | category name |
| Price | `$price / priceUnit` |
| Submitted | `createdAt` date |
| Actions | **Approve** (green) · **Reject** (red) · **💬 Thread** toggle |

- Clicking **💬 Thread** expands an inline `<ServiceCommentThread />` beneath that row
- **Approve** mutation: `updateService(id, { verificationStatus: 'approved', isActive: true })` + auto-posts approval message to thread
- **Reject** opens a modal: textarea (required, min 10 chars) + **Confirm Rejection** button
  - On confirm: `updateService(id, { verificationStatus: 'rejected', isActive: false, rejectionNote })` + auto-posts rejection note to thread + `sendRejectionEmail(...)`
- Empty state: `<EmptyState icon={<CheckCircle />} title="All caught up!" description="No pending services to review." />`

**Query invalidations on approve/reject:**
```ts
['pending-services'], ['services'], ['admin-stats'], ['admin-all-services'], ['service-comments', id]
```

---

### 7. Admin Dashboard

#### [MODIFY] [AdminDashboardPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/pages/AdminDashboardPage.tsx)

- Change services query → `mockApi.getAllServices()` with key `['admin-all-services']`
- Add **`approvals`** tab (between `services` and `categories`) with live pending count badge: `Approvals (3)`
- Approvals tab renders `<ServiceApprovalsPanel />`
- Add **Verification Status** column to all-services DataTable (colour-coded badges)
- Import `useUIStore` for toast notifications

---

### 8. Customer Service Dashboard

#### [MODIFY] [CustomerServiceDashboardPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/pages/CustomerServiceDashboardPage.tsx)

The CS dashboard currently has **no tabs** — it's a single scrollable page. Convert it to a **2-tab layout**:

| Tab | Contents |
|-----|----------|
| **Overview** | Existing stats grid + recent bookings table (moved as-is, no changes) |
| **Pending Approvals** | Renders `<ServiceApprovalsPanel />` — the full approval cycle (view → thread → approve/reject) |

> [!IMPORTANT]
> **Exactly two tabs — no more.** The Pending Approvals tab is the primary action surface for the CS agent. The Overview tab retains all existing content unchanged.

The tab bar shows a live count badge on "Pending Approvals":
```
Overview  |  Pending Approvals (3)
```

---

### 9. Provider — Service Review & Reply

#### [MODIFY] [ProviderDashboardPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/pages/ProviderDashboardPage.tsx)

Add a **"Reviews"** tab alongside `overview / bookings / services`. Shows only services that have a thread (`verificationStatus` is `pending` or `rejected`, or has existing comments).

**Per service card:**
- Service name + current `verificationStatus` badge
- `<ServiceCommentThread serviceId={svc.id} currentUserId={user.id} currentUserRole="PROVIDER" currentUserName={user.name} allowAttachments={true} />`
- Provider can type a reply and upload supporting documents (licences, photos, etc.)

---

### 10. Notification Text Updates

#### [MODIFY] [ProviderDashboardPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/pages/ProviderDashboardPage.tsx) + [ServiceListPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/pages/ServiceListPage.tsx)

Change create success message: `"Service created!"` → `"Service submitted for review"`


## End-to-End Flow

```
Provider creates/edits service
  → verificationStatus: 'pending', isActive: false
  → Hidden from public /services list
  → Appears in admin & CS approvals queue

Admin / CS reviews service
  → Opens 💬 Thread → can add comment + attachments
  → Provider sees thread in ProviderDashboard → Reviews tab → can reply + upload documents

Admin / CS approves
  → verificationStatus: 'approved', isActive: true
  → Service appears publicly
  → Approval auto-posted as thread message

Admin / CS rejects
  → Opens rejection modal → enters comment (required)
  → verificationStatus: 'rejected', isActive: false, rejectionNote saved
  → Rejection comment auto-posted as thread message
  → Simulated email sent to provider's email
  → Provider sees 'rejected' badge + thread in Reviews tab
  → Provider can reply with explanation + upload supporting documents
  → Admin/CS re-reviews and can approve or reject again
```

---

## Summary of Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `ServiceComment` interface, `rejectionNote` to `Service`; add `edited`, `editedAt` to `ServiceComment` |
| `db.json` | Add `serviceComments: []` collection |
| `src/api/mockApi.ts` | Update `getServices`, `createService`; add `getPendingServices`, `getServiceComments`, `addServiceComment`, `updateServiceComment`, `deleteServiceComment`, `sendRejectionEmail` |
| `src/components/ProtectedRoute.tsx` | Accept `role?: UserRole \| UserRole[]` |
| `src/components/ServiceCommentThread.tsx` | **[NEW]** Chat thread + reply + file upload; add inline edit/delete with `canModifyComment()` permission check |
| `src/components/ServiceApprovalsPanel.tsx` | **[NEW]** Pending services queue with approve/reject + thread |
| `src/pages/AdminDashboardPage.tsx` | Add Approvals tab, verification status column, fix services query |
| `src/pages/CustomerServiceDashboardPage.tsx` | Embed `<ServiceApprovalsPanel />` |
| `src/pages/ProviderDashboardPage.tsx` | Add Reviews tab with `<ServiceCommentThread />` per service, update notifications |
| `src/pages/ServiceListPage.tsx` | Update create notification text |

---

## Verification Plan

### Build
```bash
npm run build
```

### Manual Checks
1. Provider creates new service → shows `pending` badge on their dashboard, **not** on public `/services`
2. Admin opens Approvals tab → sees service with count badge `(1)`
3. CS logs in → `/customer-service` → sees same pending service
4. Admin adds a thread comment → provider sees it in the Reviews tab
5. Provider replies with text + uploads a document → admin/CS sees it in the thread
6. Admin approves → service live publicly, approval auto-posted to thread, count badge clears
7. Admin rejects → rejection modal opens, empty comment blocked → fills in note → service rejected, note auto-posted to thread, simulated email logged to console
8. All-Services tab → Verification Status column shows colour-coded badges
9. `npm run build` → zero TypeScript errors


---

## Design Decisions

> [!IMPORTANT]
> **Public visibility of pending services** — Two options:
>
> | Option | Behaviour |
> |--------|-----------|
> | **A — Hide until approved** (recommended) | `getServices()` additionally filters out `verificationStatus === 'pending'` and `=== 'rejected'`. Customers only see approved services. Providers see their own regardless. |
> | **B — Show with badge** | Keep current behaviour; pending services are publicly visible with a "Pending" badge. |
>
> The current code already shows the badge on the provider's own card view, but customers browsing the public list can also see them. **Please confirm which option you want.** The plan below implements **Option A** (hide from public until approved).

> [!NOTE]
> **New services (not edits)** — When a provider creates a *brand-new* service, `verificationStatus` is `undefined` (not set). Currently `ServiceListPage` / `ProviderDashboardPage` only send `verificationStatus: 'pending'` on **edits**. The plan sets it to `'pending'` on **both** create and edit, so all new services enter the approval queue.

> [!NOTE]
> **`CUSTOMER_SERVICE` role** — The existing hint text in the provider modal says "until a Customer Service agent approves". The plan scopes approval actions to **ADMIN** only (as specified in the request), but the same mutations would work for `CUSTOMER_SERVICE` if you later want to expand access.

---

## Open Questions

1. **Should brand-new services (first-time creates) also require approval?** Currently only edits are flagged `pending`. Recommend: yes, flag all new services pending too.
2. **Public visibility choice** — Option A (hide until approved) or Option B (show with badge)?
3. **Rejection reason** — Should the admin be able to leave a rejection note/comment that the provider can see? (Adds a `rejectionNote?: string` field to `Service`.)

---

## Proposed Changes

### `src/api/mockApi.ts`

#### [MODIFY] [mockApi.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/api/mockApi.ts)

- **`getServices()`** — Add filter: exclude services where `verificationStatus === 'pending'` or `=== 'rejected'` (unless `providerId` is set, in which case providers still see their own pending services).
- **`createService()`** — Add `verificationStatus: 'pending'` and `isActive: false` to all new services by default, so they enter the approval queue.

No new API methods needed — approval/rejection uses the existing `updateService(id, { verificationStatus, isActive })`.

---

### `src/pages/AdminDashboardPage.tsx`

#### [MODIFY] [AdminDashboardPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/Srvio/src/pages/AdminDashboardPage.tsx)

**1. Switch services query to `getAllServices()`**

The current query uses `mockApi.getServices()` which filters `isActive: false`. The admin needs to see everything including pending/rejected/inactive services. Change to `mockApi.getAllServices()`.

**2. Add `approvals` tab to the tab bar** (between `services` and `categories`)

The tab label shows a live count badge: `Approvals (3)` so the admin immediately knows how many are pending.

```
overview | users | bookings | reviews | services | approvals | categories | financials
```

**3. Approvals tab content**

A dedicated section for `verificationStatus === 'pending'` services only. Each row shows:

| Field | Detail |
|-------|--------|
| Service image (thumbnail) | `ServiceImage` component |
| Name | clickable → service detail |
| Provider | name |
| Category | from `categoryId` |
| Price | `$price / priceUnit` |
| Submitted | `createdAt` |
| Actions | **Approve** (green) + **Reject** (red) buttons |

Empty state: `EmptyState` with a `CheckCircle` icon — "No pending services. All caught up! 🎉"

**4. Two mutations** (added near the top with the other mutations)

```ts
const approveService = useMutation({
  mutationFn: (id: number) => mockApi.updateService(id, { verificationStatus: 'approved', isActive: true }),
  onSuccess: () => {
    addNotification('Service approved and is now live', 'success');
    queryClient.invalidateQueries({ queryKey: ['admin-all-services'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    queryClient.invalidateQueries({ queryKey: ['services'] }); // public list
  },
});

const rejectService = useMutation({
  mutationFn: (id: number) => mockApi.updateService(id, { verificationStatus: 'rejected', isActive: false }),
  onSuccess: () => {
    addNotification('Service rejected', 'info');
    queryClient.invalidateQueries({ queryKey: ['admin-all-services'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  },
});
```

**5. `verificationStatus` column added to the all-services tab**

Add a `Verification` column to the existing services DataTable showing a colour-coded badge:
- `approved` → green badge  
- `pending` → yellow badge  
- `rejected` → red badge  
- `undefined` → grey "—"

**6. `addNotification` import**

`useUIStore` is not currently imported in `AdminDashboardPage`. Add it for toast feedback on approve/reject.

---

### `src/pages/ProviderDashboardPage.tsx` + `src/pages/ServiceListPage.tsx`

#### [MODIFY] Both pages — `createService` call

Add `verificationStatus: 'pending'` to the payload when **creating** a new service (currently only edits set this). This ensures all new services go through approval.

---

## Verification Plan

### Build Check
```
npm run build
```

### Manual Verification
1. **Provider creates new service** → `verificationStatus: 'pending'`, not visible on public services list
2. **Admin opens Approvals tab** → sees the pending service with count badge
3. **Admin clicks Approve** → service moves to `approved`, appears on public list, notification shown, pending count decreases
4. **Admin clicks Reject** → service `rejected`, stays off public list, notification shown
5. **Provider edits existing service** → re-enters pending queue, disappears from public list until approved again
6. **Approvals tab empty** → shows empty state "All caught up"
7. **All-Services tab** → shows `verificationStatus` badge column with colour coding
