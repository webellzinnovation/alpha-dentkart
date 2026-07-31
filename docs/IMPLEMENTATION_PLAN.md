# Implementation Plan — Alpha Dentkart

**Project Milestone:** Production Readiness, Mobile Optimization & Architecture Alignment  
**Target Completion:** Full Production Deployment & Mobile App Verification

---

## 1. High-Level Phases Roadmap

```
  Phase 1: Security & Financial Integrity (Completed ✅)
    ├── Price recalculation in backend order controller
    ├── Hardened CORS origin checks for production
    └── Restricted coupon collection Firestore security rules

  Phase 2: UI Redesign & Brand Gradient Upgrade (Completed ✅)
    ├── Luxury brand color tokens added to index.css (#DD3B5F)
    ├── Redesigned Header, Hero slider, Product Cards, Cart drawer
    └── Mobile Bottom Navigation redesigned for Shop & Search

  Phase 3: Load Speed & Bundle Optimization (Completed ✅)
    ├── Isolated heavy AdminDashboard into separate manual chunk
    ├── Lazy-loaded secondary components (Brands, Categories, QuickReorder)
    └── Configured esbuild console & debugger stripping in Vite

  Phase 4: Mobile App & Hybrid Container Hardening (Completed ✅)
    ├── Automatic absolute API URL resolution for Capacitor container
    ├── Hidden web Cookie Consent banner in native mobile app builds
    └── Configured GitHub Actions build-android.yml workflow

  Phase 5: Future Scalability & Mobile Push Notifications (Upcoming 🚀)
    ├── Native Firebase Push Notifications integration for Android/iOS
    ├── Webhook signature verification for PhonePe payments
    └── Automatic Shiprocket AWB tracking sync cron job
```

---

## 2. Phase-by-Phase Technical Task Breakdown

### Phase 1: Security & Financial Integrity ✅
- [x] Implement server-side order price recalculation in `functions/src/controllers/orderController.ts` from Firestore `products` collection.
- [x] Restrict Firestore `coupons` collection read access to authenticated users in `firestore.rules`.
- [x] Configure CORS in `functions/src/server.ts` to allow originless requests for Firebase internal rewrites and Capacitor native app containers.
- [x] Create root `.env.example` and `functions/.env.example` templates.

### Phase 2: User Experience & Design System ✅
- [x] Update `index.css` with luxury brand red/pink gradients (`#DD3B5F` to `#BE123C`), glassmorphism card tokens, and custom shadows.
- [x] Redesign `Header.tsx`, `Hero.tsx`, and `ProductCard.tsx` with gradient CTA pill buttons and interactive hover micro-animations.
- [x] Update `MobileBottomNav.tsx`: Replace `Category` and `Brand` tabs with direct `Shop` tab while retaining Categories and Brands in the side drawer.

### Phase 3: Performance & Load Speed Optimization ✅
- [x] Update `vite.config.ts` with `manualChunks` to split `vendor-react`, `vendor-router`, `vendor-query`, and `admin-dashboard`.
- [x] Lazy load secondary top-level components in `App.tsx` using `React.lazy` and `Suspense`.
- [x] Configure `drop: ['console', 'debugger']` in `vite.config.ts` esbuild options to remove console logs in production builds.

### Phase 4: Capacitor Mobile App Integration ✅
- [x] Update `utils/api.ts` so native Capacitor containers (`capacitor:` protocol) resolve API requests to absolute production URL (`https://alphadentkart-001.web.app/api/v1`).
- [x] Update `components/CookieConsent.tsx` to detect native platforms (`window.Capacitor.isNativePlatform()`) and suppress web cookie popups inside native APKs.
- [x] Configure `.github/workflows/build-android.yml` to compile and upload `android-debug-apk` artifacts on pushes to `main`.

---

## 3. Verification & Quality Assurance Plan

### Automated Test Suites
- **Frontend Integration Tests:** `npm run test:run` (Vitest + React Testing Library)
- **Backend Controller Tests:** `cd functions && npm test`
- **TypeScript Type Safety Check:** `npm run typecheck`

### Manual Verification Matrix
1. **Live Production Web App:** Verify page loading speed, product filters, cart checkout, and Razorpay Live Gateway popup at [https://alphadentkart-001.web.app](https://alphadentkart-001.web.app).
2. **Android Native APK:** Install `android-debug-apk` artifact from GitHub Actions, verify direct API loading, test Google Auth redirect flow, and ensure no web cookie banner pops up.
