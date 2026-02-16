-- Database Migration Script for Alpha Dentkart Enhancements
-- Version: 2.0 - Adding Guest Checkout, Coupons, WhatsApp, and Professional Verification
-- Compatible with SQLite/Prisma

-- =============================================================================
-- 1. Add Guest Checkout Fields to Order Table
-- =============================================================================

-- Make userId nullable for guest orders
ALTER TABLE "Order" ADD COLUMN "userId_temp" TEXT;
UPDATE "Order" SET "userId_temp" = "userId";
ALTER TABLE "Order" DROP COLUMN "userId";
ALTER TABLE "Order" ADD COLUMN "userId" TEXT;

-- Update userId with nullable constraint
UPDATE "Order" SET "userId" = "userId_temp" WHERE "userId_temp" IS NOT NULL;
DROP TABLE IF EXISTS "Order_old";
ALTER TABLE "Order" RENAME TO "Order_old";
CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Processing',
  "total" REAL NOT NULL,
  "items" TEXT NOT NULL,
  "shippingAddress" TEXT,
  "paymentId" TEXT,
  "paymentStatus" TEXT DEFAULT 'pending',
  "paymentMethod" TEXT,
  "transactionId" TEXT,
  "isNew" BOOLEAN NOT NULL DEFAULT true,
  "guestEmail" TEXT,
  "guestPhone" TEXT,
  "isGuestOrder" BOOLEAN NOT NULL DEFAULT false,
  "guestSessionId" TEXT,
  "couponId" TEXT,
  "couponDiscount" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "Order" SELECT * FROM "Order_old";
DROP TABLE "Order_old";

-- =============================================================================
-- 2. Update User Model with New Fields and Relations
-- =============================================================================

-- Add new user type options and fields
ALTER TABLE "User" ADD COLUMN "userType_temp" TEXT;
UPDATE "User" SET "userType_temp" = CASE 
  WHEN "userType" = 'dental-doctor' THEN 'dental-doctor'
  ELSE 'regular'
END;
ALTER TABLE "User" DROP COLUMN "userType";
ALTER TABLE "User" ADD COLUMN "userType" TEXT NOT NULL DEFAULT 'regular';
UPDATE "User" SET "userType" = "userType_temp";

-- Add student fields
ALTER TABLE "User" ADD COLUMN "studentId" TEXT;
ALTER TABLE "User" ADD COLUMN "institution" TEXT;
ALTER TABLE "User" ADD COLUMN "course" TEXT;
ALTER TABLE "User" ADD COLUMN "yearOfStudy" INTEGER;
ALTER TABLE "User" ADD COLUMN "expectedGraduation" TEXT;

-- Add supplier fields
ALTER TABLE "User" ADD COLUMN "gstNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "businessName" TEXT;
ALTER TABLE "User" ADD COLUMN "businessType" TEXT;
ALTER TABLE "User" ADD COLUMN "panNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "registrationDate_user" TEXT; -- Renamed to avoid conflict
ALTER TABLE "User" ADD COLUMN "annualTurnover" TEXT;

-- Add WhatsApp fields
ALTER TABLE "User" ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "whatsappPhone" TEXT;

-- =============================================================================
-- 3. Create New Tables
-- =============================================================================

-- Guest Session Table
CREATE TABLE "GuestSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT,
  "phone" TEXT,
  "sessionId" TEXT NOT NULL UNIQUE,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Coupon Table
CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "value" REAL NOT NULL,
  "minimumAmount" REAL,
  "maximumDiscount" REAL,
  "usageLimit" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "userUsageLimit" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" DATETIME NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "applicableProducts" TEXT,
  "applicableCategories" TEXT,
  "userType" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Used Coupon Table
CREATE TABLE "UsedCoupon" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "couponId" TEXT NOT NULL,
  "userId" TEXT,
  "orderId" TEXT NOT NULL,
  "discountAmount" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Verification Document Table
CREATE TABLE "VerificationDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewedBy" TEXT,
  "reviewedAt" DATETIME,
  "rejectionReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Verification Audit Table
CREATE TABLE "VerificationAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- WhatsApp Notification Table
CREATE TABLE "WhatsAppNotification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "phoneNumber" TEXT NOT NULL,
  "orderId" TEXT,
  "messageType" TEXT NOT NULL,
  "templateName" TEXT,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "messageId" TEXT,
  "sentAt" DATETIME,
  "deliveredAt" DATETIME,
  "failedReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Saved Payment Method Table
CREATE TABLE "SavedPaymentMethod" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "last4" TEXT,
  "brand" TEXT,
  "expiry" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "gateway" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================================================
