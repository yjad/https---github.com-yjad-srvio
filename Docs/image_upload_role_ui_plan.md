# Implementation Plan: Image Upload for Services & Role-Based UI

## Part 1 — Image Upload for Services

### Current State

- `Service.image: string` exists in the interface but is always `''` (empty string)
- All service cards use gradient backgrounds with emoji icons (`ServiceListPage.tsx:180-182`, `ServiceDetailPage.tsx:126-128`)
- `db.json` services have **no** `image` field
- `createService()` in `ProviderDashboardPage.tsx:65` hardcodes `image: ''`
- json-server has no file upload capability

### Proposed Solution

Since json-server is a plain REST API with no multipart support, images will be stored as **base64 data URLs** embedded directly in the JSON payload. This is the simplest approach that works with the existing mock API layer without introducing external storage or a separate server.

### Changes

#### 1. Data Layer — `src/api/mockApi.ts`

- **`createService()`**: Accept an `image` field (base64 string) instead of hardcoding `''`
- **`updateService()`**: Already uses `PATCH` with arbitrary fields — pass `image` normally
- **`seedDatabase()`** (if exists): Add placeholder image URLs for initial services — use `https://placehold.co/600x400/3b82f6/white?text=ServiceName` or generate simple SVG data URIs

#### 2. Type — `src/types/index.ts`

