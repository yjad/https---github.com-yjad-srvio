# Add CUSTOMER_SERVICE Role

This plan outlines the steps to introduce a new `CUSTOMER_SERVICE` role into the srvio application, ensuring it is correctly integrated into all layers of the application.

## User Review Required

> [!IMPORTANT]
> The `CUSTOMER_SERVICE` role will have permissions similar to `ADMIN` but potentially focused on booking management. For now, we will grant them access to see all bookings and a dedicated dashboard.

## Proposed Changes

### Core Types & Validation

#### [MODIFY] [types/index.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/types/index.ts)
- Add `'CUSTOMER_SERVICE'` to `UserRole` union.

#### [MODIFY] [schemas/index.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/schemas/index.ts)
- Update `registerSchema` role enum to include `CUSTOMER_SERVICE`.

---

### Mock Data & API

#### [MODIFY] [api/mockApi.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/api/mockApi.ts)
- Add a mock `CUSTOMER_SERVICE` user in `seedDatabase` (Email: `cs@srvio.com`, Password: `cs123`).
- Update `register` method signature to include `CUSTOMER_SERVICE` in the role parameter.
- Update `getBookings` to return all bookings if the role is `CUSTOMER_SERVICE`.

---

### UI Components

#### [MODIFY] [components/Navbar.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/components/Navbar.tsx)
- Add navigation link for `/customer-service` when the user has the `CUSTOMER_SERVICE` role.
- Update role badge colors to include a specific style for `CUSTOMER_SERVICE`.

#### [MODIFY] [pages/ProfilePage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/pages/ProfilePage.tsx)
- Update role badge colors for the profile sidebar.

#### [MODIFY] [pages/BookingsPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/pages/BookingsPage.tsx)
- Update header title and subtitle for `CUSTOMER_SERVICE`.

---

### New Dashboard & Routing

#### [NEW] [CustomerServiceDashboardPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/pages/CustomerServiceDashboardPage.tsx)
- Create a new dashboard page for customer service agents.
- Show key support metrics and recent activities.

#### [MODIFY] [App.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/App.tsx)
- Add route for `/customer-service` protected by the `CUSTOMER_SERVICE` role.

---

## Verification Plan

### Manual Verification
- Login as the new `CUSTOMER_SERVICE` user (`cs@srvio.com` / `cs123`).
- Verify the Navbar shows the "Support" link.
- Verify the Customer Service Dashboard loads correctly.
- Verify the Bookings Page shows all bookings across the platform.
- Check the Profile Page to ensure the role badge is correctly styled.
- Verify that standard customers and providers cannot access the `/customer-service` route.
