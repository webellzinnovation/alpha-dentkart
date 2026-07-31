# App & Website Flow Architecture — Alpha Dentkart

This document details the navigation flows, state transitions, and user interaction maps across Web and Mobile platforms.

---

## 1. High-Level System Navigation Flow Map

```
                             ┌────────────────────────────────┐
                             │       Visitor Application      │
                             └───────────────┬────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
       ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
       │   Homepage    │             │  Shop Screen  │             │ Account View  │
       └───────┬───────┘             └───────┬───────┘             └───────┬───────┘
               │                             │                             │
    ┌──────────┴──────────┐       ┌──────────┴──────────┐       ┌──────────┴──────────┐
    ▼                     ▼       ▼                     ▼       ▼                     ▼
┌──────────────┐   ┌──────────┐ ┌──────────────┐   ┌──────────┐ ┌──────────────┐   ┌──────────┐
│ Hero Banner  │   │  Search  │ │ Filter/Sort  │   │ Product  │ │ Sign In/     │   │ Customer │
│ Slider/Tiles │   │ Modal    │ │ Categories   │   │ Details  │ │ Register     │   │Dashboard │
└──────────────┘   └──────────┘ └──────────────┘   └────┬─────┘ └──────────────┘   └──────────┘
                                                        │
                                                        ▼
                                               ┌────────────────┐
                                               │ Add to Cart /  │
                                               │ Buy Now        │
                                               └───────┬────────┘
                                                       │
                                                       ▼
                                               ┌────────────────┐
                                               │ Cart Drawer /  │
                                               │ Checkout View  │
                                               └───────┬────────┘
                                                       │
                                                       ▼
                                               ┌────────────────┐
                                               │ Razorpay/      │
                                               │ PhonePe Gateway│
                                               └───────┬────────┘
                                                       │
                                                       ▼
                                               ┌────────────────┐
                                               │ Order Success  │
                                               │ & Tracking     │
                                               └────────────────┘
```

---

## 2. Detailed Screen Navigation Workflows

### 2.1 Customer Browsing & Checkout Journey
1. **Entry Point (Homepage):**
   - Renders Header, Hero Banner Slider, Category Pills, Featured Products, and Footer.
   - Initial load utilizes local cache (`stale-while-revalidate`) while background API synchronizes fresh data.
2. **Product Exploration (Shop View):**
   - Accessible via Header Navigation or Bottom Bar (`Shop`).
   - Supports filtering by Category, Brand, Price Range, and Sorting (Featured, Price Low-High, Price High-Low).
3. **Product Detail View:**
   - Image gallery, product specs, clinical features, stock status, delivery pincode estimator, and customer reviews.
4. **Cart & Checkout Flow:**
   - User clicks **Add to Cart** or **Buy Now** -> Item added to cart context & persisted to `localStorage`.
   - Checkout triggers Pincode deliverability validation.
   - Select payment option: **Razorpay** (Cards/UPI), **PhonePe**, or **Cash on Delivery**.
   - Server validates prices -> Order created in Firestore with status `Pending Payment` -> Initiates payment gateway modal -> Payment success updates status to `Processing` -> Triggers Hostinger SMTP order confirmation email.

### 2.2 Customer Verification Workflow
1. User navigates to **Dashboard** -> **Professional Verification**.
2. Selects document type (**Dental License**, **Student ID**, **GST Certificate**).
3. Uploads document image / PDF -> API creates record in `verifications` collection (`pending` status).
4. Admin reviews document in Admin Dashboard -> Approves/Rejects -> User receives verified badge & access to professional pricing discounts.

### 2.3 Mobile Navigation Structure
- **Top Bar:** Hamburger Drawer Toggle, Brand Logo, Search Bar, Account Icon.
- **Bottom Navigation Bar (Mobile Only):**
  - `Home` (`/home`)
  - `Shop` (`/shop`)
  - `Search` (Focuses search bar overlay)
  - `Wishlist` (`/wishlist` with badge count)
  - `Cart` (Opens slide-out cart sidebar)
- **Side Drawer Menu:**
  - `Home`, `Shop Products`, `Categories`, `Brands`, `Wishlist`, `My Orders`, `Track Order`, `Help & Support`.
