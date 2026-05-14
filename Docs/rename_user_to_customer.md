# Rename 'USER' role to 'CUSTOMER' and Implement Customer Dashboard

The goal is to align the codebase with the business terminology by renaming the `USER` role to `CUSTOMER` and providing a dedicated dashboard for customers to manage their bookings and view spending statistics.

## User Review Required

> [!IMPORTANT]
> The internal role identifier `'USER'` will be changed to `'CUSTOMER'`. Users with the old `'USER'` role in their `localStorage` might need to clear their cache or I will add a small migration logic in `mockApi` to handle it.

## Proposed Changes

### Core Types and Schemas

#### [MODIFY] [types/index.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/types/index.ts)
- Update `UserRole` type: `'USER'` -> `'CUSTOMER'`.

#### [MODIFY] [schemas/index.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/schemas/index.ts)
- Update `registerSchema` to use `CUSTOMER` instead of `USER`.

### API and Data

#### [MODIFY] [api/mockApi.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/api/mockApi.ts)
- Update seed data users to have `role: 'CUSTOMER'`.
- Update `register` method signature and logic.
- Update `getBookings` logic to check for `CUSTOMER` role.
- Update `getAdminStats` to use `CUSTOMER` instead of `USER`.
- Add `getCustomerStats` method to provide data for the new dashboard.

### Store

#### [MODIFY] [store/authStore.ts](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/store/authStore.ts)
- Update `register` data type.

### Components

#### [MODIFY] [components/Navbar.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/components/Navbar.tsx)
- Update role check: `user?.role === 'CUSTOMER'`.
- Update links for customers to include "/dashboard".

### Pages

#### [MODIFY] [pages/AuthPages.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/pages/AuthPages.tsx)
- Update register form state and UI to use `CUSTOMER`.

#### [MODIFY] [pages/BookingsPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/pages/BookingsPage.tsx)
- Update role checks to use `CUSTOMER`.

#### [NEW] [pages/CustomerDashboardPage.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/pages/CustomerDashboardPage.tsx)
- Create a new dashboard page for customers featuring:
    - Stats cards (Total Bookings, Spent Amount, Pending, Active).
    - Monthly spending chart.
    - Recent bookings list.

### Routing

#### [MODIFY] [App.tsx](file:///c:/Yahia/Home/Yahia-Dev/Python/SDD/FastServ/src/App.tsx)
- Add route for `/dashboard` protected by `CUSTOMER` role.
- Update `/bookings` to be accessible by both but primarily used by providers (or kept as is).

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure type consistency and no unused imports.

### Manual Verification
- Login as a customer (john@email.com) and verify the new dashboard is visible and accurate.
- Register as a new customer and verify the role is correctly set to `CUSTOMER`.
- Check that the Navbar links correctly to `/dashboard` for customers.
