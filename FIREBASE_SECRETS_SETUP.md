# Firebase Secrets Setup (RUN THESE COMMANDS)

Since Firebase deprecated `functions:config` (March 2026), use the new **Secrets Manager** system.

## 1. Set Secrets (Run Manually)

```bash
cd "D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart"

# Set each secret (you'll be prompted to enter the value)
firebase functions:secrets:set JWT_SECRET
# Enter: f7e3d2c1b0a9f8e7d6c5b4a3928172635443322110099887766554433221100a

firebase functions:secrets:set ADMIN_SECRET
# Enter: adk_prod_secure_778899_!@#_v2

firebase functions:secrets:set RAZORPAY_KEY_ID
# Enter: rzp_test_SR2fyu9chZhZCF

firebase functions:secrets:set RAZORPAY_KEY_SECRET
# Enter: fE85nNGgKH6F4KwuFiThjeGh

firebase functions:secrets:set WP_URL
# Enter: https://alphadentkart.com

firebase functions:secrets:set WP_CONSUMER_KEY
# Enter: ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031

firebase functions:secrets:set WP_CONSUMER_SECRET
# Enter: cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1
```

## 2. Verify Secrets Are Set

```bash
firebase functions:secrets:get
```

## 3. Verify NODE_ENV

Check that `NODE_ENV` is set to `production` in Firebase Functions:
```bash
firebase functions:config:get
# If empty, set it:
firebase functions:config:set env.node_env="production"
```

## 4. Redeploy Functions

```bash
firebase deploy --only functions
```

## 5. Verify Live Site

Visit https://alphadentkart-001.web.app and test:
- Login flow
- Product browsing
- Add to cart
- Checkout process
- Admin dashboard (if admin)

## Important Notes

1. The `functions/src/server.ts` already reads from `process.env.*` - no code changes needed
2. After setting secrets, **redeploy functions** for changes to take effect
3. Make sure `NODE_ENV=production` is set in Firebase Functions environment
4. Backup created: `backup-before-cleanup.bundle` (contains original git history with secrets)

## Cleanup After Setting Secrets

```bash
# Remove this file after setting secrets
rm FIREBASE_SECRETS_SETUP.md
```
