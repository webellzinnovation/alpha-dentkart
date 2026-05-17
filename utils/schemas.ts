import { z } from 'zod';

// Product Schema
export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long").max(100, "Name is too long"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be a non-negative number"),
  originalPrice: z.coerce.number().min(0, "Original price must be a positive number").optional(),
  image: z.string().min(1, "Main image is required"),
  images: z.array(z.string()).optional().default([]),
  brand: z.string().min(1, "Brand is required"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  seoTitle: z.string().max(70, "SEO Title should be under 70 characters").optional(),
  seoDescription: z.string().max(160, "SEO Description should be under 160 characters").optional(),
  seoKeywords: z.string().optional(),
  shortDescription: z.string().max(250, "Short description should be under 250 characters").optional(),
  weight: z.string().optional(),
  badgeId: z.enum(['clinic-essential', 'bundle-deal', 'new-arrival']).optional(),
  attributes: z.array(z.object({
    name: z.string(),
    options: z.array(z.string())
  })).optional(),
  variations: z.array(z.any()).optional(),
});

// Category Schema
export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  image: z.string().optional(),
  iconClass: z.string().optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-0-]+$/, "Invalid slug format"),
});

// Brand Schema
export const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  logo: z.string().min(1, "Logo image is required"),
  description: z.string().min(1, "Description is required"),
  isFeatured: z.boolean().optional().default(false),
  featuredOrder: z.number().int().optional(),
  productCount: z.number().int().min(0).optional().default(0),
});

// Settings Schema (Store Info)
export const settingsSchema = z.object({
  store: z.object({
    name: z.string().min(1, "Store name is required"),
    email: z.string().email("Invalid store email"),
    phone: z.string().min(1, "Store phone is required"),
    address: z.string().min(1, "Store address is required"),
  }),
});

// Auth Schema (Registration)
export const authSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  userType: z.enum(['dental-doctor', 'dental-student', 'dental-business', 'regular']),
});

// Address Schema
export const addressSchema = z.object({
  type: z.enum(['Home', 'Clinic', 'Office', 'Other']),
  name: z.string().min(2, "Name is required"),
  street: z.string().min(5, "Street address is too short"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().regex(/^\d{6}$/, "ZIP code must be 6 digits"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  isDefault: z.boolean().optional().default(false),
});
