# Goal Description
This document outlines the technical specifications and requirements for enabling Administrators to maintain services (Add, Modify, Stop/Deactivate, Activate) within the FastServ platform.

Currently, the Admin Dashboard provides tabs for Overview, Users, Bookings, and Reviews. To give admins full control over the platform's offerings, we will introduce a new **Services** tab. This tab will allow admins to oversee all services, modify their details, suspend them from being booked, and create new services on behalf of providers.

## User Review Required
Please review the proposed specifications below to ensure they meet your business requirements before we proceed with the actual implementation.

> [!IMPORTANT]
> The current `Service` model does not have an active/inactive state. We will introduce an `isActive` boolean to allow soft-deactivating services without deleting the booking history associated with them.

## Proposed Changes

### Data Model & API Changes
- **`src/types/index.ts`**: Add `isActive?: boolean` to the `Service` interface.
- **`src/api/mockApi.ts`**:
  - Update `seedDatabase()` to assign `isActive: true` to all initial services.
  - Modify `getServices(params)` to only return services where `isActive !== false` (so customers don't see deactivated services).
  - Modify `createService(data)` to default to `isActive: true`.
  - `updateService` already exists and will be used to toggle the `isActive` flag.

### Admin Dashboard UI (`src/pages/AdminDashboardPage.tsx`)
- **Navigation**: Add a new `'services'` tab alongside Overview, Users, Bookings, and Reviews.
- **Data Table**: Display a list of all services including their ID, Name, Provider, Category, Price, and Status (Active/Inactive).
- **Actions**:
  - **Toggle Status**: A quick action button in the table to toggle a service between Active and Inactive.
  - **Edit Service**: A button opening a modal to edit service details (name, description, price, etc.).
  - **Add Service**: A top-level button above the table to create a brand new service, assigning it to an existing Provider.

### Modals & Forms
- **Service Modal**: A dual-purpose modal for Adding and Editing.
  - Fields: Service Name, Description, Category (Dropdown), Provider (Dropdown), Price, Price Unit, Duration.
  - Integration: TanStack Query mutations for `createService` and `updateService`.
  - Validation: Form validation to ensure all required fields are provided.


### Category Management
- **Data Model & API Changes**
  - **`src/types/index.ts`**: Add optional fields `isActive?: boolean` and `activationDate?: string` to the `Category` interface.
  - **`src/api/mockApi.ts`**:
    - Update `seedDatabase()` to set `isActive: true` and `activationDate` to today’s date for each category.
    - `getCategories()` should return only categories where `isActive === true && new Date(activationDate) <= new Date()` (i.e., active and past activation date).
    - Add `createCategory(data)` that defaults `isActive: true` and `activationDate` to today (or to a supplied date).
    - Add `updateCategory(id, data)` that can toggle `isActive` and modify `activationDate`.
    - When a category is **deactivated** (`isActive: false`), automatically set `isActive: true` for **all services** belonging to that category so they become visible.
- **Admin Dashboard UI (`src/pages/AdminDashboardPage.tsx`)**
  - Add a new `'categories'` tab beside the existing tabs.
  - Render a table listing ID, Name, Icon, Description, Color, Activation Date, Status, and Actions.
  - **Actions**:
    - **Toggle Status**: Deactivating a category re‑activates all its services.
    - **Edit Category**: Opens a modal to edit the fields.
    - **Add Category**: Opens a modal to create a new category with an activation date.
- **Modals & Forms**
  - **Category Modal**: Dual‑purpose add/edit modal.
    - Fields: Name, Icon, Description, Color, Activation Date, Status.
    - Use Zod schema for validation and TanStack Query mutations (`createCategory`, `updateCategory`).
- **Verification Plan**
  - Manual steps to ensure category activation dates control visibility and deactivating a category activates its services.


### Automated Tests
- No automated tests required for this change as we are using a mock API and json-server in the future.

### Manual Verification
1. Log in as an Admin user.
2. Navigate to the Admin Dashboard and click the new "Services" tab.
3. Click "Add Service" and verify the new service appears in the list.
4. Click the "Deactivate" toggle on a service, log out, and log in as a Customer to verify the service no longer appears in the marketplace.
5. Log back in as Admin, modify the service details, and verify the changes persist.
