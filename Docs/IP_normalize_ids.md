# ID Normalization — Implementation Plan

## 1. Problem

json-server v1 stores IDs as-is from `db.json`. Because of external edits and the `nextId()` + UUID hybrid from `start-api.mjs`, IDs are a **mixed bag**:

| Record | Field | Stored as | API returns |
|--------|-------|-----------|-------------|
| Booking #1 | `id` | `"1"` (string) | `"1"` |
| Booking #2 | `id` | `2` (number) | `2` |
| User #11 | `id` | `"11"` (string) | `"11"` |
| Service | `id` | `"14"` (string) | `"14"` |

TypeScript types declare `id: number`, but runtime values are strings. Every `===` comparison against a user or entity ID silently fails, causing bugs like "Booking not found" and `actorId: "11"` in timeline entries.

---

## 2. Proposed Solution: Normalize at the API Boundary

Add a single interceptor in `api()` — the only HTTP chokepoint — that coerces all known ID fields to `Number()` on every response. This means:

- **No scattered `Number()` calls** across 20+ callers
- **No future bugs** when new ID comparisons are added
- **Zero impact on seed.js** (writes directly to `db.json`, bypasses API)
- **No change to `db.json` or `start-api.mjs`** required for functionality

### 2a. Define Known ID Fields

```ts
const ID_FIELDS = new Set([
  'id', 'userId', 'customerId', 'providerId', 'serviceId',
  'bookingId', 'disputeId', 'actorId', 'uploaderId', 'raisedById',
  'categoryId', 'familyId',
]);
```

### 2b. Recursive Normalizer

```ts
function normalizeIds<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(normalizeIds) as unknown as T;
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const val = (obj as Record<string, unknown>)[key];
      if (ID_FIELDS.has(key) && typeof val === 'string' && /^\d+$/.test(val)) {
        (obj as Record<string, unknown>)[key] = Number(val);
      } else {
        normalizeIds(val);
      }
    }
  }
  return obj;
}
```

### 2c. Apply in `api()`

```ts
async function api<T>(url: string, options?: RequestInit): Promise<T> {
  // ... fetch unchanged ...
  const data = await res.json();
  return normalizeIds(data) as T;
}
```

That's it. One place. Every response, every collection, every nested object.

### 2d. Remove Old Scattered Fixes

After the interceptor is in place, revert these (they become dead code):
- `Number(b.id) === Number(data.bookingId)` in `createDispute` → back to `b.id === data.bookingId`
- `Number(d.raisedById) === Number(filters.userId)` in `getDisputes` → back to `d.raisedById === filters.userId`
- `normalizeUser()` helper and its callers in `login/register/getMe` → remove
- `Number(actorId)` in `addTimelineEntry` → remove
- `Number()` in DisputesPage select → remove

---

## 3. Optional: Clean Up `db.json` for Consistency

Not required for the fix, but removes confusion:

- Find all `"id": "<number>"` (string) → replace with `"<id>": <number>` (number)
- Same for `customerId`, `providerId`, `serviceId`, `bookingId`, `categoryId`, `familyId`, `raisedById`, `actorId`, `uploaderId`

This is cosmetic only — `normalizeIds` will handle runtime regardless.

---

## 4. Impact on Seed Files (`seed.js`, `start-api.mjs`)

**Zero impact.** Both write data directly to `db.json` via `fs.writeFileSync` or `db.write()`. They completely bypass the `api()` function where normalization lives.

If `seed.js` writes `id: 1` (number), `db.json` stores `"id": 1` (number in JSON), and `normalizeIds` is a no-op. If it writes `id: "1"` (string), `normalizeIds` coerces it on read. Either works.

---

## 5. Future: Migration to Spring Boot

Spring Boot with JPA auto-generates `Long` IDs → Jackson serializes them as JSON numbers → `normalizeIds` becomes a **complete no-op**.

Migration path:
1. Remove `normalizeIds()` from `api()`
2. Remove the mock API layer
3. Wire TanStack Query to real REST endpoints
4. TypeScript types `id: number` remain unchanged — zero refactoring needed

---

## 6. Files Changed

| File | Change |
|------|--------|
| `src/api/mockApi.ts` | Add `ID_FIELDS` Set + `normalizeIds()` function; add `normalizeIds()` call in `api()` |
| `src/api/mockApi.ts` | *(optional)* Revert scattered `Number()` coercions from previous fixes |
| `db.json` | *(optional)* Replace string IDs with numeric IDs for cleanliness |
| `Docs/IP_normalize_ids.md` | This file |

---

## 7. Verification

```bash
npm run build       # zero errors
npm run dev:api     # restart API
npm run dev         # restart frontend
```

### Manual checks

| # | Test | Expected |
|---|------|----------|
| 1 | Login as any user | `user.id` is type `number` in React DevTools |
| 2 | Create a dispute | `actorId` in timeline is `11` not `"11"` (check Network tab) |
| 3 | /bookings page | Bookings load (no empty state) |
| 4 | Browse DB page | All collection IDs are numbers |
| 5 | Review `normalizeIds` coverage | Every ID field in `src/types/index.ts` is in `ID_FIELDS` |