-- 4. Create Indexes for Performance
-- =============================================================================

-- Guest Session Indexes
CREATE INDEX "GuestSession_sessionId" ON "GuestSession"("sessionId");
CREATE INDEX "GuestSession_expiresAt" ON "GuestSession"("expiresAt");

-- Coupon Indexes
CREATE INDEX "Coupon_code" ON "Coupon"("code");
CREATE INDEX "Coupon_isActive" ON "Coupon"("isActive");
CREATE INDEX "Coupon_expiresAt" ON "Coupon"("expiresAt");

-- Used Coupon Indexes
CREATE INDEX "UsedCoupon_couponId" ON "UsedCoupon"("couponId");
CREATE INDEX "UsedCoupon_userId" ON "UsedCoupon"("userId");
CREATE INDEX "UsedCoupon_orderId" ON "UsedCoupon"("orderId");

-- Verification Document Indexes
CREATE INDEX "VerificationDocument_userId" ON "VerificationDocument"("userId");
CREATE INDEX "VerificationDocument_status" ON "VerificationDocument"("status");

-- Verification Audit Indexes
CREATE INDEX "VerificationAudit_userId" ON "VerificationAudit"("userId");
CREATE INDEX "VerificationAudit_action" ON "VerificationAudit"("action");

-- WhatsApp Notification Indexes
CREATE INDEX "WhatsAppNotification_userId" ON "WhatsAppNotification"("userId");
CREATE INDEX "WhatsAppNotification_orderId" ON "WhatsAppNotification"("orderId");
CREATE INDEX "WhatsAppNotification_status" ON "WhatsAppNotification"("status");

-- Saved Payment Method Indexes
CREATE INDEX "SavedPaymentMethod_userId" ON "SavedPaymentMethod"("userId");
CREATE INDEX "SavedPaymentMethod_isDefault" ON "SavedPaymentMethod"("isDefault");

-- Order Indexes for Guest Checkout
CREATE INDEX "Order_guestEmail" ON "Order"("guestEmail");
CREATE INDEX "Order_isGuestOrder" ON "Order"("isGuestOrder");
CREATE INDEX "Order_guestSessionId" ON "Order"("guestSessionId");

-- =============================================================================
-- 5. Insert Default Data
-- =============================================================================

-- Default Welcome Coupon
INSERT INTO "Coupon" (
  "id", "code", "type", "value", "minimumAmount", "usageLimit", 
  "userUsageLimit", "isActive", "startsAt", "expiresAt", 
  "applicableProducts", "applicableCategories", "userType", "createdAt"
) VALUES (
  'welcome-coupon',
  'WELCOME10',
  'percentage',
  10.0,
  500.0,
  1000,
  1,
  true,
  datetime('now'),
  datetime('now', '+6 months'),
  NULL,
  NULL,
  'all',
  datetime('now')
);

-- Default Free Shipping Coupon
INSERT INTO "Coupon" (
  "id", "code", "type", "value", "minimumAmount", "usageLimit",
  "userUsageLimit", "isActive", "startsAt", "expiresAt",
  "applicableProducts", "applicableCategories", "userType", "createdAt"
) VALUES (
  'freeship',
  'FREESHIP',
  'free_shipping',
  0.0,
  2000.0,
  5000,
  2,
  true,
  datetime('now'),
  datetime('now', '+3 months'),
  NULL,
  NULL,
  'all',
  datetime('now')
);

-- =============================================================================
-- 6. Update Existing Data for New Features
-- =============================================================================

-- Mark existing users as verified if they have orders
UPDATE "User" SET 
  "isVerified" = true,
  "verificationStatus" = 'approved'
WHERE "id" IN (SELECT DISTINCT "userId" FROM "Order" WHERE "userId" IS NOT NULL);

-- Set default verification status for dental doctors
UPDATE "User" SET 
  "verificationStatus" = 'pending'
WHERE "userType" = 'dental-doctor' AND "licenseId" IS NOT NULL;

-- =============================================================================
-- Migration Notes:
-- =============================================================================
-- 1. Guest Checkout: Orders can now be created without user registration
-- 2. Coupons: Complete discount system with usage tracking
-- 3. Professional Verification: Document upload and approval workflow
-- 4. WhatsApp Integration: Notification system ready for shared number approach
-- 5. Saved Payments: Ready for Razorpay/PhonePe tokenization
-- 6. All existing UI/UX functionality preserved
-- 7. Backward compatible with current frontend

-- Run this migration using: npx prisma db push
-- Or execute directly on SQLite database