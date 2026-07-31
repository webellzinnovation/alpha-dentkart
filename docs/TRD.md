# Technical Requirement Document (TRD) — Alpha Dentkart

**Version:** 2.4.0  
**Stack Architecture:** React 18 + Vite 6 + Express 4 (Firebase Cloud Functions) + Firestore + Capacitor 8  
**Deployment Region:** `asia-south1` (Mumbai / India)

---

## 1. System Architecture Overview

Alpha Dentkart utilizes a decoupled serverless architecture combining a client-side Single Page Application (SPA) / Hybrid Mobile App with a micro-service Express API running inside Google Firebase Cloud Functions Gen 2.

```
[ Web Browser / Capacitor Android App ]
                 │
                 ├── (Static Assets) ──────> Firebase Hosting (CDN)
                 │
                 └── (API Requests) ───────> Express API Gateway (Firebase Cloud Functions Gen 2)
                                                    │
                                                    ├── Firebase Firestore (NoSQL DB)
                                                    ├── Razorpay & PhonePe Payment APIs
                                                    ├── Shiprocket Shipping API
                                                    ├── Hostinger SMTP Email Service
                                                    └── Google Gemini AI API
```

---

## 2. Technology Stack Specifications

### 2.1 Frontend Framework & Build Pipeline
- **Core Library:** React 18.3 (TypeScript 5.8)
- **Routing:** `react-router-dom` v7 with lazy loaded view chunks (`Shop`, `Dashboard`, `Checkout`, `AdminDashboard`).
- **Styling:** TailwindCSS v3.4 + Custom Luxury Redesign Tokens (`index.css`).
- **State Management & Caching:** Custom Stale-While-Revalidate cache (`utils/cache.ts`) + `@tanstack/react-query` v5.
- **Bundler:** Vite v6.4 with esbuild minification (`drop: ['console', 'debugger']`) and manual chunking.

### 2.2 Backend API & Cloud Infrastructure
- **Runtime:** Node.js 20 on Firebase Cloud Functions Gen 2 (`asia-south1`).
- **Server Framework:** Express 4.21 with Zod request body validation (`middleware/validate.ts`).
- **Security Middleware:** `helmet`, `cors` (with originless proxy bypass for native container/Firebase rewrites), `csrf` protection, `express-rate-limit`.
- **Database:** Firebase Firestore (NoSQL) with native transaction isolation for stock decrement.

### 2.3 Mobile Hybrid Wrapper
- **Framework:** Capacitor CLI 8.0 (`@capacitor/android`, `@capacitor/app-launcher`, `@capacitor/haptics`).
- **Platform Handling:** Automatic API base URL resolution (`utils/api.ts`) switching between relative `/api/v1` (web) and absolute `https://alphadentkart-001.web.app/api/v1` (native container).
- **Cookie Consent:** Disabled inside native Capacitor container (`window.Capacitor.isNativePlatform()`).

---

## 3. Integration Architecture & Secrets Management

| Component | Provider | Configuration / Environment Variables |
|---|---|---|
| **Payment Gateway** | Razorpay Live API | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `VITE_RAZORPAY_KEY_ID` |
| **Alternate Payment** | PhonePe API | `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX` |
| **Shipping Aggregator** | Shiprocket | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` |
| **Transactional Email** | Hostinger SMTP | `SMTP_HOST` (smtp.hostinger.com), `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS` |
| **AI Support Bot** | Google Gemini API | `VITE_GEMINI_API_KEY` |
| **Authentication** | JWT + Firebase Auth | `JWT_SECRET` (min 64 chars), `ADMIN_SECRET` |

---

## 4. Operational & Security Requirements
1. **Server-Side Price Validation:** `orderController.ts` recalculates every order total directly from the `products` Firestore collection to prevent client-side price tampered payloads.
2. **Firestore Security Rules:** `firestore.rules` enforces authenticated reads for `coupons` and admin-only write privileges across products, categories, and system settings.
3. **CI/CD Build Pipeline:** GitHub Actions workflow (`build-android.yml`) automatically builds `.apk` binaries on pushes to `main`.
