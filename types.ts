
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

export interface Review {
  id: string;
  productId: number;
  userId: string;
  orderId?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  isVerified: boolean;
  isApproved: boolean;
  helpful: number;
  clinicalUse?: string;
  efficacy?: number;
  safety?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    userType: string;
    verificationStatus: string;
    avatar?: string;
  };
  product?: {
    id: number;
    name: string;
    image?: string;
  };
  order?: {
    id: string;
    createdAt: string;
  };
}

export interface CartItem extends Product {
  cartItemId: string; // Unique ID for cart item (product.id + attributes)
  quantity: number;
  selectedAttributes?: Record<string, string>;
}

export interface Category {
  id: number;
  name: string;
  iconClass?: string; // Optional - for backward compatibility
  image?: string; // New - for uploaded category images
  slug?: string;
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

export interface PromotionalTile {
  id: number;
  title: string;
  subtitle?: string;
  category: string;
  price: string;
  image: string;
  link: string;
  badge?: string;
  badgeColor?: string;
  order: number;
  isActive: boolean;
  bgColorClass?: string;
  tagColorClass?: string;
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
    value: string | number;
  };
  order?: number;
  isActive?: boolean;
}

export interface BrandProfile {
  id: number;
  name: string;
  logo: string;
  description: string;
  productCount: number;
  isFeatured?: boolean;
  featuredOrder?: number;
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
  email?: string;
  isDefault: boolean;
}

export interface OrderStatusUpdate {
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Return Initiated' | 'Return Approved' | 'Return Completed' | 'Return Rejected';
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  userId?: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Return Initiated' | 'Return Approved' | 'Return Completed' | 'Return Rejected';
  total: number;
  items: { productId: string | number; name: string; quantity: number; price: number }[];
  customerName?: string;
  shippingAddress?: Address;
  paymentId?: string; // Razorpay payment ID
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentMethod?: string; // 'razorpay', 'cod', etc.
  transactionId?: string; // Razorpay order ID
  // NEW: For "new order" badge in admin
  isNew?: boolean;
  // NEW: Timestamps
  createdAt?: string;
  updatedAt?: string;
  // NEW: Additional order details
  email?: string;
  phone?: string;
  notes?: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  statusHistory?: OrderStatusUpdate[];
}


export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  orders: Order[];
  cart: CartItem[];
  wishlist: Product[];

  // User Type System
  userType: 'dental-doctor' | 'dental-student' | 'dental-business' | 'regular';

  // Dental Doctor Information
  dentalDoctorInfo?: {
    licenseId: string;
    licenseState: string;
    specialization?: string;
    clinicName?: string;
    clinicAddress?: string;
    yearsOfPractice?: number;
  };

  // Student Information
  dentalStudentInfo?: {
    studentId: string;
    institution: string;
    course: string;
    yearOfStudy: number;
    expectedGraduation?: string;
  };

  // Business Information
  dentalBusinessInfo?: {
    gstNumber: string;
    businessName: string;
    businessType: string;
    panNumber?: string;
    registrationDate?: string;
    annualTurnover?: string;
  };

  // Additional Customer Details
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  alternatePhone?: string;
  registrationDate: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  notes?: string;
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
  featuredCategorySections: string[]; // Category names for horizontal product blocks
  featuredBrandSections: string[]; // Brand names for horizontal product blocks
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  startsAt?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'order' | 'inventory' | 'customer' | 'system';
  category: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  data?: any;
}

export interface StockNotification {
  productId: number | string;
  productName: string;
  userEmail: string;
  userName: string;
  subscribedDate: string;
  notified: boolean;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'admin';
    text: string;
    timestamp: string;
    senderName?: string;
}

export interface ChatSession {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    messages: ChatMessage[];
    status: 'ai' | 'admin' | 'closed';
    startedAt: string;
    lastMessageAt: string;
    assignedAdmin?: string;
    unreadCount?: number;
}