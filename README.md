# Alpha Dentkart

A full-stack e-commerce platform for dental supplies serving dental professionals, students, and businesses in India.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite 6, TailwindCSS 3 |
| **Backend** | Express 4, TypeScript, Firebase Cloud Functions |
| **Database** | Firebase Firestore (NoSQL) |
| **Authentication** | JWT + Firebase Auth |
| **Payments** | Razorpay, PhonePe |
| **Shipping** | Shiprocket API |
| **AI** | Google Gemini (customer support chat) |
| **Mobile** | Capacitor (iOS + Android) |
| **Hosting** | Firebase Hosting + Cloud Functions |
| **CI/CD** | GitHub Actions |
| **Testing** | Vitest, React Testing Library, Playwright |

## 🚀 Features

### Customer
- Product catalog with category/brand filtering and search
- Shopping cart with quantity management
- Wishlist with cross-device sync
- Guest checkout support
- Razorpay & PhonePe payment integration
- Order tracking with status timeline
- Product reviews and ratings
- AI-powered customer support chat
- Delivery estimation by pincode
- Coupon system
- Stock notifications

### Admin
- Dashboard with analytics
- Product/category/brand CRUD management
- Order management with status updates
- Customer management with verification queue
- Coupon management
- Hero slider and promotional tile editor
- Store settings configuration
- WhatsApp notifications

### Mobile
- Capacitor-powered native apps (iOS + Android)
- Push notifications
- Camera access for verification documents
- Offline-aware with network detection

## 📦 Quick Start

### Prerequisites
- Node.js 20+ and npm
- Firebase CLI (`npm install -g firebase-tools`)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/webellzinnovation/alpha-dentkart.git
cd alpha-dentkart
```

2. Install dependencies:
```bash
npm install
cd functions && npm install && cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env
cp functions/.env.example functions/.env
# Edit both files with your actual credentials
```

4. Start the development server (frontend + backend):
```bash
npm start
```
This runs the Express backend on port 3001 and the Vite dev server on port 3000.

## 📁 Project Structure

```
alpha-dentkart/
├── components/           # React UI components (57 files)
│   ├── admin/            # Admin-specific components
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Shop.tsx
│   ├── Checkout.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── hooks/                # Custom React hooks (7)
├── contexts/             # React contexts (ThemeContext)
├── utils/                # Frontend utilities and services
├── config/               # Theme configuration
├── types.ts              # Shared TypeScript type definitions
├── constants.ts          # App constants and demo data
├── App.tsx               # Main application component
├── functions/            # Backend (Express API)
│   └── src/
│       ├── server.ts     # Express app setup
│       ├── routes/       # 31 route files
│       ├── controllers/  # 29 controller files
│       ├── middleware/   # Security & utility middleware
│       ├── services/     # Email, notification, shipping services
│       ├── utils/        # Validation, JWT, logging
│       └── config/       # Firebase Admin SDK init
├── android/              # Capacitor Android project
├── ios/                  # Capacitor iOS project
├── e2e/                  # Playwright E2E tests
├── tests/                # Integration tests
├── .github/workflows/    # CI/CD pipelines
├── firebase.json         # Firebase hosting & functions config
├── firestore.rules       # Firestore security rules
└── storage.rules         # Cloud Storage security rules
```

## 🧪 Testing

```bash
# Frontend unit tests
npm run test:run

# Backend tests
cd functions && npm test

# Coverage report
npm run test:coverage

# E2E tests
npx playwright test

# Lint
npm run lint

# Type check
npm run typecheck
```

## 🚀 Deployment

### Firebase (Production)
Push to `main` triggers automatic deployment via GitHub Actions:
- Frontend → Firebase Hosting
- Backend → Firebase Cloud Functions (asia-south1)

### Manual deployment:
```bash
firebase deploy --only hosting
firebase deploy --only functions
```

### Mobile Apps
Built via GitHub Actions workflows:
- `build-android.yml` — Capacitor Android APK
- `build-ios.yml` — Capacitor iOS build

## 🔐 Environment Variables

See `.env.example` and `functions/.env.example` for all required variables.

Key variables:
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing secret (min 64 chars) |
| `ADMIN_SECRET` | Admin authentication secret |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `VITE_API_URL` | API base URL (default: `/api/v1`) |
| `SMTP_*` | Email service configuration |

## 📝 License

Proprietary — © Webellz Innovation. All rights reserved.

## 👨‍💻 Author

**Webellz Innovation** — webellzinnovation@gmail.com
