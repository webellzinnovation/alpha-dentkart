# Graph Report - .  (2026-04-23)

## Corpus Check
- Large corpus: 517 files · ~431,533 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1749 nodes · 3855 edges · 51 communities detected
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 844 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & Admin Controllers|Auth & Admin Controllers]]
- [[_COMMUNITY_AI Chat Service|AI Chat Service]]
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_API Core|API Core]]
- [[_COMMUNITY_Request Builder|Request Builder]]
- [[_COMMUNITY_Checkout & Address|Checkout & Address]]
- [[_COMMUNITY_AI Chat Handlers|AI Chat Handlers]]
- [[_COMMUNITY_Brand & Category|Brand & Category]]
- [[_COMMUNITY_WhatsApp Integration|WhatsApp Integration]]
- [[_COMMUNITY_Shiprocket Shipping|Shiprocket Shipping]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)
1. `r()` - 94 edges
2. `l()` - 92 edges
3. `s()` - 52 edges
4. `R()` - 51 edges
5. `ci` - 36 edges
6. `Bs` - 29 edges
7. `kt` - 26 edges
8. `ShiprocketService` - 24 edges
9. `WhatsAppService` - 24 edges
10. `qn` - 23 edges

## Surprising Connections (you probably didn't know these)
- `fetchUserOrders()` --calls--> `getMyOrders()`  [INFERRED]
  D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\App.tsx → D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\functions\src\controllers\orderController.ts
- `handleLogin()` --calls--> `login()`  [INFERRED]
  D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\App.tsx → D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\functions\src\controllers\authController.ts
- `handleLogout()` --calls--> `logout()`  [INFERRED]
  D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\App.tsx → D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\functions\src\controllers\authController.ts
- `handleUpdateUser()` --calls--> `updateProfile()`  [INFERRED]
  D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\App.tsx → D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\backend\src\controllers\authController.ts
- `c()` --calls--> `x()`  [INFERRED]
  D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\android\app\src\main\assets\public\assets\vendor-PidWjDGE.js → D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart\android\app\src\main\assets\public\assets\index-CCkYRoi_.js

## Communities

### Community 0 - "Auth & Admin Controllers"
Cohesion: 0.02
Nodes (136): handleSubmit(), getAdminStats(), loadAppData(), refreshData(), adminLogin(), adminLogin(), forgotPassword(), generateAndStoreVerificationToken() (+128 more)

### Community 1 - "AI Chat Service"
Cohesion: 0.03
Nodes (132): a(), ai(), an(), ao(), as(), At, bi, bn() (+124 more)

### Community 2 - "Admin Dashboard"
Cohesion: 0.03
Nodes (90): A(), ai(), ao(), constructor(), de(), _e(), ee(), Fe() (+82 more)

### Community 3 - "API Core"
Cohesion: 0.03
Nodes (26): ar, ci, el, er, ir, nr(), or(), Pr() (+18 more)

### Community 4 - "Request Builder"
Cohesion: 0.05
Nodes (26): Bs, Es, fs, hi(), js(), kn(), qi(), Xi (+18 more)

### Community 5 - "Checkout & Address"
Cohesion: 0.05
Nodes (11): n(), handlePayment(), CouponService, GuestCheckoutService, useGuestCheckout(), formatAmountForRazorpay(), getPaymentSettings(), getRazorpayKey() (+3 more)

### Community 6 - "AI Chat Handlers"
Cohesion: 0.05
Nodes (27): sr, handleSend(), initChat(), chatWithAI(), fetchUserOrders(), handleAddHeroSlide(), handleLogin(), handleLogout() (+19 more)

### Community 7 - "Brand & Category"
Cohesion: 0.08
Nodes (14): handleDeleteHeroSlide(), createBrand(), deleteBrand(), getAllBrands(), reorderFeaturedBrands(), toggleBrandFeatured(), updateBrand(), CacheManager (+6 more)

### Community 8 - "WhatsApp Integration"
Cohesion: 0.1
Nodes (14): sendCustomWhatsApp(), sendOrderStatusWhatsApp(), sendPaymentReminderWhatsApp(), clearForm(), handleSendCustomMessage(), handleSendDeliveryConfirmation(), handleSendOrderCancellation(), handleSendOrderConfirmation() (+6 more)

