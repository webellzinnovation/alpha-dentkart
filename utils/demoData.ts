export const demoCategories = [
  { id: 1, name: 'Restorative', slug: 'restorative', iconClass: 'fas fa-tooth', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400' },
  { id: 2, name: 'Endodontics', slug: 'endodontics', iconClass: 'fas fa-briefcase-medical', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400' },
  { id: 3, name: 'Equipment', slug: 'equipment', iconClass: 'fas fa-stethoscope', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400' },
  { id: 4, name: 'Disposable', slug: 'disposable', iconClass: 'fas fa-hand-sparkles', image: 'https://images.unsplash.com/photo-1584308666744-24ee5e727965?w=400' },
  { id: 5, name: 'Personal Care', slug: 'personal-care', iconClass: 'fas fa-user-nurse', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400' },
  { id: 6, name: 'Infection Control', slug: 'infection-control', iconClass: 'fas fa-shield-virus', image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400' },
];

export const demoBrands = [
  { id: 1, name: '3M Oral Care', logo: 'https://logo.clearbit.com/3m.com' },
  { id: 2, name: 'Dentsply Sirona', logo: 'https://logo.clearbit.com/dentsplysirona.com' },
  { id: 3, name: 'Kerr', logo: 'https://logo.clearbit.com/kerrdental.com' },
  { id: 4, name: 'GC America', logo: 'https://logo.clearbit.com/gcamerica.com' },
  { id: 5, name: 'Ivoclar', logo: 'https://logo.clearbit.com/ivoclar.com' },
  { id: 6, name: 'Septodont', logo: 'https://logo.clearbit.com/septodont.com' },
];

export const demoProducts = [
  { id: 1, name: 'Filtek Z250 Universal Restorative', price: 2450, originalPrice: 2800, image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400', category: 'Restorative', brand: '3M Oral Care', rating: 4.5, reviews: 128, stock: 50, description: 'Universal nanohybrid composite for direct restorations' },
  { id: 2, name: 'ProTaper Gold Rotary Files', price: 3200, originalPrice: 3500, image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400', category: 'Endodontics', brand: 'Dentsply Sirona', rating: 4.8, reviews: 89, stock: 35, description: 'Engineered for efficient and safe root canal treatment' },
  { id: 3, name: 'LED Dental Curing Light', price: 8500, originalPrice: 9500, image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', category: 'Equipment', brand: 'Kerr', rating: 4.3, reviews: 156, stock: 20, description: 'High-power LED curing light with ergonomic design' },
  { id: 4, name: 'Nitrile Examination Gloves (Box of 100)', price: 450, originalPrice: 500, image: 'https://images.unsplash.com/photo-1584308666744-24ee5e727965?w=400', category: 'Disposable', brand: 'GC America', rating: 4.6, reviews: 342, stock: 500, description: 'Powder-free nitrile gloves, blue, medium' },
  { id: 5, name: 'Fuji IX GP Fast Restorative', price: 1800, originalPrice: 2100, image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400', category: 'Restorative', brand: 'GC America', rating: 4.7, reviews: 67, stock: 80, description: 'Glass ionomer restorative with outstanding aesthetics' },
  { id: 6, name: 'Dental Autoclave 24L', price: 28000, originalPrice: 32000, image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400', category: 'Equipment', brand: 'Kerr', rating: 4.4, reviews: 45, stock: 8, description: 'Class B steam sterilizer with rapid cycle' },
  { id: 7, name: 'Septocaine 4% with Epinephrine', price: 890, originalPrice: 950, image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400', category: 'Infection Control', brand: 'Septodont', rating: 4.9, reviews: 234, stock: 200, description: 'Local anesthetic for pain-free procedures' },
  { id: 8, name: 'Estelite Asteria Composite', price: 2200, originalPrice: 2500, image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400', category: 'Restorative', brand: 'Tokuyama', rating: 4.6, reviews: 78, stock: 60, description: 'Superpolygonized nano-composite for anterior restorations' },
];

export const demoHeroSlides = [
  { id: 1, title: 'Premium Dental Supplies', subtitle: 'Quality products for dental professionals', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200', buttonText: 'Shop Now', buttonLink: '/shop' },
  { id: 2, title: 'Best Prices Guaranteed', subtitle: 'Up to 30% off on select items', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200', buttonText: 'Browse Deals', buttonLink: '/shop?deal=true' },
];

export const demoPromotionalTiles = [
  { id: 1, title: 'New Arrivals', subtitle: 'Check out the latest products', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600', link: '/shop?sort=newest', type: 'banner' },
  { id: 2, title: 'Best Sellers', subtitle: 'Most popular this month', image: 'https://images.unsplash.com/photo-1584308666744-24ee5e727965?w=600', link: '/shop?sort=popular', type: 'banner' },
];

export const demoSettings = {
  general: {
    storeName: 'Alpha Dentkart',
    logo: '/Alpha-dentkart-logo-600p.png',
    siteIcon: '/Alpha-dentkart-logo-icon.png',
    favicon: '/Alpha-dentkart-logo-icon.png',
    supportEmail: 'support@alphadentkart.com',
    currency: 'INR',
    contactPhone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    address: '123 Dental Park, New Delhi'
  },
  payment: {
    phonepe: { enabled: false },
    razorpay: { enabled: true, keyId: 'rzp_test_SR2fyu9chZhZCF' },
    cod: { enabled: true }
  },
  shipping: {
    standardRate: 150,
    freeShippingThreshold: 5000,
    enableInternational: false
  },
  whatsapp: { enabled: true },
  notifications: {
    orderConfirmation: true,
    orderConfirmationMessage: 'Thank you!',
    orderShipped: true
  }
};