- No change needed — `image: string` already exists on `Service`
- Optional: make `image` required (it's always present, just often empty)
- Add a utility type comment: `// image: data URL (base64) for mock API; will be a CDN URL in production`

#### 3. Shared Component — `src/components/shared.tsx`

Add a new component:

```tsx
// ─── ServiceImage ──────────────────────────────────────────
export function ServiceImage({ image, name, className }: { image: string; name: string; className?: string }) {
  const [error, setError] = useState(false);
  if (!image || error) {
    return (
      <div className={cn('bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-4xl', className)}>
        {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
    );
  }
  return (
    <img
      src={image}
      alt={name}
      className={cn('object-cover w-full h-full', className)}
      onError={() => setError(true)}
    />
  );
}
```

This component:
- Falls back to initials on a gray gradient when no image or load error
- Accepts `className` for sizing via `cn()`
- Will be used across ServiceListPage, ServiceDetailPage, ProviderDashboard, AdminDashboard

#### 4. Schema — `src/schemas/index.ts`

Update `serviceSchema` to include an optional image field:

```ts
export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.number().positive(),
  price: z.coerce.number().positive(),
  priceUnit: z.string().min(1),
  duration: z.string().min(1),
  image: z.string().optional(),
});
```

Also add a `categorySchema` if not already present (used by admin category modal):

```ts
export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().min(1, 'Icon is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  color: z.string().min(4, 'Color is required'),
  activationDate: z.string().optional(),
  isActive: z.boolean().optional(),
});
```

#### 5. Image Upload UI — Image Input Component

Add to `src/components/shared.tsx`:

```tsx
export function ImageUpload({ value, onChange, label, error }: {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  error?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string || '');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-center gap-3">
        {value && (
          <img src={value} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          {value ? 'Change Image' : 'Upload Image'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm text-danger-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
```

#### 6. Provider Dashboard — `src/pages/ProviderDashboardPage.tsx`

- **Service Form**: Add `<ImageUpload>` field in the service modal (after price/duration fields)
- **Service Cards**: Replace gradient emoji with `<ServiceImage>` in the services tab display
- **`saveServiceMutation`**: Pass `image` from form state (already passing it but with hardcoded `''`)
- Add `image` to the initial `serviceForm` state

#### 7. Service List Page — `src/pages/ServiceListPage.tsx`

- Replace gradient div (`h-44 bg-gradient-to-br... text-5xl`) in `ServiceCard` with `<ServiceImage>`
- Keep gradient-based implementation as the **fallback** when no image is available

#### 8. Service Detail Page — `src/pages/ServiceDetailPage.tsx`

- Replace gradient div in the hero image area with `<ServiceImage>`
- Keep the category gradient as fallback

#### 9. Admin Dashboard — `src/pages/AdminDashboardPage.tsx`

- **Services Tab**: Add a thumbnail column showing `<ServiceImage size="sm" />`
- **Add Service Modal** (new): Create a dual-purpose service modal (add/edit) with `<ImageUpload>`

#### 10. db.json — Seed data

Add `image` field to each service. Use placeholder URLs compatible with json-server:

```json
"image": "https://placehold.co/600x400/3b82f6/white?text=Deep+House+Cleaning"
```

Since json-server stores JSON literally, you can store either:
- External URLs (simp lest, requires internet)
- Base64 data URLs (works offline, inflates db.json size)

Recommendation: Use external placeholder URLs for seed data, with `ServiceImage` fallback for offline.
Use `https://placehold.co/600x400/{color}/white?text={name}` where `{color}` maps to category color.

### Manual Verification (Image Upload)

1. Log in as a Provider → Dashboard → Services tab → Edit a service → Upload an image → Save
2. Verify the image appears on the provider's service card
3. Navigate to the public service listing → the image shows on the card
4. Open the service detail page → the image shows in the hero area
5. Log in as Admin → Services tab → verify the thumbnail column shows uploaded images

---

## Part 2 — Role-Based UI Plan

### Role Definitions

| Role | Description |
|------|-------------|
| `CUSTOMER` | Browses & books services, leaves reviews, manages profile |
| `PROVIDER` | Offers services, manages bookings, views earnings |
| `ADMIN` | Full platform management (users, services, bookings, categories, settings) |
| `CUSTOMER_SERVICE` | Support role — views bookings, manages disputes (limited scope) |

### Route Access Matrix

| Route | Public | CUSTOMER | PROVIDER | ADMIN | CUSTOMER_SERVICE |
|-------|--------|----------|----------|-------|-------------------|
| `/` (Home) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login` | ✅ | — | — | — | — |
| `/register` | ✅ | — | — | — | — |
| `/services` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/services/:id` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/bookings` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/provider` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/admin` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/admin/settings` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/customer-service` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/profile` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/settings` (user) | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/browsedb` | ✅ | ✅ | ✅ | ✅ | ✅ |

### Navbar Visibility (`src/components/Navbar.tsx`)

| Nav Link | CUSTOMER | PROVIDER | ADMIN | CUSTOMER_SERVICE |
|----------|----------|----------|-------|-------------------|
| Home | ✅ | ✅ | ✅ | ✅ |
| Services | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | — | — |
| Bookings | ✅ | ✅ | — | ✅ |
| Admin | — | — | ✅ | — |
| Settings | — | — | ✅ (system) | — |
| Support | — | — | — | ✅ |

### Existing behavior in Navbar (lines 24-41) already does this correctly. Verify CUSTOMER_SERVICE links.

**Note**: Navbar line 38: `user?.role === 'CUSTOMER_SERVICE'` adds `/customer-service` (labeled "Support") and `/bookings`. This is correct.

### Page-Level Role Behaviors

#### HomePage (`/`)
- **All roles**: Same content — hero, categories, top services, CTA, footer
- No role-specific differentiation needed

#### ServiceListPage (`/services`)
- **All roles**: Same browsing experience
- **CUSTOMER**: Sees "Book Now" CTAs
- **PROVIDER**: Sees "Book Now" CTAs (they can also be customers)
- **ADMIN/CS**: Sees "Book Now" CTAs

#### ServiceDetailPage (`/services/:id`)
- **CUSTOMER**: "Book Now" button → opens booking modal (line 158-161)
- **Unauthenticated**: "Book Now" → redirects to `/login` (line 159)
- **PROVIDER/ADMIN/CS**: Same booking capability — all authenticated users can book
- **Review Modal**: Only available to customers who have a completed booking for this service (future enhancement — currently any authenticated user can open it manually)

#### BookingsPage (`/bookings`)
- **CUSTOMER**: Sees their own bookings (`customerId` filter). Actions: cancel pending bookings.
- **PROVIDER**: Sees bookings for their services (`providerId` filter). Actions: accept/decline/start/complete.
- **ADMIN**: Sees ALL bookings (via `getAllBookings()`). Actions: view details, no status transitions (read-only oversight).
- **CUSTOMER_SERVICE**: Sees ALL bookings. Actions: view details, cancel bookings (future enhancement).

#### ProviderDashboardPage (`/provider`)
- **PROVIDER only** (route guard at App.tsx:80-83)
- Tabs: Overview, Bookings, Services
- Overview: earnings stats, monthly chart, recent bookings
- Bookings: manage booking status transitions
- Services: CRUD own services (add/edit/delete)

#### AdminDashboardPage (`/admin`)
- **ADMIN only** (route guard at App.tsx:86-89)
- Tabs: Overview, Users, Bookings, Reviews, Services, Categories, Financials
- Overview: platform-wide stats, charts
- Users: list all users, edit roles/status
- Bookings: view all bookings with detail modal
- Reviews: view all reviews
- Services: list all services, toggle active/inactive, edit
- Categories: CRUD categories, toggle active/inactive, activation dates
- Financials: transaction log

#### CustomerDashboardPage (`/dashboard`)
- **CUSTOMER only** (route guard at App.tsx:68-71)
- Shows: booking history, spending stats, recent bookings
- Already exists at `src/pages/CustomerDashboardPage.tsx`

#### CustomerServiceDashboardPage (`/customer-service`)
- **CUSTOMER_SERVICE only** (route guard at App.tsx:98-101)
- Already exists at `src/pages/CustomerServiceDashboardPage.tsx`
- Should show: all bookings (read-only), user lookup (future)

### UI Guards (within shared pages)

Pages used by multiple roles should conditionally render role-specific actions:

```tsx
// Pattern for role-aware rendering within a shared page:
const { user } = useAuthStore();

{user?.role === 'PROVIDER' && (
  <Button onClick={...}>Accept Booking</Button>
)}
{user?.role === 'CUSTOMER' && (
  <Button onClick={...}>Cancel Booking</Button>
)}
```

This pattern is already used in `BookingsPage.tsx` (not read yet, but follows the same convention).

### Profile & Settings

| Feature | CUSTOMER | PROVIDER | ADMIN | CUSTOMER_SERVICE |
|---------|----------|----------|-------|-------------------|
| Edit name/phone/bio | ✅ | ✅ | ✅ | ✅ |
| Change password | ✅ | ✅ | ✅ | ✅ |
| Change language | ✅ | ✅ | ✅ | ✅ |
| Profile page route | `/profile` | `/profile` | `/profile` | `/profile` |
| System settings | ❌ | ❌ | `/admin/settings` | ❌ |

### Image Upload — Role Permissions

| Action | CUSTOMER | PROVIDER | ADMIN | CUSTOMER_SERVICE |
|--------|----------|----------|-------|-------------------|
| Upload service image | ❌ | ✅ (own services) | ✅ (any service) | ❌ |
| Delete service image | ❌ | ✅ (own services) | ✅ (any service) | ❌ |
| Upload avatar | ✅ | ✅ | ✅ | ✅ |

### Future Role Enhancement Ideas

1. **CUSTOMER_SERVICE**: Could be granted permission to toggle service active/inactive independently
2. **PROVIDER**: Could have sub-roles (e.g., `PROVIDER_PREMIUM` with featured listing)
3. **CUSTOMER**: No UI administration access by design

---

## Implementation Order

1. Add `ServiceImage` and `ImageUpload` components to `shared.tsx`
2. Update `serviceSchema` with optional `image` field
3. Update mock API to handle `image` in create/update
4. Update ProviderDashboardPage — image upload in service modal
5. Update ServiceListPage — display `ServiceImage` in cards
6. Update ServiceDetailPage — display `ServiceImage` in hero
7. Update AdminDashboardPage — thumbnail column + service add/edit modal
8. Seed placeholder images in `db.json`
9. Verify all loading and empty states for images (no broken images)

## Verification Checklist

- [ ] `npm run build` succeeds with zero errors
- [ ] Zero unused imports
- [ ] All forms use Zod schemas
- [ ] Service list shows real images (or graceful fallback)
- [ ] Service detail shows hero image
- [ ] Provider can upload/change/remove images
- [ ] Admin sees thumbnail in services table
- [ ] Navbar correctly shows/hides links per role
- [ ] Route guards enforce role permissions
- [ ] Loading states for images (skeleton while loading)
- [ ] Empty state for missing images (initials fallback)
