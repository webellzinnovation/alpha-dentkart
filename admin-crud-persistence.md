# Admin CRUD & Persistence Fix

## Goal
Fix the 9+ broken CRUD operations in the Admin Dashboard and ensure all data persists to the backend with proper validation and UI feedback.

## Defaults (Assumed from "next")
- **API File:** Continue using `utils/api.ts`.
- **Validation:** Use `zod` for form schemas.
- **Feedback:** Replace browser `alert()` with `sonner` toasts.

## Tasks
- [ ] **Task 1: Update `utils/api.ts`**
    - Add `productsAPI.create`, `update`, `delete`.
    - Add `categoriesAPI.create`, `update`, `delete`.
    - Add `brandsAPI.create`, `update`, `delete`.
    - Verify: Check function signatures against `functions/src/routes`.
- [ ] **Task 2: Wire Product CRUD in `AdminDashboard.tsx`**
    - Update `handleSaveProduct` to use `productsAPI`.
    - Update `handleDeleteProduct` to use `productsAPI`.
    - Update `handleUpdateStock` to use `productsAPI`.
    - Verify: Create a test product and check Firestore.
- [ ] **Task 3: Wire Category & Brand CRUD in `AdminDashboard.tsx`**
    - Update `handleSaveCategory` and `handleDeleteCategory`.
    - Update `handleSaveBrand` and `handleDeleteBrand`.
    - Verify: Categories/Brands persist after refresh.
- [ ] **Task 4: Implement Zod Validation**
    - Define schemas for Product, Category, and Brand.
    - Integrate validation into save handlers.
    - Verify: Errors show as toasts on invalid input.
- [ ] **Task 5: Fix Settings Persistence**
    - Wire `handleSaveSettings` to `settingsAPI.update()`.
    - Verify: Store settings saved message appears and persists.

## Done When
- [ ] All 9 CRUD operations successfully update the backend.
- [ ] No `alert()` calls remain in Admin handlers.
- [ ] Data survives a page refresh.
- [ ] Invalid data is caught by Zod before being sent.

## Notes
- Ensure `withCredentials: true` is maintained for session/CSRF.
- Use `toast.success` and `toast.error` from `sonner`.
