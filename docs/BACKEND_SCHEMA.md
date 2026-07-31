# Backend Database Schema — Alpha Dentkart

**Database System:** Google Firebase Firestore (NoSQL Document Store)  
**Security Rules File:** `firestore.rules`

---

## 1. Entity-Relationship & Collection Overview

```
                      ┌───────────────────────┐
                      │        users          │
                      └───────────┬───────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │ (1:N)                 │ (1:N)                 │ (1:N)
          ▼                       ▼                       ▼
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │    orders    │        │  wishlists   │        │ verifications│
   └──────┬───────┘        └──────────────┘        └──────────────┘
          │
          │ (Embeds array of items)
          ▼
   ┌──────────────┐
   │   products   │◀─────── (N:1) ───────┐
   └──────┬───────┘                      │
          │ (Ref by ID)                  │
          ▼                              │
   ┌──────────────┐              ┌───────┴──────┐
   │  categories  │              │    brands    │
   └──────────────┘              └──────────────┘
```

---

## 2. Collection Schemas

### 2.1 `products` Collection
Document ID: `Auto-generated string` or `WooCommerce ID`

| Field | Type | Description | Indexing |
|---|---|---|---|
| `id` | `string` / `number` | Unique product ID | Primary |
| `name` | `string` | Product title | ASC |
| `slug` | `string` | URL slug | ASC / Unique |
| `description` | `string` | Full product description | - |
| `price` | `number` | Selling price in INR | ASC / DESC |
| `originalPrice` | `number` (optional) | MRP price before discount | - |
| `category` | `string` | Primary category name | Single field |
| `brand` | `string` | Brand name (e.g. 3M, Dentsply) | Single field |
| `brandId` | `string` (optional) | Foreign key to `brands.id` | Single field |
| `image` | `string` | Primary image URL | - |
| `images` | `array<string>` | Additional gallery images | - |
| `stock` | `number` | Inventory count | Single field |
| `rating` | `number` | Average rating (1-5) | Single field |
| `reviewsCount` | `number` | Total number of reviews | - |
| `isFeatured` | `boolean` | Display in featured section | Composite |
| `isNew` | `boolean` | New arrival badge | Composite |
| `createdAt` | `string` (ISO 8601) | Creation timestamp | Single field |

---

### 2.2 `orders` Collection
Document ID: `order_timestamp_random` (e.g., `ADK-1785334900`)

| Field | Type | Description | Security Guards |
|---|---|---|---|
| `id` | `string` | Human readable order ID | Immutable |
| `userId` | `string` / `null` | Customer user ID (null for guest checkout) | Auth / Owner read |
| `customerEmail` | `string` | Customer contact email | Validated format |
| `customerPhone` | `string` | Customer phone number | Required |
| `items` | `array<object>` | List of purchased items `[{productId, name, price, quantity, image}]` | Server recalculated |
| `subtotal` | `number` | Subtotal amount | Verified server-side |
| `discount` | `number` | Discount amount applied | Verified server-side |
| `shippingFee` | `number` | Delivery charges | Calculated by pincode |
| `total` | `number` | Final total amount | **Recalculated in Controller** |
| `status` | `enum` | `Pending Payment` \| `Processing` \| `Shipped` \| `Delivered` \| `Cancelled` \| `Return Initiated` | Updated by Admin/Webhook |
| `paymentMethod` | `string` | `Razorpay` \| `PhonePe` \| `COD` | Single field |
| `paymentStatus` | `enum` | `unpaid` \| `paid` \| `failed` \| `refunded` | Managed by Webhook |
| `razorpayOrderId` | `string` (optional) | Razorpay Order ID | Index |
| `razorpayPaymentId` | `string` (optional) | Razorpay Payment ID | Index |
| `shippingAddress` | `object` | `{street, city, state, pincode, country}` | Required |
| `trackingNumber` | `string` (optional) | Shiprocket tracking / AWB number | - |
| `courierName` | `string` (optional) | Delivery partner (e.g., Delhivery, BlueDart) | - |
| `createdAt` | `string` (ISO 8601) | Order date | Single field |

---

### 2.3 `users` Collection
Document ID: `Firebase Auth UID`

| Field | Type | Description |
|---|---|---|
| `uid` | `string` | Primary User ID |
| `email` | `string` | Email address |
| `displayName` | `string` | Full name |
| `role` | `string` | `customer` \| `admin` |
| `userType` | `string` | `dental-doctor` \| `dental-student` \| `dental-business` \| `regular` |
| `isVerified` | `boolean` | Verification badge status |
| `verificationId` | `string` (optional) | Reference to `verifications` collection |
| `phone` | `string` (optional) | Contact phone |
| `addresses` | `array<object>` | Saved delivery addresses |
| `createdAt` | `string` (ISO 8601) | Registration timestamp |

---

### 2.4 `coupons` Collection
Document ID: `Coupon Code` (e.g. `WELCOME10`)

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Coupon promo code (Uppercase) |
| `discountType` | `enum` | `percentage` \| `fixed` |
| `discountValue` | `number` | Discount percentage (e.g. 10) or fixed amount |
| `minimumAmount` | `number` | Minimum cart subtotal required |
| `usageLimit` | `number` | Total global redemption cap |
| `usedCount` | `number` | Number of times redeemed |
| `startsAt` | `string` (ISO 8601) | Activation timestamp |
| `expiresAt` | `string` (ISO 8601) | Expiration timestamp |
| `isActive` | `boolean` | Active flag |

---

### 2.5 `verifications` Collection
Document ID: `Auto-generated string`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Verification request ID |
| `userId` | `string` | Applicant UID |
| `userEmail` | `string` | Applicant email |
| `documentType` | `enum` | `license` \| `student_id` \| `gst_certificate` \| `business_registration` |
| `documentNumber` | `string` | Registration / License number |
| `documentUrl` | `string` | Cloud Storage document file URL |
| `status` | `enum` | `pending` \| `approved` \| `rejected` |
| `reviewNotes` | `string` (optional) | Admin rejection / approval notes |
| `submittedAt` | `string` (ISO 8601) | Submission date |
