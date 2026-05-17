# Service Family Layer — Implementation Plan

Add a **Service Family** grouping layer on top of the existing Category hierarchy. Families group related categories (e.g., "Home Services", "Instant Delivery", "Scheduled Services").

---

## 1. Motivation

Currently all 6 categories (Cleaning, Plumbing, Electrical, etc.) sit flat at the same level. As the platform grows to include delivery, recurring bookings, and other verticals, a family grouping lets customers navigate by broad service type first, then drill into specific categories.

**Hierarchy after change:**
```
Service Family  ──has──►  Category  ──has──►  Service
   (e.g. Home Services)    (e.g. Cleaning)     (e.g. Deep Clean)
```

---

## 2. Data Model Changes

### 2a. New Interface — `ServiceFamily`

Add to `src/types/index.ts`:

```ts
export interface ServiceFamily {
  id: number;
  name: string;
  description: string;
  icon: string;          // lucide icon name, e.g. "Home", "Truck", "Calendar"
  color: string;         // hex colour for UI accent
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}
```

### 2b. Modify `Category`

Add a single optional field:

```ts
export interface Category {
  // ... existing fields (name, icon, description, color, serviceCount, isActive, activationDate)
  familyId?: number;    // NEW — foreign key to ServiceFamily.id
}
```

**Decision**: Normalised hierarchy. `Service` stores only `categoryId` (no direct `familyId`). Family is resolved at query time via the category.

### 2c. Visibility Rule

| Audience | Families shown | API used |
|----------|---------------|----------|
| Public (customers, providers) | Only `isActive === true` | `getServiceFamilies()` |
| Admin (dashboard) | All (active + inactive) | `getAllServiceFamilies()` |

If a family is deactivated:
- It vanishes from **all** public-facing UI: HomePage tab bar, ServiceListPage pills, ServiceDetailPage breadcrumb, ProviderDashboardPage category `<optgroup>`
- Admin can still see and re-activate it in the Admin Dashboard → Families tab
- Categories belonging to an inactive family still exist but their family grouping is hidden. In the provider's category `<select>`, ungrouped categories appear under "Other". On HomePage/ServiceListPage they show only when no family filter is active.

---



## 3. Database Seed (`db.json`)

### New collection at the top level:

```json
"serviceFamilies": [
  {
    "id": 1,
    "name": "Home Services",
    "description": "Professional home maintenance, repair, and improvement",
    "icon": "Home",
    "color": "#3b82f6",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2025-01-01"
  },
  {
    "id": 2,
    "name": "Instant Delivery",
    "description": "Fast on-demand delivery of goods, food, and parcels",
    "icon": "Truck",
    "color": "#f59e0b",
    "isActive": true,
    "sortOrder": 2,
    "createdAt": "2025-01-01"
  },
  {
    "id": 3,
    "name": "Scheduled Services",
    "description": "Recurring and appointment-based professional services",
    "icon": "Calendar",
    "color": "#10b981",
    "isActive": true,
    "sortOrder": 3,
    "createdAt": "2025-01-01"
  }
]
```

### Update existing categories:

Add `"familyId": 1` to all 6 existing categories (Cleaning, Plumbing, Electrical, Handyman, Painting, Landscaping).

### Update `seed.js`:

- Add `serviceFamilies: []` to the default fallback object
- Add `familyId: 1` to default category data

---

## 4. Mock API (`src/api/mockApi.ts`)

### 4a. New Methods

| Method | Signature | Returns | Notes |
|--------|-----------|---------|-------|
| `getServiceFamilies()` | `() => ServiceFamily[]` | Active families sorted by `sortOrder` | **Sole source for all public views** (HomePage tabs, ServiceListPage pills, ServiceDetailPage breadcrumb, ProviderDashboard `<optgroup>`). Filters `isActive !== false`. |
| `getAllServiceFamilies()` | `() => ServiceFamily[]` | All families regardless of status | Admin Dashboard only. Used by Families CRUD tab and Category editor (so admins can assign categories even to inactive families). |
| `getServiceFamilyById(id)` | `(number) => ServiceFamily \| null` | Single family | |
| `createServiceFamily(data)` | `(Partial<ServiceFamily>) => ServiceFamily` | Created family | Uses `nextId()` |
| `updateServiceFamily(id, data)` | `(number, Partial<ServiceFamily>) => ServiceFamily` | Updated family | PATCH |
| `deleteServiceFamily(id)` | `(number) => void` | — | DELETE; sets `familyId = undefined` on affected categories |
| `getCategoriesByFamily(familyId)` | `(number) => Category[]` | Categories in a family | Filters `/categories?familyId=N` |

