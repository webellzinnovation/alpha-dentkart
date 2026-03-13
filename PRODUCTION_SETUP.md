# Production Setup Guide

## Overview
This document outlines the steps required to configure Alpha Dentkart for production deployment.

---

## Required Secrets Configuration

### 1. GitHub Secrets (Repository Settings)

Navigate to: `Settings → Secrets and variables → Actions`

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | Firebase Console → Project Settings → General |
| `VITE_API_URL` | Production API URL | Firebase Functions → Deploy → Copy URL |
| `FIREBASE_SERVICE_ACCOUNT_ALPHADENTKART_001` | Firebase Service Account JSON | Firebase Console → Project Settings → Service Accounts → Generate New Private Key |

### 2. Firebase Function Secrets

Set these using Firebase CLI:
```bash
firebase functions:secrets:set JWT_SECRET
firebase functions:secrets:set ADMIN_SECRET
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set SHIPROCKET_TOKEN
firebase functions:secrets:set SHIPROCKET_CHANNEL_ID
firebase functions:secrets:set DEFAULT_PICKUP_PINCODE
```

Or configure via Firebase Console → Functions → Configuration

---

## Environment Variables Reference

### Frontend (.env.production)
```
VITE_API_URL=https://your-function-url.cloudfunctions.net/api/v1
VITE_FIREBASE_API_KEY=your_api_key
```

### Backend (Firebase Functions)
```
JWT_SECRET=your_secure_random_string_min_32_chars
ADMIN_SECRET=your_secure_admin_password
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SHIPROCKET_TOKEN=your_shiprocket_token
SHIPROCKET_CHANNEL_ID=your_channel_id
DEFAULT_PICKUP_PINCODE=400001
```

---

## Payment Gateway Setup

### Razorpay
1. Create account at https://razorpay.com
2. Get API Keys from Dashboard → Settings → API Keys
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
4. Update frontend settings to enable Razorpay

### PhonePe (Optional)
1. Create merchant account at https://phonepe.io
2. Get Merchant ID, Salt Key, and Salt Index
3. Update settings in Admin Dashboard

---

## WhatsApp API Setup (Optional)

1. Create app at https://developers.facebook.com/
2. Get Phone Number ID, Access Token, Business Account ID
3. Enable WhatsApp in Admin Dashboard → Settings → WhatsApp

---

## Domain Configuration

### Custom Domain (alphadentkart.com)
1. Purchase domain from registrar
2. Go to Firebase Console → Hosting
3. Add custom domain
4. Update DNS records as instructed
5. Wait for SSL provisioning (can take up to 24 hours)

---

## Pre-Launch Checklist

- [ ] All GitHub secrets configured
- [ ] Firebase Function secrets configured
- [ ] Payment gateway keys set (Razorpay)
- [ ] SMTP credentials configured for emails
- [ ] WhatsApp API credentials (if using)
- [ ] Shiprocket credentials (if using)
- [ ] Custom domain pointed to Firebase
- [ ] SSL certificate active
- [ ] Test checkout flow
- [ ] Test email notifications
- [ ] Test order creation in admin panel

---

## Testing Commands

```bash
# Build frontend
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy functions
firebase deploy --only functions

# Deploy everything
firebase deploy
```

---

## Security Notes

1. **Never commit credentials** to the repository
2. Use GitHub Secrets for CI/CD
3. Use Firebase Secrets for backend
4. Rotate API keys periodically
5. Enable 2FA on all accounts
6. Use strong, unique passwords
7. Enable logging and monitoring
