# Run this script in PowerShell AS ADMIN

cd "D:\Cloud iDrive\Cloud-Drive_webellzinnovation@gmail.com\Ai studio\alpha-dentkart"

Write-Host "Setting Firebase Secrets..." -ForegroundColor Green

# JWT Secret (NEW - generated)
firebase functions:secrets:set JWT_SECRET --project alphadentkart-001
# When prompted, enter:
# c2e7f98171abfd0e98db6bab076e65d0126f13c27035b4bc9e532baa8df7d10963aa432ebb8053dafb50e9cde0699b586097c65681996a37a143010565df80a4

Write-Host "JWT_SECRET set!" -ForegroundColor Yellow

# Admin Secret (NEW - generated)
firebase functions:secrets:set ADMIN_SECRET --project alphadentkart-001
# When prompted, enter:
# adk_prod_33a5d1984cfe2686d65cb98c740e9a54

Write-Host "ADMIN_SECRET set!" -ForegroundColor Yellow

# Razorpay Key ID (Test mode - replace with LIVE keys for production)
firebase functions:secrets:set RAZORPAY_KEY_ID --project alphadentkart-001
# When prompted, enter:
# rzp_test_SR2fyu9chZhZCF

Write-Host "RAZORPAY_KEY_ID set!" -ForegroundColor Yellow

# Razorpay Key Secret (Test mode - replace with LIVE keys for production)
firebase functions:secrets:set RAZORPAY_KEY_SECRET --project alphadentkart-001
# When prompted, enter:
# fE85nNGgKH6F4KwuFiThjeGh

Write-Host "RAZORPAY_KEY_SECRET set!" -ForegroundColor Yellow

# Verify all secrets
Write-Host "Verifying secrets..." -ForegroundColor Green
firebase functions:secrets:get --project alphadentkart-001

Write-Host "All secrets set! Now deploying functions..." -ForegroundColor Green

# Deploy functions with new secrets
firebase deploy --only functions --project alphadentkart-001

Write-Host "DONE! Functions deployed with new secrets." -ForegroundColor Cyan