### 4b. Modified Methods

- **`getServices(params)`** — Add optional `familyId` param. When present:
  1. Fetch categories for that family via `getCategoriesByFamily(familyId)`
  2. Extract their IDs
  3. Add `categoryId=id1&categoryId=id2&...` to the query string
- **`getAllServices()`** — Same optional `familyId` support for the admin view.
- **`createCategory(data)`** — Accept and persist optional `familyId`.
- **`resetDatabase()`** — Add `'serviceFamilies'` to the collections array that gets cleared.

---

## 5. Zod Schemas (`src/schemas/index.ts`)

### New schema:

```ts
export const serviceFamilySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  icon: z.string().min(1, 'Icon name is required'),
  color: z.string().min(4, 'Colour is required'),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
```

### Modified schema:

Add `familyId: z.number().positive().optional()` to `categorySchema`.

---

## 6. Filter Store (`src/store/filterStore.ts`)

Add `family` field alongside `category`:

```ts
interface FilterState {
  family: number | null;   // NEW
  category: number | null;
  priceMin: number | null;
  priceMax: number | null;
  search: string;
  sortBy: 'rating' | 'price_asc' | 'price_desc' | 'name';
}
```

New store actions:

- `setFamily(family: number | null)` — When family changes, also reset category to `null`
- `resetFilters()` — Also clears `family`

---

## 7. URL Sync (`ServiceListPage.tsx`)

Add `?family=N` to URL search params, synced with filter store via `useEffect` (same pattern as current `?category=` sync).

Rules:
- `family=1&category=3` — valid, shows category 3 within family 1
- `family=1` alone — shows all categories in family 1
- `category=3` without family — shows category 3 regardless of family (backward compatible)
- No params — shows all (current behaviour)

---

## 8. UI Changes

### 8a. HomePage (`src/pages/HomePage.tsx`)

**Current**: Static 2×3 grid of all 6 categories with hardcoded `categoryColors` map.

**After**:

1. **Family Tab Bar** — Horizontal row of pill-shaped buttons below the hero, one per **active** family (from `getServiceFamilies()`), using the family's `color` as the active indicator. Inactive families are invisible here.
2. **Default selection**: first active family by `sortOrder` (Home Services)
3. **Category Grid** — Filters to show only categories whose `familyId` matches the selected family
4. **Remove hardcoded `categoryColors`**: Use `categories.find(c => c.id === service.categoryId)?.color` instead

```
[ Home Services ]  [ Instant Delivery ]  [ Scheduled Services ]
  ┌──────┐  ┌──────┐  ┌──────┐
  │🧹    │  │🪠    │  │⚡    │
  │Clean │  │Plumb │  │Elect │
  └──────┘  └──────┘  └──────┘
  ┌──────┐  ┌──────┐  ┌──────┐
  │🛠️    │  │🎨    │  │🌿    │
  │Handy │  │Paint │  │Land  │
  └──────┘  └──────┘  └──────┘
```

Empty state when a family has no categories: `<EmptyState>` with message "No categories in this family yet."

### 8b. ServiceListPage (`src/pages/ServiceListPage.tsx`)

**Current**: Category `<select>` dropdown with "All Categories" option.

**After**:

1. **Family Pills Row** — Below the "All Services" heading, above the search bar. Each pill is a clickable `<button>` showing the family name and icon. Active pill is filled with the family's `color`. **Only active families appear** — inactive families are omitted.
2. **Category Dropdown** — When a family is active, the category dropdown shows only categories in that family. When no family is selected, shows all categories (current behaviour), grouped by active families (categories in inactive families fall under "Other").

3. **Query propagation** — `?family=N&category=M` in URL; `getServices({ familyId, category, search, priceMin, priceMax, sortBy })`.

4. **Remove hardcoded `categoryGradients`/`categoryIcons`** — Replace with dynamic lookup from fetched categories.

5. **Active filter badges** — Show family badge alongside category badge, each with X to clear individually, plus "Reset All" clears both.

### 8c. ServiceDetailPage (`src/pages/ServiceDetailPage.tsx`)

**Current**: Hardcoded `categoryGradients`/`categoryIcons` maps.

**After**:

1. **Breadcrumb** — Above the service title: `ServiceFamily.name / Category.name` (only if the category has a family and that family is active; if the family is inactive or unset, show just the category name without a breadcrumb).
   ```
   Home Services / Cleaning
   ──────────────────────────────
   [Hero image]
   Deep Cleaning Service
   ```
