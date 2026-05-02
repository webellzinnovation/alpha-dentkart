# Alpha Dentkart - Complete Project Specification

## A Comprehensive Project Prompt for Recreating the Alpha Dentkart E-Commerce Platform

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Target Audience & Market](#2-target-audience--market)
3. [User Types & Verification System](#3-user-types--verification-system)
4. [Core Features](#4-core-features)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [User Flows](#6-user-flows)
7. [UI/UX Design Specifications](#7-ux-design-specifications)
8. [Data Models & Schema](#8-data-models--schema)
9. [API Architecture](#9-api-architecture)
10. [Admin Dashboard Features](#10-admin-dashboard-features)
11. [Payment Integration](#11-payment-integration)
12. [Security Requirements](#12-security-requirements)
13. [Technical Stack](#13-technical-stack)
14. [Project Structure](#14-project-structure)
15. [Workflow Diagrams](#15-workflow-diagrams)
16. [Component Inventory](#16-component-inventory)
17. [Third-Party Integrations](#17-third-party-integrations)

---

## 1. PROJECT OVERVIEW

### Project Name
**Alpha Dentkart** - Dental Products E-Commerce Platform

### Project Type
Full-stack e-commerce web application with admin dashboard and customer storefront

### Core Functionality
An online marketplace for dental professionals, clinics, and students to purchase dental supplies, equipment, and consumables with full inventory management, order tracking, and secure payment processing.

### Project Goals
- Provide a seamless B2B and B2C shopping experience for dental products
- Enable administrators to manage products, orders, customers, and content
- Support multiple user roles with appropriate permissions
- Integrate secure payment gateways with order tracking
- Offer responsive, mobile-first user experience

---

## 2. TARGET AUDIENCE & MARKET

### Primary Users

| User Type | Description | Needs |
|-----------|-------------|-------|
| **Dental Clinics** | Small to large dental practices | Bulk ordering, recurring purchases, credit accounts |
| **Dentists** | Individual practitioners | Quick ordering, product reviews, wishlists |
| **Dental Students** | Students in dental schools | Educational pricing, essential supplies |
| **Dental Labs** | Dental laboratories | Specialized equipment, technical products |
| **Administrators** | Store managers/owners | Full system control, analytics, reporting |

### Market Requirements
- **Geographic Focus**: India (INR currency, Indian addresses)
- **Language**: English (with potential for Hindi localization)
- **Device Support**: Desktop, tablet, and mobile browsers
- **Accessibility**: WCAG 2.1 AA compliance

---

## 3. USER TYPES & VERIFICATION SYSTEM

### IMPORTANT: Registration Restrictions

**Alpha Dentkart requires users to verify their professional/business identity before full access.** Regular consumers (non-verified users) have limited functionality.

### User Types

| User Type | Code | Description | Verification Required |
|-----------|------|-------------|----------------------|
| **Dental Doctor** | `dental-doctor` | Licensed dental practitioners with valid dental council registration | ✅ License ID verification |
| **Dental Student** | `dental-student` | Students enrolled in recognized dental colleges | ✅ Student ID + Institution verification |
| **Dental Business** | `dental-business` | Businesses with valid GST registration (clinics, labs, traders) | ✅ GST Number + Business Name verification |
| **Regular/Consumer** | `regular` | General consumers (limited access) | ❌ No verification |

### Verification Document Types

```typescript
type VerificationDocumentType =
  | 'dental_license'    // For dental doctors
  | 'student_id'        // For dental students
  | 'business_gst'      // For dental businesses
  | 'business_license'   // Alternative for businesses
```

### Verification Flow

```
┌─────────────────┐
│  User Registers │
│  (Basic Info)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Select User   │
│     Type       │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬────────────┐
    ▼         ▼          ▼            ▼
┌───────┐ ┌────────┐ ┌──────────┐ ┌────────┐
│ Doctor│ │ Student│ │ Business │ │ Regular│
└───┬───┘ └────┬──┘ └────┬────┘ └───┬────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌─────────────────────────────┐
│   Upload Verification       │
│   Document                  │
│  (License/ID/GST)          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Admin Review              │
│   (Approve/Reject)          │
└─────────────┬───────────────┘
              │
         ┌────┴────┐
         ▼         ▼
    ┌────────┐ ┌────────┐
    │ APPROVE│ │ REJECT │
    └────┬───┘ └───┬────┘
         │         │
         ▼         ▼
┌─────────────┐ ┌──────────────┐
│Full Access  │ │User Notified │
│Granted      │ │Can Re-submit │
└─────────────┘ └──────────────┘
```

### Verification Data Fields

| User Type | Required Fields | Document Upload |
|-----------|-----------------|-----------------|
| Dental Doctor | `licenseId`, `licenseState`, `specialization` | Dental license certificate |
| Dental Student | `institution`, `studentId` | Student ID card |
| Dental Business | `gstNumber`, `businessName` | GST certificate |
| Regular | None | None |

### Verification Status

```typescript
type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface VerificationDocument {
  id: string;
  userId: string;
  documentType: VerificationDocumentType;
  status: VerificationStatus;
  rejectionReason?: string;
  documentUrl?: string;
  licenseId?: string;
  licenseState?: string;
  specialization?: string;
  institution?: string;
  studentId?: string;
  gstNumber?: string;
  businessName?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}
```

### Benefits by User Type

| Feature | Dental Doctor | Dental Student | Dental Business | Regular |
|---------|--------------|----------------|-----------------|---------|
| **Return Window** | 30 days | 15 days | 15 days | 7 days |
| **Product Reviews** | Professional badge | Student badge | Business badge | Regular badge |
| **Exclusive Products** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Bulk Discounts** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Priority Support** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Credit Account** | ❌ No | ❌ No | ✅ Yes | ❌ No |

### Admin Verification Management

**Admin Dashboard - Verifications Tab:**
- [ ] List all pending verifications
- [ ] View uploaded documents
- [ ] Approve with notes
- [ ] Reject with reason
- [ ] Search by user/email
- [ ] Filter by status/type
- [ ] Verification audit logs
- [ ] Batch approve/reject

### API Endpoints for Verification

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/verification/submit` | Submit verification document | User |
| GET | `/api/v1/verification/my-verifications` | Get user's submissions | User |
| GET | `/api/v1/verification/:id` | Get verification details | User/Admin |
| GET | `/api/v1/verification` | Get all verifications | Admin |
| PUT | `/api/v1/verification/:id/status` | Approve/Reject | Admin |
| DELETE | `/api/v1/verification/:id` | Delete verification | User/Admin |
| GET | `/api/v1/verification/admin/stats` | Verification statistics | Admin |
| GET | `/api/v1/verification/admin/audit-logs` | Audit logs | Admin |

### User Type in Registration

```typescript
// Registration Request
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  userType: 'dental-doctor' | 'dental-student' | 'dental-business' | 'regular';
  // For dental-doctor
  licenseId?: string;
  licenseState?: string;
  specialization?: string;
  // For dental-student
  institution?: string;
  studentId?: string;
  // For dental-business
  gstNumber?: string;
  businessName?: string;
}
```

### Post-Registration Flow

1. User completes basic registration
2. If `userType` requires verification:
   - User is shown "Pending Verification" status
   - Access to limited features until approved
3. User uploads required documents
4. Admin reviews and approves/rejects
5. User receives notification of decision
6. If approved: Full access granted
7. If rejected: User can re-submit with corrections

---

## 4. CORE FEATURES

### Customer Features

#### 4.1 Authentication & User Management
- [ ] User registration with user type selection (dental-doctor, dental-student, dental-business, regular)
- [ ] Professional verification system (license ID, student ID, GST certificate)
- [ ] Email verification for all users
- [ ] Email/password login with "Remember Me" option
- [ ] Password reset via email link
- [ ] User profile management (name, email, phone, addresses)
- [ ] Multiple shipping addresses per user
- [ ] Account verification status (pending, approved, rejected)
- [ ] User type badges in reviews and comments

#### 4.2 Product Browsing
- [ ] Product catalog with categories and brands
- [ ] Category hierarchy (parent/child categories)
- [ ] Brand pages with branding
- [ ] Product search with auto-suggest
- [ ] Advanced filters (category, brand, price range, availability)
- [ ] Sort options (price, name, popularity, newest)
- [ ] Pagination with "Load More" functionality
- [ ] Recently viewed products (up to 6)

#### 4.3 Product Details
- [ ] Product images gallery with zoom
- [ ] Product name, description, specifications
- [ ] Price display (current price, original price, discount %)
- [ ] Stock availability status
- [ ] Product variations (size, color, flavor, etc.)
- [ ] Add to cart with variation selection
- [ ] Add to wishlist
- [ ] Product reviews and ratings display
- [ ] Related products section
- [ ] SEO meta tags (title, description, keywords)

#### 4.4 Shopping Cart
- [ ] Add/remove products
- [ ] Update quantities
- [ ] Variation selection per item
- [ ] Cart total calculation
- [ ] Coupon code application
- [ ] Minimum order value validation
- [ ] Persistent cart (localStorage)
- [ ] Cart sidebar quick view

#### 4.5 Checkout Process
- [ ] Guest checkout option
- [ ] Address selection/addition
- [ ] Shipping method selection
- [ ] Payment method selection
- [ ] Order summary review
- [ ] Terms acceptance
- [ ] Order placement with payment
- [ ] Order confirmation page

#### 4.6 Order Management
- [ ] Order history list
- [ ] Order details view
- [ ] Order status tracking
- [ ] Invoice download (PDF)
- [ ] Order cancellation request
- [ ] Return/refund request

#### 4.7 Wishlist
- [ ] Add/remove products
- [ ] Move to cart
- [ ] Price drop notifications (conceptual)
- [ ] Persistent across sessions

### Admin Features

#### 4.8 Dashboard Overview
- [ ] Sales summary (daily, weekly, monthly)
- [ ] Revenue graphs
- [ ] Recent orders widget
- [ ] Low stock alerts
- [ ] Customer registrations
- [ ] Pending reviews

#### 3.9 Product Management
- [ ] Product CRUD operations
- [ ] Bulk product upload
- [ ] Category management (hierarchical)
- [ ] Brand management
- [ ] Product image upload (multiple)
- [ ] Product variations management
- [ ] SEO settings per product
- [ ] Stock management
- [ ] Featured products toggle
- [ ] Product search and filters

#### 3.10 Order Management
- [ ] All orders list with filters
- [ ] Order details view
- [ ] Status update workflow
- [ ] Tracking number entry
- [ ] Courier selection
- [ ] Order cancellation processing
- [ ] Return request processing
- [ ] Refund processing

#### 3.11 Customer Management
- [ ] Customer list with search
- [ ] Customer details view
- [ ] Order history per customer
- [ ] Address management
- [ ] Account status (active/disabled)
- [ ] Verification status

#### 3.12 Review Management
- [ ] All reviews list
- [ ] Approve/reject reviews
- [ ] Reply to reviews
- [ ] Filter by product/rating

#### 3.13 Content Management
- [ ] Homepage hero slides
- [ ] Promotional tiles
- [ ] Homepage sections ordering

#### 3.14 Settings Management
- [ ] General settings (store name, currency, contact)
- [ ] Email settings (SMTP configuration)
- [ ] Payment settings (Razorpay keys)
- [ ] Shipping settings
- [ ] Notification toggles

---

## 4. USER ROLES & PERMISSIONS

### Role Structure

```
ADMIN (Full Access)
├── All CRUD on all resources
├── View analytics
├── Manage users
└── System configuration

CUSTOMER (Standard Access)
├── Browse products
├── Manage own cart/wishlist
├── Place orders
├── View own orders
└── Manage own profile
```

### Permission Matrix

| Resource | Admin | Customer |
|----------|-------|----------|
| View Products | ✅ | ✅ |
| Add to Cart | ✅ | ✅ |
| Place Orders | ✅ | ✅ |
| View Own Orders | ✅ | ✅ |
| Manage Products | ✅ | ❌ |
| Manage Orders | ✅ | ❌ |
| View All Customers | ✅ | ❌ |
| System Settings | ✅ | ❌ |
| View Analytics | ✅ | ❌ |

---

## 5. USER FLOWS

### 5.1 Customer Registration Flow

```
┌─────────────────┐
│   Landing Page  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Click "Sign Up"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Registration Form│──────┐
│ - Name          │      │
│ - Email         │      │
│ - Password      │      │
└────────┬────────┘      │
         │               │
         ▼               │
┌─────────────────┐      │
│ Email Sent      │      │
│ Verification    │      │
└────────┬────────┘      │
         │               │ (Already Verified)
         ▼               │
┌─────────────────┐      │
│ Verify Email    │──────┤
│ (Click Link)    │      │
└────────┬────────┘      │
         │               │
         ▼               ▼
┌─────────────────┐
│ Account Verified│
│ Redirect to Shop│
└─────────────────┘
```

### 5.2 Purchase Flow

```
┌─────────────────┐
│   Browse Shop   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  View Product   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Select Variations│────▶│  Add to Cart   │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │  View Cart     │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │ Apply Coupon?   │───Yes──▶┌─────────────────┐
                         └────────┬────────┘         │ Enter Coupon    │
                                  │                  └────────┬────────┘
                                  No                          │
                                  │                           │
                                  ▼                           ▼
                         ┌─────────────────┐          ┌─────────────────┐
                         │ Proceed Checkout│          │ Validate Coupon │
                         └────────┬────────┘          └────────┬────────┘
                                  │                           │
                                  ▼                           │
                         ┌─────────────────┐                   │
                         │ Select Address  │                   │
                         └────────┬────────┘                   │
                                  │                            │
                                  ▼                            │
                         ┌─────────────────┐                   │
                         │Select Shipping  │                   │
                         └────────┬────────┘                   │
                                  │                            │
                                  ▼                            │
                         ┌─────────────────┐                   │
                         │ Select Payment  │                   │
                         └────────┬────────┘                   │
                                  │                            │
                                  ▼                            │
                         ┌─────────────────┐                   │
                         │  Place Order    │◀──────────────────┘
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Razorpay Pay   │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                             │
                    ▼                             ▼
           ┌─────────────────┐          ┌─────────────────┐
           │   Payment Success│          │  Payment Failed │
           └────────┬────────┘          └────────┬────────┘
                    │                             │
                    ▼                             ▼
           ┌─────────────────┐          ┌─────────────────┐
           │ Create Order DB │          │    Show Error   │
           └────────┬────────┘          └─────────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │Order Confirmation│
           └─────────────────┘
```

### 5.3 Admin Order Processing Flow

```
┌─────────────────┐
│  New Order Received│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process Payment │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Status:  │
│ "Confirmed"     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process/Prepare │
│ Order           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Status:  │
│ "Processing"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Tracking    │
│ Enter Courier   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Status:  │
│ "Shipped"       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Status:  │
│ "Delivered"     │
└─────────────────┘
```

### 5.4 Return/Refund Flow

```
┌─────────────────┐
│ Customer Requests│
│ Return           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Reviews   │
│ Request         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Approve│ │Reject │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Receive│ │Inform │
│Return │ │Customer│
└───┬───┘ └───────┘
    │
    ▼
┌───────┐
│Process│
│Refund │
└───┬───┘
    │
    ▼
┌───────┐
│Update │
│Status │
└───────┘
```

---

## 6. UI/UX DESIGN SPECIFICATIONS

### 6.1 Design System

#### Color Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary | `#DD3B5F` | CTAs, links, accents |
| Primary Dark | `#C02A4D` | Hover states |
| Primary Light | `#FCEEF2` | Light backgrounds |
| Secondary | `#4A90A4` | Secondary actions |
| Success | `#10B981` | Success states |
| Warning | `#F59E0B` | Warning states |
| Error | `#EF4444` | Error states |
| Background | `#F9FAFB` | Page background |
| Surface | `#FFFFFF` | Card backgrounds |
| Text Primary | `#111827` | Headings, body text |
| Text Secondary | `#6B7280` | Secondary text |
| Border | `#E5E7EB` | Borders, dividers |

#### Dark Mode Colors

| Color Name | Hex Code |
|------------|----------|
| Background | `#111827` |
| Surface | `#1F2937` |
| Text Primary | `#F9FAFB` |
| Text Secondary | `#9CA3AF` |
| Border | `#374151` |

#### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 32px | 800 (ExtraBold) |
| H2 | Inter | 28px | 700 (Bold) |
| H3 | Inter | 24px | 700 (Bold) |
| H4 | Inter | 20px | 600 (SemiBold) |
| Body | Inter | 16px | 400 (Regular) |
| Small | Inter | 14px | 400 (Regular) |
| Tiny | Inter | 12px | 400 (Regular) |

#### Spacing System

| Name | Value |
|------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

#### Border Radius

| Name | Value |
|------|-------|
| sm | 4px |
| md | 8px |
| lg | 12px |
| xl | 16px |
| full | 9999px |

### 6.2 Layout Specifications

#### Page Layouts

**Storefront Layout (Default)**
```
┌────────────────────────────────────────────────┐
│                    HEADER                       │
│  Logo | Search Bar | Cart | User Menu           │
├────────────────────────────────────────────────┤
│                 CATEGORY BAR                     │
│  [All Products] [Categories...] [Brands...]     │
├────────────────────────────────────────────────┤
│                                                  │
│                  MAIN CONTENT                    │
│                                                  │
│                                                  │
├────────────────────────────────────────────────┤
│                    FOOTER                       │
│  Links | Contact | Social | Copyright           │
└────────────────────────────────────────────────┘
```

**Admin Layout**
```
┌──────┬─────────────────────────────────────────┐
│      │              TOP BAR                    │
│  S   │  [Breadcrumb] [Notifications] [Profile] │
│  I   ├─────────────────────────────────────────┤
│  D   │                                         │
│  E   │                                         │
│  B   │              MAIN CONTENT               │
│  A   │                                         │
│  R   │                                         │
│      │                                         │
└──────┴─────────────────────────────────────────┘
```

#### Breakpoints

| Name | Min Width | Max Width | Columns |
|------|-----------|-----------|---------|
| Mobile | 0px | 767px | 4 |
| Tablet | 768px | 1023px | 8 |
| Desktop | 1024px | 1279px | 12 |
| Wide | 1280px+ | - | 12 |

### 6.3 Component Specifications

#### Buttons

**Primary Button**
- Background: Primary color
- Text: White
- Padding: 12px 24px
- Border Radius: 8px
- Font Weight: 600
- Hover: Primary Dark color
- Active: Scale 0.98

**Secondary Button**
- Background: Transparent
- Border: 2px solid Primary
- Text: Primary color
- Hover: Primary/10 background

**Ghost Button**
- Background: Transparent
- Text: Gray-600
- Hover: Gray-100 background

#### Form Inputs

- Height: 44px
- Border: 1px solid Gray-300
- Border Radius: 8px
- Padding: 0 16px
- Focus: Ring 2px Primary/30

#### Cards

- Background: White
- Border Radius: 12px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 24px

#### Navigation

**Header**
- Height: 72px
- Sticky on scroll
- Background: White with blur

**Sidebar (Admin)**
- Width: 260px (expanded), 72px (collapsed)
- Fixed position
- Background: White

### 6.4 Animations

| Animation | Duration | Easing |
|-----------|----------|--------|
| Fade In | 200ms | ease-out |
| Slide Up | 300ms | ease-out |
| Scale | 150ms | ease-in-out |
| Hover | 150ms | ease |

---

## 7. DATA MODELS & SCHEMA

### 7.1 User Model

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  role: 'user' | 'admin';
  
  // Email Verification
  isVerified: boolean;
  verificationToken?: string;
  
  // User Type & Verification (Dental-specific)
  userType: 'dental-doctor' | 'dental-student' | 'dental-business' | 'regular';
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  
  // Verification Details (varies by userType)
  licenseId?: string;           // For dental-doctor
  licenseState?: string;       // For dental-doctor
  specialization?: string;       // For dental-doctor
  institution?: string;         // For dental-student
  studentId?: string;           // For dental-student
  gstNumber?: string;           // For dental-business
  businessName?: string;        // For dental-business
  
  // Profile
  avatar?: string;
  addresses: Address[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 7.2 Address Model

```typescript
interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}
```

### 7.3 Product Model

```typescript
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  categoryId: number;
  brandId?: number;
  images: string[];
  stock: number;
  sku?: string;
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  featured: boolean;
  active: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ProductAttribute {
  name: string;
  options: string[];
}

interface ProductVariation {
  id: string;
  combination: Record<string, string>;
  price?: number;
  stock?: number;
  sku?: string;
}
```

### 7.4 Category Model

```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  featured: boolean;
  active: boolean;
  order?: number;
  keywords?: string[];
}
```

### 7.5 Brand Model

```typescript
interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  featured: boolean;
  active: boolean;
  keywords?: string[];
}
```

### 7.6 Order Model

```typescript
interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentId?: string;
  paymentMethod?: string;
  shippingAddress: Address;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

interface OrderItem {
  productId: number;
  productName: string;
  variationId?: string;
  variationDetails?: string;
  quantity: number;
  price: number;
  total: number;
}
```

### 7.7 Review Model

```typescript
interface Review {
  id: string;
  productId: number;
  userId?: string;
  reviewer: string;
  rating: number;
  title?: string;
  content: string;
  isApproved: boolean;
  createdAt: Timestamp;
}
```

### 7.8 Cart Model

```typescript
interface CartItem {
  cartItemId: string;
  productId: number;
  quantity: number;
  selectedAttributes?: Record<string, string>;
  addedAt: Timestamp;
}
```

### 7.9 Wishlist Model

```typescript
interface WishlistItem {
  productId: number;
  addedAt: Timestamp;
}
```

### 7.10 Coupon Model

```typescript
interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
}
```

### 7.11 Settings Model

```typescript
interface Settings {
  general: {
    storeName: string;
    storeTagline?: string;
    currency: string;
    currencySymbol: string;
    contactEmail: string;
    contactPhone: string;
    address?: string;
    logo?: string;
    favicon?: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
    encryption: 'tls' | 'ssl';
  };
  payment: {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    enabled: boolean;
  };
  shipping: {
    defaultCost: number;
    freeShippingThreshold?: number;
  };
  notifications: {
    orderConfirmation: boolean;
    orderShipped: boolean;
    newsletter: boolean;
    newsletterFrequency?: string;
  };
}
```

---

## 8. API ARCHITECTURE

### 8.1 API Design Principles

- RESTful API design
- JSON request/response format
- Consistent error response format
- Pagination for list endpoints
- Authentication via JWT tokens

### 8.2 API Endpoints

#### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | User login | No |
| POST | `/api/v1/auth/logout` | User logout | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/forgot-password` | Request password reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password | No |
| GET | `/api/v1/auth/verify-email` | Verify email | No |
| POST | `/api/v1/auth/resend-verification` | Resend verification | Yes |
| POST | `/api/v1/auth/admin/login` | Admin login | No |

#### Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/products` | List products | No |
| GET | `/api/v1/products/:id` | Get product | No |
| POST | `/api/v1/products` | Create product | Admin |
| PUT | `/api/v1/products/:id` | Update product | Admin |
| DELETE | `/api/v1/products/:id` | Delete product | Admin |

#### Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/categories` | List categories | No |
| GET | `/api/v1/categories/:id` | Get category | No |
| POST | `/api/v1/categories` | Create category | Admin |
| PUT | `/api/v1/categories/:id` | Update category | Admin |
| DELETE | `/api/v1/categories/:id` | Delete category | Admin |

#### Brands

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/brands` | List brands | No |
| GET | `/api/v1/brands/:id` | Get brand | No |
| POST | `/api/v1/brands` | Create brand | Admin |
| PUT | `/api/v1/brands/:id` | Update brand | Admin |
| DELETE | `/api/v1/brands/:id` | Delete brand | Admin |

#### Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/orders` | Create order | No |
| POST | `/api/v1/orders/create-razorpay-order` | Create Razorpay order | Yes |
| GET | `/api/v1/orders/me` | Get user's orders | Yes |
| GET | `/api/v1/orders/all` | Get all orders (admin) | Admin |
| PUT | `/api/v1/orders/:id/status` | Update order status | Admin |

#### Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/reviews` | List reviews | No |
| GET | `/api/v1/reviews/product/:id` | Get product reviews | No |
| POST | `/api/v1/reviews` | Create review | Yes |
| PUT | `/api/v1/reviews/:id/moderate` | Moderate review | Admin |
| DELETE | `/api/v1/reviews/:id` | Delete review | Admin |

#### Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/settings` | Get public settings | No |
| PUT | `/api/v1/settings` | Update settings | Admin |

#### Coupons

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/coupons` | List coupons | Admin |
| POST | `/api/v1/coupons` | Create coupon | Admin |
| PUT | `/api/v1/coupons/:id` | Update coupon | Admin |
| DELETE | `/api/v1/coupons/:id` | Delete coupon | Admin |
| POST | `/api/v1/coupons/validate` | Validate coupon | No |

### 8.3 Response Formats

**Success Response**
```json
{
  "success": true,
  "data": { ... }
}
```

**List Response with Pagination**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error Response**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 9. ADMIN DASHBOARD FEATURES

### 9.1 Dashboard Overview

**Widgets to Display:**
- Total Revenue (current month)
- Total Orders (current month)
- New Customers (current month)
- Pending Reviews
- Low Stock Products (< 10 units)
- Recent Orders (last 10)
- Revenue Graph (last 30 days)

### 9.2 Product Management Tabs

**Products Tab:**
- Table with columns: Image, Name, Price, Stock, Status, Actions
- Search by name
- Filter by category, brand, stock status
- Bulk actions (delete, activate, deactivate)
- Add/Edit product modal with tabs:
  - Basic Info
  - Data (price, stock, SKU)
  - Images
  - Variations
  - SEO

**Categories Tab:**
- Hierarchical list view
- Drag-and-drop reordering
- Add/Edit modal
- Image upload

**Brands Tab:**
- Grid/List view toggle
- Add/Edit modal with logo upload
- Toggle featured status

### 9.3 Order Management

**Orders List:**
- Columns: Order ID, Customer, Total, Status, Date, Actions
- Filters: Status, Date range, Search
- Bulk status update
- Order detail view with:
  - Order items
  - Customer info
  - Shipping address
  - Payment info
  - Status timeline
  - Tracking info form

### 9.4 Customer Management

**Customers List:**
- Columns: Name, Email, Orders, Joined, Status
- Search by name/email
- Click to view customer detail:
  - Profile info
  - Addresses
  - Order history
  - Account actions (disable, reset password)

### 9.5 Reviews Tab

- All reviews list
- Filter by product, rating, approval status
- Quick approve/reject
- View full review content
- Reply functionality

### 9.6 Homepage Content

**Hero Slides:**
- Slide list with drag reorder
- Add/Edit slide modal
- Image upload
- Link/CTA configuration

**Promotional Tiles:**
- Grid of tiles
- Add/Edit modal
- Image, title, link

### 9.7 Settings Sections

**General:**
- Store name, tagline
- Contact information
- Logo upload
- Currency settings

**Email:**
- SMTP configuration
- Test connection button

**Payment:**
- Razorpay API keys
- Enable/disable toggle

**Shipping:**
- Default shipping cost
- Free shipping threshold

**Notifications:**
- Toggle email notifications
- Newsletter settings

---

## 10. PAYMENT INTEGRATION

### 10.1 Razorpay Integration

**Flow:**
1. Frontend calls backend to create order
2. Backend creates Razorpay order via API
3. Frontend initializes Razorpay with order ID
4. Customer enters card details
5. Razorpay returns payment ID, order ID, signature
6. Frontend sends payment details to backend
7. Backend verifies signature
8. Backend creates order in database

**Required Fields:**
- Key ID (public)
- Key Secret (private)
- Amount (in paise)
- Currency (INR)
- Order ID
- Customer details

**Webhook Events:**
- payment.authorized
- payment.captured
- payment.failed

### 10.2 Payment Status Mapping

| Razorpay Status | Order Status |
|-----------------|--------------|
| Created | pending |
| Authorized | confirmed |
| Captured | processing |
| Refunded | refunded |
| Failed | cancelled |

---

## 11. SECURITY REQUIREMENTS

### 11.1 Authentication Security

- [ ] Password hashing (bcrypt with salt rounds)
- [ ] JWT token expiration (24 hours)
- [ ] HTTP-only cookies for token storage
- [ ] CSRF protection on mutating requests
- [ ] Rate limiting on auth endpoints

### 11.2 Input Validation

- [ ] Server-side validation (Zod schemas)
- [ ] XSS prevention (input sanitization)
- [ ] SQL injection prevention (parameterized queries via Firestore)
- [ ] Email format validation
- [ ] Phone number validation

### 11.3 Authorization

- [ ] Role-based access control (RBAC)
- [ ] Middleware for protected routes
- [ ] Admin-only route protection
- [ ] User can only access own data

### 11.4 API Security

- [ ] CORS configuration
- [ ] Helmet.js security headers
- [ ] Request timeout (2 minutes)
- [ ] Input sanitization middleware

### 11.5 Data Protection

- [ ] HTTPS only in production
- [ ] Environment variables for secrets
- [ ] Sensitive data not logged
- [ ] Secure password reset tokens (time-limited)

---

## 12. TECHNICAL STACK

### 12.1 Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.x |
| TypeScript | Type Safety | 5.x |
| Vite | Build Tool | 5.x |
| Tailwind CSS | Styling | 3.x |
| React Router | Routing | 6.x |
| Axios | HTTP Client | 1.x |
| React Lazy | Code Splitting | (React built-in) |

### 12.2 Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Firebase Cloud Functions | Serverless Functions | (latest) |
| Express.js | HTTP Framework | 4.x |
| Firebase Firestore | Database | (latest) |
| Firebase Auth | Authentication | (latest) |
| Bcrypt | Password Hashing | 5.x |
| jsonwebtoken | JWT Tokens | 9.x |
| Zod | Validation | 3.x |
| Helmet | Security Headers | 7.x |
| express-rate-limit | Rate Limiting | 7.x |
| Razorpay | Payment Gateway | 2.x |

### 12.3 Development Tools

| Technology | Purpose |
|------------|---------|
| ESLint | Linting |
| Prettier | Code Formatting |
| Git | Version Control |
| VS Code | IDE |

---

## 13. PROJECT STRUCTURE

### 13.1 Frontend Structure

```
src/
├── components/
│   ├── AdminDashboard.tsx
│   ├── AdminLogin.tsx
│   ├── Checkout.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── ProductCard.tsx
│   ├── ProductDetail.tsx
│   ├── CartSidebar.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Wishlist.tsx
│   ├── Dashboard.tsx
│   └── ...
├── utils/
│   ├── api.ts
│   ├── razorpayService.ts
│   └── adminNotificationService.ts
├── hooks/
│   ├── useApi.ts
│   └── useQueries.ts
├── contexts/
│   └── ThemeContext.tsx
├── types/
│   └── index.ts
├── App.tsx
├── index.tsx
└── index.css
```

### 13.2 Backend Structure

```
functions/
├── src/
│   ├── server.ts
│   ├── config/
│   │   └── firebase.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── productController.ts
│   │   ├── categoryController.ts
│   │   ├── brandController.ts
│   │   ├── orderController.ts
│   │   ├── reviewController.ts
│   │   └── settingsController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimiter.ts
│   │   └── sanitize.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   ├── brands.ts
│   │   ├── orders.ts
│   │   └── settings.ts
│   └── utils/
│       ├── jwt.ts
│       └── payment.ts
├── package.json
└── tsconfig.json
```

---

## 14. WORKFLOW DIAGRAMS

### 14.1 Complete Customer Journey

```
BROWSE → SELECT → CART → CHECKOUT → PAY → TRACK → RECEIVE → REVIEW
   │        │        │        │        │      │        │        │
   ▼        ▼        ▼        ▼        ▼      ▼        ▼        ▼
 Category   Prod   Review   Address  Razorpay Status Update Order in Mailbox Rating
 Pages      Detail  Items   Select   Payment Gateway Updates Place
```

### 14.2 Admin Workflow

```
ORDERS ──────────▶ PROCESS ──────────▶ SHIP ──────────▶ COMPLETE
   │                   │                   │
   ▼                   ▼                   ▼
 View Details      Update Status      Add Tracking
 Handle Cancellations              Send Notification
 Process Returns
 Handle Refunds
```

### 14.3 State Management Flow

```
USER STATE:
┌─────────────────────────────────────────────────────┐
│ isLoggedIn │ isAdmin │ user │ cart │ wishlist      │
└─────────────────────────────────────────────────────┘

CART STATE:
┌─────────────────────────────────────────────────────┐
│ items[] │ total │ itemCount │ couponCode │ discount │
└─────────────────────────────────────────────────────┘

ADMIN STATE:
┌─────────────────────────────────────────────────────┐
│ products[] │ orders[] │ users[] │ categories[] │
│ brands[] │ reviews[] │ settings │ notifications[] │
└─────────────────────────────────────────────────────┘
```

### 14.4 Data Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │ ───▶ │   API    │ ───▶ │ Firestore│
│ (React)  │      │ (Express)│      │ Database │
└──────────┘      └──────────┘      └──────────┘
     │                 │                 │
     │◀────────────────┘                 │
     │    Response (JSON)                 │
     │                                    │
     │    Update State (React)            │
     ▼                                    │
┌──────────┐                              │
│ UI Update│                              │
└──────────┘                              │
```

---

## 15. COMPONENT INVENTORY

### 15.1 Layout Components

| Component | Props | States |
|-----------|-------|--------|
| Header | user, isLoggedIn, cartCount, onNavigate, onSearch | Default, Scrolled, Mobile Menu Open |
| Footer | - | Default |
| Sidebar (Admin) | activeTab, onNavigate | Expanded, Collapsed |
| Container | maxWidth | sm, md, lg, xl, full |

### 15.2 Product Components

| Component | Props | States |
|-----------|-------|--------|
| ProductCard | product, onClick, onAddToCart, onWishlist | Default, Hover, Out of Stock |
| ProductDetail | product, onAddToCart | Default, Loading, Error |
| ProductGrid | products, onProductClick | Default, Loading, Empty |
| ProductModal | product, onClose | Open, Closed |

### 15.3 Cart Components

| Component | Props | States |
|-----------|-------|--------|
| CartSidebar | cart, onUpdateQty, onRemove, onCheckout | Open, Closed, Empty |
| CartItem | item, onUpdate, onRemove | Default, Updating |
| CartSummary | subtotal, shipping, discount, total | Default |

### 15.4 User Components

| Component | Props | States |
|-----------|-------|--------|
| Login | onLogin, onNavigateToRegister | Default, Loading, Error |
| Register | onRegister, onNavigateToLogin | Default, Loading, Error |
| UserMenu | user, onLogout | Closed, Open |
| AddressCard | address, onEdit, onDelete, onSetDefault | Default, Default Selected |

### 15.5 Form Components

| Component | Props | States |
|-----------|-------|--------|
| Input | type, value, onChange, placeholder | Default, Focus, Error, Disabled |
| Select | options, value, onChange | Default, Open, Disabled |
| Button | variant, size, loading | Default, Hover, Loading, Disabled |
| Checkbox | checked, onChange, label | Unchecked, Checked, Disabled |

### 15.6 Feedback Components

| Component | Props | States |
|-----------|-------|--------|
| Toast | message, type | Success, Error, Warning, Info |
| Modal | title, onClose | Open, Closed |
| Loading | fullScreen, message | Active |
| EmptyState | icon, message, action | Default |

### 15.7 Admin Components

| Component | Props | States |
|-----------|-------|--------|
| DataTable | columns, data, onSort, onFilter | Default, Loading, Empty, Error |
| Pagination | currentPage, totalPages, onChange | Default |
| StatusBadge | status | pending, confirmed, shipped, delivered, cancelled |
| StatCard | title, value, icon, trend | Default, Loading |

---

## 16. THIRD-PARTY INTEGRATIONS

### 16.1 Payment Gateway

**Razorpay**
- Website: https://razorpay.com
- Purpose: Accept payments via cards, UPI, net banking, wallets
- Integration Type: Payment Gateway API
- Flow: Create order → Accept payment → Verify signature

### 16.2 Email Service

**SMTP Configuration**
- Use any SMTP provider (Gmail, SendGrid, Mailgun)
- Configure via admin settings
- Uses Nodemailer for sending emails

**Transactional Emails:**
- Welcome email on registration
- Email verification
- Order confirmation
- Order shipped notification
- Password reset

### 16.3 Analytics

**Google Analytics (Conceptual)**
- Track page views
- Track e-commerce events
- Track user behavior

### 16.4 Push Notifications

**Web Push Notifications**
- Service Worker based
- Notify on new orders
- Notify on order status changes
- Notify on stock availability

---

## 17. SEO SPECIFICATIONS

### 17.1 Meta Tags

**Homepage:**
```html
<title>Alpha Dentkart - Dental Products Online Store in India</title>
<meta name="description" content="Shop quality dental supplies, equipment, and consumables. Fast delivery across India. Best prices for dentists and clinics.">
<meta name="keywords" content="dental supplies, dental equipment, dental products, online dental store">
```

**Product Pages:**
```html
<title>{Product Name} - Alpha Dentkart</title>
<meta name="description" content="{Short product description}">
<link rel="canonical" href="https://alphadentkart.com/products/{product-slug}">
```

### 17.2 Open Graph Tags

```html
<meta property="og:title" content="{Page Title}">
<meta property="og:description" content="{Description}">
<meta property="og:image" content="{Image URL}">
<meta property="og:url" content="{Page URL}">
<meta property="og:type" content="website|product">
```

### 17.3 Structured Data

**Product Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": "Image URL",
  "description": "Product Description",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  },
  "offers": {
    "@type": "Offer",
    "price": "499.00",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock"
  }
}
```

---

## 18. PERFORMANCE REQUIREMENTS

### 18.1 Page Load Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |

### 18.2 Optimization Strategies

- [ ] Code splitting with React.lazy
- [ ] Image lazy loading
- [ ] Service worker caching
- [ ] Gzip compression
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] Pagination for large datasets

---

## 19. ACCESSIBILITY REQUIREMENTS

### 19.1 WCAG 2.1 AA Compliance

- [ ] Semantic HTML elements
- [ ] ARIA labels for interactive elements
- [ ] Keyboard navigation support
- [ ] Focus indicators
- [ ] Color contrast ratios (4.5:1 for text)
- [ ] Alt text for images
- [ ] Form labels and error messages

### 19.2 Screen Reader Support

- Proper heading hierarchy (h1 → h6)
- Skip to content link
- Descriptive link text
- Form field labels
- Error announcements

---

## 20. TESTING REQUIREMENTS

### 20.1 Unit Testing

- [ ] Utility functions
- [ ] API helpers
- [ ] Validation logic
- [ ] State management

### 20.2 Integration Testing

- [ ] User registration flow
- [ ] Login/logout flow
- [ ] Checkout process
- [ ] Payment processing
- [ ] Admin CRUD operations

### 20.3 E2E Testing

- [ ] Complete purchase flow
- [ ] Admin order management
- [ ] User account management
- [ ] Responsive design testing

---

## 21. DEPLOYMENT

### 21.1 Frontend Deployment

**Vercel (Recommended)**
1. Connect GitHub repository
2. Configure environment variables
3. Deploy with automatic builds

**Firebase Hosting**
1. Build with `npm run build`
2. Deploy with `firebase deploy --only hosting`

### 21.2 Backend Deployment

**Firebase Cloud Functions**
1. Set environment variables
2. Deploy with `firebase deploy --only functions`

### 21.3 Environment Variables

**Frontend (.env)**
```
VITE_API_URL=https://your-functions-url.firebaseapp.com/api/v1
```

**Backend (Firebase Config)**
```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_key
```

---

## 22. MAINTENANCE & SUPPORT

### 22.1 Monitoring

- [ ] Firebase Console analytics
- [ ] Error tracking (Firebase Crashlytics)
- [ ] Performance monitoring
- [ ] API usage monitoring

### 22.2 Logging

- Request logging
- Error logging
- Audit logging for admin actions

### 22.3 Backup & Recovery

- Firestore automatic backups
- Manual export procedures
- Disaster recovery plan

---

## 23. FUTURE ENHANCEMENTS

### 23.1 Planned Features

- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Loyalty/reward points system
- [ ] Subscription-based ordering
- [ ] Advanced analytics dashboard
- [ ] AI-powered product recommendations
- [ ] Live chat support
- [ ] WhatsApp integration for notifications

### 23.2 Scalability Considerations

- Database sharding for high volume
- CDN for global distribution
- Microservices architecture
- Load balancing

---

## APPENDIX

### A. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | `/` or `Ctrl+K` |
| Cart | `C` |
| Wishlist | `W` |
| Account | `A` |
| Close Modal | `Escape` |

### B. Error Codes

| Code | Message | Action |
|------|---------|--------|
| AUTH001 | Invalid credentials | Check email/password |
| AUTH002 | Account not verified | Check email for verification link |
| AUTH003 | Session expired | Login again |
| CART001 | Item out of stock | Remove or wait for restock |
| CART002 | Minimum order not met | Add more items |
| PAY001 | Payment failed | Try again or use different method |
| PAY002 | Invalid payment signature | Contact support |

### C. Support Contact

- **Email**: support@alphadentkart.com
- **Phone**: +91 XXXXX XXXXX
- **Hours**: Mon-Sat, 9 AM - 6 PM IST

---

**Document Version**: 1.0
**Last Updated**: 2026-04-19
**Author**: Project Specification Team

---

*This document serves as the complete specification for recreating the Alpha Dentkart e-commerce platform from scratch. All features, workflows, designs, and technical requirements are documented here for reference and implementation.*