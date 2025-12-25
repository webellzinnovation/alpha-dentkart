# Alpha Dentkart

A modern, full-featured e-commerce platform for dental supplies built with React, TypeScript, and Vite.

## 🚀 Features

- **Product Catalog**: Browse dental products by categories and brands
- **Advanced Search & Filters**: Find products quickly with smart filtering
- **Shopping Cart**: Add products to cart with quantity management
- **Wishlist**: Save favorite products for later
- **User Authentication**: Secure login and registration
- **Admin Dashboard**: Complete management system for products, orders, and customers
- **Order Management**: Track and manage customer orders
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Eye-friendly dark theme support
- **SEO Optimized**: Built-in SEO features for better search visibility

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS
- **Icons**: Font Awesome
- **Routing**: React Router
- **State Management**: React Hooks
- **Backend** (Coming Soon): Node.js, Express, MySQL

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/alpha-dentkart.git
cd alpha-dentkart
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3001`

## 🏗️ Project Structure

```
alpha-dentkart/
├── components/          # React components
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── ProductCard.tsx
│   ├── Shop.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── types.ts            # TypeScript type definitions
├── constants.ts        # App constants and configuration
├── utils/              # Utility functions
├── public/             # Static assets
└── App.tsx            # Main application component
```

## 🎨 Key Features

### Customer Features
- Product browsing with category and brand filters
- Product quick view and detailed pages
- Shopping cart with real-time updates
- Wishlist management
- User account and order history
- Responsive mobile-friendly design

### Admin Features
- Dashboard with analytics
- Product management (CRUD operations)
- Order management and tracking
- Customer management with password reset
- Category and brand management
- Inventory tracking
- Hero slider management
- Settings configuration

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Hostinger
1. Build the project
2. Upload `dist/` folder contents to `public_html/`
3. Configure environment variables
4. Set up MySQL database (when backend is ready)

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration (when backend is ready)
VITE_API_URL=https://your-domain.com/api

# Other configurations
VITE_SITE_NAME=Alpha Dentkart
```

## 📝 License

This project is proprietary and confidential.

## 👨‍💻 Author

**Webellz Innovation**
- Website: [Your Website]
- Email: webellzinnovation@gmail.com

## 🙏 Acknowledgments

- Product data sourced from WooCommerce migration
- Icons by Font Awesome
- UI components built with TailwindCSS

---

**Note**: This is currently a frontend-only application. Backend API with MySQL database integration is in development.