2. **Links**: Family name links to `/services?family=N` (only for active families); Category name links to `/services?family=N&category=M`.
3. **Remove hardcoded maps** — Use dynamic lookups from the categories array.

### 8d. ProviderDashboardPage (`src/pages/ProviderDashboardPage.tsx`)

**Current**: Flat `<select>` of all categories for the Add/Edit Service modal.

**After**: Grouped by active families using `<optgroup>`. Only active families produce their own `<optgroup>`. Categories in inactive families (or with no family) fall under a catch-all "Other" group:

```html
<select>
  <optgroup label="Home Services">
    <option value="1">🧹 Cleaning</option>
    <option value="2">🪠 Plumbing</option>
    <option value="3">⚡ Electrical</option>
    ...
  </optgroup>
  <optgroup label="Instant Delivery">
    <!-- empty or future categories -->
  </optgroup>
  <optgroup label="Other">
    <!-- categories without familyId -->
  </optgroup>
</select>
```

### 8e. AdminDashboardPage (`src/pages/AdminDashboardPage.tsx`)

**Current**: Tabs: overview / users / bookings / reviews / services / approvals / categories / financials / disputes / browse-db

**After**:

1. **New "Families" tab** — Inserted between "approvals" and "categories". Shows **all families** (active + inactive) fetched via `getAllServiceFamilies()`.
2. **Families DataTable**:
   | Column | Content |
   |--------|---------|
   | ID | monospace |
   | Icon | lucide icon rendered inline |
   | Name | family name |
   | Colour | small coloured circle swatch |
   | Sort Order | number |
   | Status | `<Badge>` **Active** (green) / **Inactive** (grey) |
   | Actions | Edit · Toggle Status · Delete |
3. **Add Family Modal**: Fields — Name, Description, Icon (text input — lucide icon name), Colour (colour picker), Sort Order (number), Status (toggle Active/Inactive). Zod validated via `serviceFamilySchema`.
4. **Edit Family Modal**: Pre-populated same fields.
5. **Toggle Status**: One-click action in the table to flip `isActive`. When deactivating: the family vanishes from all public views immediately on next `getServiceFamilies()` query. When reactivating: it reappears.
6. **Delete Family**: Confirmation dialog: *"Delete [Name]? Categories in this family will be unlinked."* On confirm → `deleteServiceFamily(id)` → invalidate queries.
7. **Modified "categories" tab**: Add "Family" column (resolved family name, shows even for inactive families); Add family `<select>` in Add/Edit Category modal (populated from `getAllServiceFamilies()` so admin can assign to inactive families).

### 8f. Footer (HomePage)

Current has hardcoded links `/services?category=1` through `?category=4`. Replace with links to the first few **active** families: `/services?family=1`, `/services?family=2` (dynamic from `getServiceFamilies()`).

---

## 9. Shared Components

No new shared components needed if the family pill is only used in ServiceListPage. If reused across HomePage and ServiceListPage, extract a `FamilyPillBar` component in `shared.tsx`:

```ts
interface FamilyPillBarProps {
  families: ServiceFamily[];
  selectedFamily: number | null;
  onSelect: (familyId: number | null) => void;
}
```

Decision point in implementation.

---

## 10. End-to-End Flow

```
Admin logs in → Admin Dashboard → Families tab
  → Creates 3 families: Home Services, Instant Delivery, Scheduled Services
  → Assigns all 6 existing categories to Home Services

Admin deactivates Instant Delivery
  → Family table shows Status: Inactive (grey badge)
  → Family disappears from all public views immediately

Provider logs in → Provider Dashboard → Add Service
  → Category picker shows <optgroup> for Home Services only
  → Instant Delivery optgroup is absent (inactive)
  → Picks "Cleaning" under "Home Services"

Customer visits HomePage
  → Sees Family Tab Bar below hero — only "Home Services" and "Scheduled Services" visible
  → Instant Delivery pill is gone
  → Clicks "Home Services" → sees 6 category cards
  → Clicks "Cleaning" → navigates to /services?family=1&category=1

Customer visits /services directly
  → Family pills show only active families
  → "All" selected by default → shows all categories across all active families
  → Clicks "Scheduled Services" → empty state (no categories assigned yet)

Service detail page
  → Breadcrumb: Home Services / Cleaning
  → Each breadcrumb segment links to filtered browse page

Admin reactivates Instant Delivery
  → Family reappears on all public views on next page load
```

---

