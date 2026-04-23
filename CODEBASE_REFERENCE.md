# Alpha Dentkart - Codebase Analysis Reference

**Generated:** 2026-04-23  
**Total Files:** 517 code files (~432K words)  
**Graph:** 2,368 nodes, 5,376 edges, 51 communities

---

## 📊 All 15 Workflows

| # | Workflow | Key Files | Status |
|---|----------|----------|--------|
| 1 | Authentication | firebase.ts, authController.ts, App.tsx | ✅ |
| 2 | Payment | razorpayService.ts, payment.ts, savedPayment.ts | ✅ |
| 3 | Product Catalog | productController.ts, ProductCard.tsx | ✅ |
| 4 | Order Management | createOrder(), orderController.ts, getMyOrders() | ✅ |
| 5 | WhatsApp Notifications | WhatsAppService.ts, WhatsAppNotificationManager.tsx | ✅ |
| 6 | Verification | VerificationService.ts, verificationController.ts | ✅ |
| 7 | Guest Checkout | GuestCheckoutService.ts, createGuestOrder() | ✅ |
| 8 | Returns & Refunds | returnController.ts, refundService.ts | ✅ |
| 9 | Reviews | reviewController.ts, ProductDetail.tsx | ✅ |
| 10 | Admin Notifications | adminNotificationService.ts | ✅ |
| 11 | Hero Slides | heroSlideController.ts, Hero.tsx | ✅ |
| 12 | Category & Brand | categoryController.ts, brandController.ts | ✅ |
| 13 | Chat Support | chatService.ts, ChatSupport.tsx, AI | ✅ |
| 14 | Shipping | shippingController.ts, ShiprocketService | ✅ |
| 15 | Coupons | CouponService.ts, couponController.ts | ✅ |

---

## 🔑 Key Files Reference

### Authentication Flow
```
App.tsx (handleLogin)
      │
      ▼
login() function
      │
      ▼
authController.ts (backend)
      │
      ▼
firebase.ts (Firebase Auth)
```

### Payment Flow
```
createOrder()
        │
        ▼
handleCreateRazorpayOrder()
        │
        ▼
razorpayService.ts
        │
        ▼
verifyRazorpayWebhookSignature()
        │
        ▼
notifyPaymentReceived()
```

### Order Flow
```
Order Creation: createOrder(), createGuestOrder()
        │
Order Management: getMyOrders(), getAllOrders(), getGuestOrder()
        │
Status Updates: updateOrderStatus(), sendOrderStatusWhatsApp()
        │
Shipping: createShiprocketOrder()
        │
Cancellation: cancelOrder(), getOrderForCancellation()
        │
Quick Reorder: QuickReorderService
```

### Product Flow
```
Backend API: getAllProducts(), getProductById()
        │
Data Processing: denormalizeProducts(), syncProducts()
        │
Caching: .invalidateProductsCache()
        │
Frontend: ProductCard.tsx, ProductDetail.tsx
        │
Reviews: getProductReviews(), updateProductRatings()
```

### WhatsApp Notifications
```
WhatsAppService (core)
        │
├─ Order: sendOrderStatusWhatsApp()
├─ Payment: sendPaymentReminderWhatsApp()
└─ Custom: sendCustomWhatsApp()

Triggers:
  - sendOrderConfirmation()
  - sendShippingUpdate()
  - sendDeliveryConfirmation()
  - sendOrderCancellation()
```

---

## 🔍 God Nodes (Most Central)

| Rank | Function | Degree | Purpose |
|------|----------|--------|---------|
| 1 | `r()` | 94 | Core utility function |
| 2 | `l()` | 92 | Core utility function |
| 3 | `s()` | 52 | Core utility function |
| 4 | `R()` | 51 | React component wrapper |
| 5 | `ci` | 36 | API client instance |
| 6 | `Bs` | 29 | Base service |
| 7 | `kt` | 26 | Key transformer |
| 8 | `ShiprocketService` | 24 | Shipping integration |
| 9 | `WhatsAppService` | 24 | Notifications |
| 10 | `qn` | 23 | Query navigator |

