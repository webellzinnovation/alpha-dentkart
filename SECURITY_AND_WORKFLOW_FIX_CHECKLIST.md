# Security And Workflow Fix Checklist

Use this file as the working remediation checklist for the current audit findings.

## Critical

### Auth And Access
- [x] Remove the public password reset endpoint in `functions/src/routes/auth.ts`.
- [x] Replace password reset with a real token-based reset flow with expiry and one-time use.
- [x] Lock down the public user-list endpoint in `functions/src/routes/auth.ts`.
- [x] Protect admin stats endpoints in both backends.
- [ ] Review all routes marked "open for dev" or "temporarily open" and secure them before production.

### Secrets And Sensitive Data
- [x] Split public storefront settings from private admin settings.
- [x] Ensure `GET /settings` never returns SMTP credentials, payment secrets, API secrets, or admin-only config.
- [x] Remove hardcoded JWT fallback secret from `backend/src/utils/jwt.ts`.
- [x] Remove hardcoded WooCommerce keys from source files.
- [ ] Rotate any credentials already committed to the repo.
- [ ] Audit `.env`, scripts, debug files, and logs for leaked secrets.

### Payments
- [x] Stop generating Razorpay order IDs in the frontend.
- [x] Use only the server-side Razorpay order creation flow.
- [x] Ensure payment verification always uses a real backend-generated Razorpay order ID.
- [ ] Remove frontend code paths that rely on mock payment behavior in production.

## High

### Login And Session Flow
- [x] Fix customer login UI to work with cookie-based auth instead of expecting `response.token`.
- [x] Fix registration UI to work with cookie-based auth instead of expecting `response.token`.
- [x] Make logout call the backend logout endpoint so the auth cookie is cleared.
- [ ] Standardize cookie name and session behavior across `backend/` and `functions/`.
- [x] Standardize admin login persistence and stored user/session state.

### Backend Drift
- [ ] Choose one backend as the production source of truth: `backend/` or `functions/`.
- [ ] Standardize route names across both backends until one is removed.
- [ ] Standardize response shapes across both backends.
- [ ] Standardize auth middleware behavior across both backends.
- [ ] Remove deployment-specific workflow differences between Vercel and Firebase Hosting.

### Settings And Admin Configuration
- [ ] Move SMTP settings to a private admin-only endpoint or secure server storage.
- [ ] Move Razorpay secret and PhonePe salt key out of public settings documents.
- [ ] Review whether frontend code caches any private settings in browser storage.

### Customer Management
- [ ] Align `/users/all` response shape with frontend expectations or update the frontend to the real API shape.
- [ ] Standardize user pagination, filtering, and total counts.
- [ ] Verify admin-only user update and delete workflows in both deployments.

## Medium

### Orders
- [ ] Standardize order status update routes across frontend, `backend/`, and `functions/`.
- [ ] Confirm admin order actions work in the deployed environment.
- [ ] Verify order search, filtering, and pagination against the final backend contract.

### Returns And Refunds
- [x] Fix route/controller parameter mismatch for returns (`id` vs `returnId`) in both backends.
- [ ] Verify return detail workflow.
- [ ] Verify approve/reject/refund workflows.
- [ ] Confirm only admins can approve or refund returns.
- [ ] Confirm users can only access their own returns.

### Chat Support
- [x] Secure chat session read access so users can only read their own sessions.
- [x] Secure chat session message posting so users can only write to their own sessions.
- [x] Fix admin chat UI route mismatch (`PUT` vs backend `PATCH /:id/status`).
- [ ] Review whether chat session IDs are guessable or exposed too broadly.

### Notifications
- [ ] Protect FCM token save route so callers cannot write tokens for arbitrary users.
- [ ] Verify notification send endpoints are admin-only where intended.
- [x] Review email/notification templates and sending flows for auth and abuse protection.

### AI
- [x] Move storefront AI calls from browser API key usage to backend-only API usage.
- [x] Remove reliance on `VITE_GEMINI_API_KEY` for production chat.
- [ ] Apply auth and rate limiting consistently to AI endpoints.

## Workflow Verification

### Customer Journeys
- [ ] Register a new user.
- [ ] Log in as a normal user.
- [ ] Log out and confirm session is actually cleared.
- [ ] Browse products, categories, and brands.
- [ ] Add items to cart and place an order.
- [ ] Verify payment success flow.
- [ ] Verify payment failure flow.
- [ ] View order history.
- [ ] Submit a return request.

### Admin Journeys
- [ ] Log in as admin.
- [ ] Open admin dashboard.
- [ ] Load users list.
- [ ] Load orders list.
- [ ] Update order status.
- [ ] Update homepage content, brands, slides, and promotional tiles.
- [ ] Update settings safely without exposing secrets publicly.
- [ ] Moderate reviews.
- [ ] Manage verification requests.
- [ ] Use chat support tools.

## Testing

- [ ] Add auth tests for login, logout, admin access, and password reset.
- [ ] Add API tests for users, orders, returns, settings, and chat.
- [ ] Add payment flow tests.
- [ ] Add regression tests for public/private settings separation.
- [ ] Add at least one full customer end-to-end test.
- [ ] Add at least one full admin end-to-end test.

## Cleanup

- [ ] Remove obsolete code paths for frontend-only payment simulation.
- [ ] Remove dead or duplicate backend logic after choosing one backend.
- [ ] Update `README.md` to match the real architecture.
- [ ] Document the final auth/session model.
- [ ] Document the final deployment path and production backend.
- [x] Align Capacitor app id configuration between `capacitor.config.ts` and `capacitor.config.json`.