## 11. Summary of Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `ServiceFamily` interface; add `familyId?: number` to `Category` |
| `db.json` | Add `serviceFamilies` collection with 3 families; add `familyId: 1` to all 6 categories |
| `seed.js` | Add `serviceFamilies: []` to defaults; add `familyId` to category defaults |
| `src/schemas/index.ts` | Add `serviceFamilySchema`; add `familyId` to `categorySchema` |
| `src/api/mockApi.ts` | Add 7 new methods; update `getServices`/`getAllServices` for `familyId` param; update `createCategory`; update `resetDatabase` |
| `src/store/filterStore.ts` | Add `family` state + `setFamily` action |
| `src/pages/HomePage.tsx` | Add family tab bar; filter categories by family; remove hardcoded `categoryColors` |
| `src/pages/ServiceListPage.tsx` | Add family pills; group category dropdown by family; URL sync `?family=N`; pass `familyId` to `getServices`; remove hardcoded maps |
| `src/pages/ServiceDetailPage.tsx` | Add breadcrumb; remove hardcoded maps |
| `src/pages/AdminDashboardPage.tsx` | Add Families CRUD tab; add family column + picker to Categories tab |
| `src/pages/ProviderDashboardPage.tsx` | Group category `<select>` by family via `<optgroup>` |
| `src/components/shared.tsx` | *(if needed)* Extract `FamilyPillBar` |

---

## 12. Verification Plan

### Build
```bash
npm run build     # zero TypeScript errors, zero unused imports
npm run dev:api   # json-server on port 3000 (run first)
npm run dev       # Vite on port 5173 (run second)
```

### Manual Checks

| # | Test | Expected |
|---|------|----------|
| 1 | Admin creates 3 families via Families tab | Families appear in DataTable; sort order respected; all active by default |
| 2 | Admin edits a family (name, icon, colour, order) | Table updates; UI reflects new values |
| 3 | Admin deletes a family | Confirmation dialog shown; categories in that family get `familyId` cleared; family removed from table |
| 4 | Admin toggles a family inactive | Status badge changes to Inactive; family vanishes from HomePage, ServiceListPage pills, breadcrumb, and provider `<optgroup>` immediately on next query |
| 5 | Admin toggles same family back to active | Status badge changes to Active; family reappears in all public views |
| 6 | Admin assigns categories to families | Category editor shows family picker (includes inactive families); Categories table shows family column (including inactive family names) |
| 7 | Provider creates a service | Category `<select>` is grouped by active families only via `<optgroup>`; categories in inactive families fall under "Other" |
| 8 | HomePage shows family tab bar | Only active families shown as pills; clicking a family filters categories; inactive family is absent |
| 9 | ServiceListPage family pills | Only active families shown; selecting a family filters category dropdown; URL shows `?family=N`; services filtered |
| 10 | ServiceListPage URL sync | Navigating to `/services?family=1&category=2` restores both filters on page load |
| 11 | ServiceDetailPage breadcrumb | Shows "Home Services / Cleaning" above title; breadcrumb hidden if family is inactive; no hardcoded gradient errors |
| 12 | Reset filters | "Reset All" clears both family and category |
| 13 | Browser DB page | `serviceFamilies` collection visible and readable |
| 14 | `npm run build` | Zero errors |

---

## 13. Open Questions

**Q1. Family-aware service filtering on the API side?**
The current `getServices()` uses json-server query params. To filter by family, we fetch category IDs for the family first, then add `categoryId` params. This is two round-trips but keeps the server stateless. Alternative: add `familyId` directly to `Service` (denormalised). **Plan uses the normalised approach (2 round-trips).**

**Q2. Family icon rendering?**
Storing lucide icon names as strings. The UI will use a lookup/mapping function `getLucideIcon(name)` or just a controlled set of ~12 supported icons. **Plan: direct string → dynamic import pattern, or maintain a constant map.**

**Q3. Should "All Families" option exist in the pill bar?**
Yes — a pill option to clear the family filter and show everything (current behaviour). Represented as `family === null`. **Plan: first pill is "All" (no icon, grey outline) which resets family to null.**

**Q4. What happens in the category dropdown when no family is selected on ServiceListPage?**
**Plan: show all categories (current behaviour), grouped by active families with separators. Categories in inactive families fall under "Other".**

**Q5. What happens to categories when their family is deactivated?**
Categories keep their `familyId` reference (no data loss). They simply stop appearing grouped under that family in public UI and fall under "Other" in flat lists. When the family is reactivated, categories automatically reappear in their group.