---

## 🌉 Surprising Connections

Hidden relationships discovered by graph analysis:

1. `fetchUserOrders()` → `getMyOrders()` [INFERRED]
   - App.tsx → functions API

2. `handleLogin()` → `login()` [INFERRED]
   - App.tsx → functions auth

3. `handleLogout()` → `logout()` [INFERRED]
   - App.tsx → functions auth

4. `handleUpdateUser()` → `updateProfile()` [INFERRED]
   - App.tsx → backend API

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ALPHA-DENTKART                          │
│                Dental E-Commerce                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────┬───────────┼───────────┬──────────┐
        ▼         ▼           ▼           ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
   │Auth     │ │Product  │ │Order     │ │Payment   │
   │Firebase│ │Catalog  │ │+Shipping │ │Razorpay  │
   └─────────┘ └─────────┘ └──────────┘ └──────────┘
        │         │           │           │
        ▼         ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
   │Verification│ │Coupon │ │Returns   │ │Refund   │
   │Professional│ │Discount│ │ReturnReq│ │processRefund│
   └─────────┘ └─────────┘ └──────────┘ └──────────┘
        │
        ▼
   ┌─────────────────────────────────────────────┐
   │          NOTIFICATIONS                     │
   │    WhatsApp + Admin + Stock Alerts          │
   └─────────────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────────────┐
   │          SUPPORT                           │
   │    Chat + AI + Reviews                    │
   └─────────────────────────────────────────────┘
```

---

## 🛡️ Security Features

- ✅ CSRF Protection (custom middleware)
- ✅ Rate Limiting on admin routes
- ✅ Input Sanitization
- ✅ JWT Authentication
- ✅ Firebase Auth
- ✅ No hardcoded passwords

---

## 📁 Project Structure

```
alpha-dentkart/
├── App.tsx                    # Main React Native app
├── backend/
│   ├── src/
│   │   ├── controllers/      # API controllers
│   │   ├── services/        # Business logic
│   │   ├── routes/         # API routes
│   │   └── middleware/    # Security middleware
│   └── package.json
├── functions/
│   └── src/
│       ├── controllers/    # Firebase functions
│       ├── services/       # Firebase services
│       └── routes/         # Function triggers
├── components/             # React components
├── routes/                  # Frontend routing
├── utils/                  # Utilities
├── scripts/                # Migration scripts
├── graphify-out/            # Analysis outputs
│   ├── graph.json         # Raw graph data
│   ├── graph.html        # Interactive visualization
│   └── GRAPH_REPORT.md   # Full report
└── .env.example          # Environment template
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Update all API keys in `.env`
- [ ] Configure Razorpay keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
- [ ] Configure PhonePe keys (if enabling)
- [ ] Set up WhatsApp Business API credentials
- [ ] Update JWT_SECRET (generate strong random string)
- [ ] Configure Firebase project
- [ ] Set up Cloud Run / Firebase Hosting
- [ ] Test checkout flow end-to-end
- [ ] Configure monitoring (Sentry, etc.)
- [ ] Set up CDN for static assets
- [ ] Configure SSL/TLS certificates

---

## 📞 Supported Integrations

| Service | Status | Configuration |
|--------|--------|----------------|
| Firebase Auth | ✅ Ready | firebase.ts |
| Firebase Firestore | ✅ Ready | firestore config |
| Firebase Cloud Functions | ✅ Ready | functions/ |
| Razorpay | ✅ Ready | razorpayService.ts |
| PhonePe | ✅ Ready | phonepePayment.ts |
| WhatsApp Business | ✅ Ready | whatsappService.ts |
| Shiprocket | ✅ Ready | shiprocketService.ts |
| Google Gemini AI | ✅ Ready | gemini-api-key |

---

*This document was generated by graphify analysis*