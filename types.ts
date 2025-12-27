
export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface ProductVariation {
  id: string;
  attributes: Record<string, string>;
  price?: number;
  originalPrice?: number;
  image?: string;
  stock?: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews?: number;
  image: string;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'red' | 'purple';
  badgeId?: 'clinic-essential' | 'bundle-deal' | 'new-arrival'; // NEW: For homepage customization
  timer?: string;
  brand?: string;
  description?: string;
  features?: string[];
  specs?: Record<string, string>;
  images?: string[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  shortDescription?: string;
  weight?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  stock?: number;
}

export interface CartItem extends Product {
  cartItemId: string; // Unique ID for cart item (product.id + attributes)
  quantity: number;
  selectedAttributes?: Record<string, string>;
}

export interface Category {
  id: number;
  name: string;
  iconClass: string;
}

export interface PromoBanner {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  image: string;
  bgColorClass: string;
  tag: string;
  tagColorClass: string;
}

export interface HeroSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  bgClass: string;
  gradientClass: string;
  link?: {
    type: 'product' | 'category' | 'brand' | 'url';
    value: string | number; // product ID, category name, brand name, or URL
  };
}

export interface BrandProfile {
  id: number;
  name: string;
  logo: string;
  description: string;
  productCount: number;
}

export interface Address {
  id: number;
  type: 'Home' | 'Clinic' | 'Office';
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  userId?: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: { name: string; quantity: number; price: number }[];
  customerName?: string;
}

export interface User {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  orders: Order[];
  cart: CartItem[];
  wishlist: Product[];
}

// Homepage Customization Types
export interface ProductBadge {
  id: 'clinic-essential' | 'bundle-deal' | 'new-arrival';
  name: string;
  color: string; // Text color
  bgColor: string; // Background color
  enabled: boolean;
}

export interface HomepageSettings {
  badges: ProductBadge[];
  showcaseCategories: string[]; // Category names in display order
  showcaseBrands: string[]; // Brand names in display order
}