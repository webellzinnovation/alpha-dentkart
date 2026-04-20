# Security Hardening - Summary of Changes

## Changes Made

### 1. CSRF Protection
- **Files Modified:**
  - `backend/src/middleware/csrf.ts` (custom implementation)
  - `backend/src/server.ts` (added CSRF middleware)
  - `functions/src/middleware/csrf.ts` (new file)
  - `functions/src/server.ts` (added CSRF middleware)

- **What it does:**
  - Generates CSRF tokens on GET requests
  - Validates tokens on POST/PUT/DELETE/PATCH requests
  - Tokens stored in `csrf-token` cookie

### 2. Rate Limiting on Admin Routes
- **Files Modified:**
  - `backend/src/routes/auth.ts` - Admin login now rate-limited
  - `backend/src/routes/products.ts` - Product CRUD now rate-limited
  - `backend/src/routes/orders.ts` - Order operations now rate-limited
  - `functions/src/routes/auth.ts` - Same changes
  - `functions/src/routes/products.ts` - Same changes
  - `functions/src/routes/orders.ts` - Same changes

- **What it does:**
  - Admin login: 5 attempts per 15 minutes
  - Product create/update/delete: Rate limited
  - Order creation/status updates: Rate limited

### 3. Input Sanitization
- **Files Modified:**
  - `backend/src/routes/auth.ts` - Added sanitizeInput middleware
  - `backend/src/routes/products.ts` - Added sanitizeInput middleware
  - `backend/src/routes/orders.ts` - Added sanitizeInput middleware
  - `functions/src/routes/auth.ts` - Same changes
  - `functions/src/routes/products.ts` - Same changes
  - `functions/src/routes/orders.ts` - Same changes

- **What it does:**
  - Strips HTML/script tags from user input
  - Removes javascript: URLs
  - Removes event handler attributes (onclick, onerror, etc.)

### 4. Dependencies Added
- `csurf@1.11.0` added to both `backend/package.json` and `functions/package.json`

---

## How to Test

1. **CSRF Protection:**
   - Try a POST request without CSRF token - should get 403
   - GET requests should include `csrf-token` cookie

2. **Rate Limiting:**
   - Make >5 login attempts quickly - should get 429 error

3. **Sanitization:**
   - Try input like `<script>alert(1)</script>` - should be stripped

---

## How to Revert

If issues occur, you can revert by:

```bash
git checkout -- backend/src/routes/auth.ts
git checkout -- backend/src/routes/products.ts  
git checkout -- backend/src/routes/orders.ts
git checkout -- backend/src/middleware/csrf.ts
git checkout -- backend/src/server.ts
cd backend && npm uninstall csurf
cd ../functions && npm uninstall csurf
git checkout -- functions/src/routes/auth.ts
git checkout -- functions/src/routes/products.ts
git checkout -- functions/src/routes/orders.ts
git checkout -- functions/src/server.ts
git checkout -- functions/src/middleware/csrf.ts
```

---

## Important Notes

- CSRF is disabled in development mode (NODE_ENV !== 'production')
- Rate limiting is disabled in development mode
- Audit logging is already enabled on all /api routes
- Cookie security flags (httpOnly, secure, sameSite) are already configured