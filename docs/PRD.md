# Product Requirement Document (PRD) — Alpha Dentkart

**Product Name:** Alpha Dentkart  
**Domain:** Dental E-Commerce (Supplies, Equipment & Instruments)  
**Target Market:** India (Dentists, Dental Clinics, Dental Students, Dental Laboratories & Businesses)  
**Platform:** Web App (React 18 / Vite / Tailwind) & Mobile Apps (Android APK & iOS via Capacitor)  
**Live Production URL:** [https://alphadentkart-001.web.app](https://alphadentkart-001.web.app)

---

## 1. Executive Summary & Vision

Alpha Dentkart is a premier e-commerce marketplace tailored specifically for the Indian dental healthcare industry. The platform bridges the gap between dental manufacturers/distributors and practitioners by providing authentic, high-quality dental supplies, consumables, instruments, and high-value equipment with transparent pricing, fast regional shipping, and secure digital payments.

---

## 2. Target Persona & User Profiles

### 2.1 Practicing Dentist / Clinic Owner
- **Goals:** Quick re-ordering of daily clinic consumables (composite resins, burs, impression materials, gloves).
- **Needs:** Authentic brand guarantee (3M, Dentsply, Coltene), GST invoices for business tax deduction, pincode-based fast delivery estimations.

### 2.2 Dental Student / Resident
- **Goals:** Purchasing kit bundles (composite restoration kits, handpieces, endodontic files) within budget constraints.
- **Needs:** Discount coupons, bundle deals, easy student document verification for special pricing.

### 2.3 Dental Laboratory / Hospital Administrator
- **Goals:** Bulk procurement of lab equipment, CAD/CAM materials, and high-speed Airotors with formal invoices.
- **Needs:** Volume pricing, custom quotes, credit/deferred payment tracking, Shiprocket tracking.

---

## 3. Core Feature Requirements

### 3.1 Customer Portal (Web & Mobile)
- **Product Catalog & Filtering:** Search by keyword, brand, category, price range, rating, and stock status.
- **Stale-While-Revalidate Caching:** Instant rendering of cached catalog items followed by silent background sync.
- **Shopping Cart & Guest Checkout:** Full cart management with guest checkout support (pincode deliverability check).
- **Payment Gateway Integration:** Dual payment integration supporting Razorpay (Live cards, UPI, Netbanking) and PhonePe.
- **Verification Portal:** Document upload (Dental License, Student ID, GST Certificate) for professional verification.
- **Order Management & Tracking:** Live order timeline tracking with status notifications (Pending Payment, Processing, Shipped, Delivered, Return).
- **AI Customer Assistant:** AI-powered chatbot (Google Gemini API) to recommend products based on clinical use cases.

### 3.2 Admin Management Dashboard
- **Analytics & Reporting:** Live sales, MTD/YTD revenue, average order value, popular categories, user registrations.
- **Catalog CRUD:** Manage products, categories, brands, hero slider banners, and promotional tiles.
- **Order Processing:** Update order status, attach courier name and Shiprocket tracking numbers, review returns.
- **Customer Verification Queue:** Approve or reject submitted dental license and business verification documents.
- **Coupon System:** Create fixed amount or percentage discount coupons with start/expiry dates and minimum order thresholds.

---

## 4. Key Performance Indicators (KPIs)
- **Time to First Meaningful Paint (FCP):** < 1.2 seconds (achieved via Vite manual chunking and esbuild console stripping).
- **Checkout Conversion Rate Target:** > 3.5%.
- **Mobile vs Desktop Traffic split:** 70% Mobile (Android App + Mobile Web), 30% Desktop.