### Community 9 - "Shiprocket Shipping"
Cohesion: 0.1
Nodes (9): calculateShippingCharges(), cancelShiprocketOrder(), checkPincodeServiceability(), createShiprocketOrder(), getAvailableCouriers(), getEstimatedDelivery(), getShippingRates(), trackShipment() (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (22): addAdminNotification(), clearAllNotifications(), deleteNotification(), generateNotificationId(), getAllAdminNotifications(), getNotificationsByType(), getUnreadCount(), markAllNotificationsAsRead() (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (25): Admin Dashboard, Alpha Dentkart, Google Cloud Run Backend, Coupon Discount System, CSRF Protection, Data Import Migration, Firebase Authentication, Firebase Cloud Functions (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (4): gi, hs(), ps(), qn

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (15): generateId(), getActiveSessionsCount(), getChatById(), getChatSessions(), getOrCreateSession(), getTotalUnreadCount(), markSessionAsRead(), saveChatMessage() (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (12): handleNotifyMe(), getAllStockNotifications(), getStockAvailableEmailHTML(), getSubscriberCount(), getSubscribersForProduct(), isSubscribedToProduct(), markNotificationsAsSent(), notifyAllSubscribers() (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (1): ShiprocketAPIService

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (2): p, x()

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (1): DeliveryEstimationService

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (3): async(), generateVerificationToken(), sendPasswordResetEmail()

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (7): jt, tl, handleListModels(), handleTestConnection(), testLocalApi(), debugProductionApi(), testUpdateOrder()

### Community 20 - "Community 20"
Cohesion: 0.38
Nodes (10): deletePaymentMethod(), getDefaultPaymentMethod(), getPaymentMethodById(), getPaymentMethodsByGateway(), getPaymentMethodStats(), getUserPaymentMethods(), savePaymentMethod(), setDefaultPaymentMethod() (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.63
Nodes (10): batchWrite(), fetchAll(), migrateBrands(), migrateCategories(), migrateCustomers(), migrateOrders(), migrateProducts(), migrateReviews() (+2 more)

### Community 22 - "Community 22"
Cohesion: 0.63
Nodes (10): batchWrite(), fetchAll(), runIncrementalSync(), sleep(), syncBrands(), syncCategories(), syncCustomers(), syncOrders() (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (4): errorHandler(), captureException(), init(), initSentry()

### Community 24 - "Community 24"
Cohesion: 0.27
Nodes (6): authenticateToken(), optionalAuth(), requireAdmin(), generateToken(), getJwtSecret(), verifyToken()

### Community 25 - "Community 25"
Cohesion: 0.45
Nodes (8): deleteVerification(), getAllVerificationAuditLogs(), getAllVerifications(), getVerificationAuditLogs(), getVerificationById(), getVerificationStats(), submitVerification(), updateVerificationStatus()

### Community 27 - "Community 27"
Cohesion: 0.47
Nodes (8): fetchAll(), searchBrandLogo(), sleep(), syncBrands(), syncCategories(), syncOrders(), syncProducts(), syncUsers()

### Community 29 - "Community 29"
Cohesion: 0.6
Nodes (9): getAbandonedCartEmail(), getEmailFooter(), getEmailHeader(), getNewsletterEmail(), getOrderConfirmationEmail(), getProductRecommendationEmail(), getPromotionalEmail(), getWelcomeEmail() (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (6): cancelReorder(), createQuickReorder(), getRecommendedReorders(), getReorderById(), getReorderStats(), getUserReorders()

### Community 31 - "Community 31"
Cohesion: 0.31
Nodes (1): EmailService

### Community 32 - "Community 32"
Cohesion: 0.31
Nodes (3): backfillKeywords(), generateKeywords(), generateProductKeywords()

### Community 34 - "Community 34"
Cohesion: 0.58
Nodes (6): calculateDeliveryEstimation(), checkPincodeServiceability(), getCartDeliveryEstimate(), getDeliveryAnalytics(), getDeliveryHistory(), getShippingCost()

### Community 35 - "Community 35"
Cohesion: 0.32
Nodes (3): goToNextImage(), goToPreviousImage(), handleKeyDown()

### Community 36 - "Community 36"
Cohesion: 0.32
Nodes (3): handleDelete(), handleSubmit(), loadUserVerifications()

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (1): It

### Community 42 - "Community 42"
Cohesion: 0.7
Nodes (2): sanitizeInput(), stripHtml()

### Community 43 - "Community 43"
Cohesion: 0.4
Nodes (1): async()

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (1): bypassLimiter()

### Community 47 - "Community 47"
Cohesion: 0.5
Nodes (1): requestLogger()

### Community 48 - "Community 48"
Cohesion: 0.5
Nodes (1): validateRequest()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (2): sendCsrfToken(), shouldSkipCSRF()

### Community 50 - "Community 50"
Cohesion: 0.5
Nodes (1): PushNotificationService

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (2): createUniqueSlug(), generateSlug()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (1): ExampleInstrumentedTest

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (2): BridgeActivity, MainActivity

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (1): ExampleUnitTest

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (1): testFirebase()

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (2): fetchOrders(), main()

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (1): fetchInvoice()

### Community 64 - "Community 64"
Cohesion: 0.67
Nodes (1): mockProductsPagination()

### Community 65 - "Community 65"
Cohesion: 0.67
Nodes (1): useVerification()

## Knowledge Gaps
- **30 isolated node(s):** `i`, `Tt`, `At`, `Ot`, `St` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 15`** (18 nodes): `ShiprocketAPIService`, `.apiCall()`, `.calculateShippingCharges()`, `.cancelOrder()`, `.checkPincodeServiceability()`, `.constructor()`, `.createOrder()`, `.formatDeliveryMessage()`, `.formatShippingRate()`, `.getAvailableCouriers()`, `.getEstimatedDelivery()`, `.getFreeShippingMessage()`, `.getShippingRates()`, `.isSameDayDelivery()`, `.trackOrder()`, `.trackShipment()`, `useShippingCalculation()`, `shiprocketAPI.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (17 nodes): `index-CCkYRoi_.js`, `b()`, `D()`, `f()`, `g()`, `i()`, `k()`, `N()`, `O()`, `p`, `.componentDidCatch()`, `.getDerivedStateFromError()`, `.render()`, `__vite__mapDeps()`, `w()`, `x()`, `y()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (17 nodes): `deliveryEstimationService.ts`, `DeliveryEstimationService`, `.calculateAccuracy()`, `.calculateDeliveryDate()`, `.calculateDeliveryEstimation()`, `.calculateShippingCost()`, `.calculateShippingOptions()`, `.calculateTotalDimensions()`, `.checkWeatherDelays()`, `.constructor()`, `.getDeliveryAnalytics()`, `.getDeliveryHistory()`, `.getProductWeight()`, `.storeDeliveryEstimation()`, `.validatePincode()`, `deliveryEstimationService.js`, `deliveryEstimationService.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (9 nodes): `emailService.ts`, `EmailService`, `.constructor()`, `.initializeTransporter()`, `.sendEmail()`, `.sendPasswordResetEmail()`, `.sendVerificationEmail()`, `EmailService.js`, `EmailService.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (6 nodes): `It`, `.codeExecutionResult()`, `.data()`, `.executableCode()`, `.functionCalls()`, `.text()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (5 nodes): `sanitize.ts`, `sanitize.js`, `sanitize.ts`, `sanitizeInput()`, `stripHtml()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (5 nodes): `async()`, `handleMouseLeave()`, `handleMouseMove()`, `if()`, `AdminDashboard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (4 nodes): `rateLimiter.ts`, `rateLimiter.js`, `rateLimiter.ts`, `bypassLimiter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `requestLogger.ts`, `requestLogger.js`, `requestLogger.ts`, `requestLogger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (4 nodes): `shiprocket.ts`, `shiprocket.js`, `shiprocket.ts`, `validateRequest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (4 nodes): `sendCsrfToken()`, `shouldSkipCSRF()`, `csrf.js`, `csrf.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (4 nodes): `PushNotificationService`, `.initialize()`, `.removeListener()`, `pushNotifications.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (4 nodes): `createUniqueSlug()`, `extractIdFromSlug()`, `generateSlug()`, `slugify.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `ExampleInstrumentedTest.java`, `ExampleInstrumentedTest`, `.useAppContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `MainActivity.java`, `BridgeActivity`, `MainActivity`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `ExampleUnitTest.java`, `ExampleUnitTest`, `.addition_isCorrect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (3 nodes): `test-firebase.ts`, `test-firebase.ts`, `testFirebase()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (3 nodes): `fetchOrders.js`, `fetchOrders()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (3 nodes): `InvoiceViewer.tsx`, `fetchInvoice()`, `handleDownload()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (3 nodes): `localData.js`, `localData.ts`, `mockProductsPagination()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (3 nodes): `useVerification.ts`, `useVerification.ts`, `useVerification()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `R()` connect `Admin Dashboard` to `Auth & Admin Controllers`, `AI Chat Service`, `API Core`, `Request Builder`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `test()` connect `Admin Dashboard` to `Auth & Admin Controllers`, `AI Chat Service`, `Community 34`, `API Core`, `Request Builder`, `Checkout & Address`, `Brand & Category`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `qn` connect `Community 12` to `AI Chat Service`, `Checkout & Address`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 39 inferred relationships involving `R()` (e.g. with `.forEach()` and `.toString()`) actually correct?**
  _`R()` has 39 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ci` (e.g. with `.forEach()` and `R()`) actually correct?**
  _`ci` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `i`, `Tt`, `At` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Admin Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._