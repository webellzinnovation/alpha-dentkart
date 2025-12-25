import { Product, ProductAttribute, ProductVariation, Order, User } from '../types';

interface RawProduct {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: string | number;
    regular_price: string;
    sale_price: string;
    description: string;
    short_description: string;
    categories: { id: number; name: string; slug: string }[];
    brands: { id: number; name: string; slug: string; logo: string }[];
    images: string[];
    attributes: { name: string; values: string[] }[];
    variations: {
        id: number;
        attributes: Record<string, string>;
        price: number | string;
        sku: string;
        stock: string;
    }[];
}

interface RawOrder {
    id: number;
    user_id: number;
    status: string;
    total: string | number;
    date: string;
    billing: any;
    shipping: any;
    items: { product_id: number; name: string; quantity: number; total: string | number }[];
}

interface RawUser {
    id: number;
    email: string;
    name: string;
    registered: string;
    billing_phone?: string;
}

interface RawData {
    products: RawProduct[];
    orders?: RawOrder[];
    users?: RawUser[];
}

// Helper function to strip HTML tags from text
const stripHtml = (html: string): string => {
    if (!html) return '';
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#039;/g, "'");
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
};

export const adaptDemoData = (data: RawData) => {
    if (!data || !data.products) return { products: [], categories: [], brands: [] };

    const categoryMap = new Map<number, { id: number; name: string; slug: string; iconClass: string }>();
    const brandMap = new Map<number, { id: number; name: string; slug: string; logo: string; description: string; productCount: number }>();

    const products: Product[] = data.products.map(p => {
        // Parse price safely
        const price = typeof p.price === 'string' ? parseFloat(p.price) || 0 : p.price;
        const originalPrice = p.regular_price ? parseFloat(p.regular_price) : undefined;

        // Extract Categories
        p.categories.forEach(c => {
            if (!categoryMap.has(c.id)) {
                categoryMap.set(c.id, {
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    iconClass: 'fas fa-tooth' // Default icon
                });
            }
        });

        // Extract Brands
        const brandName = p.brands.length > 0 ? p.brands[0].name : undefined;
        p.brands.forEach(b => {
            if (!brandMap.has(b.id)) {
                brandMap.set(b.id, {
                    id: b.id,
                    name: b.name,
                    slug: b.slug,
                    logo: b.logo || 'https://placehold.co/100x100?text=' + b.name.substring(0, 2),
                    description: '',
                    productCount: 0
                });
            }
            const brand = brandMap.get(b.id);
            if (brand) brand.productCount++;
        });

        // Flatten attributes
        const attributes: ProductAttribute[] = p.attributes.map(a => ({
            name: a.name,
            options: a.values
        }));

        // Flatten variations
        const variations: ProductVariation[] = p.variations.map(v => ({
            id: v.id.toString(),
            attributes: v.attributes,
            price: typeof v.price === 'string' ? parseFloat(v.price) : v.price,
            stock: v.stock ? parseInt(v.stock) : 0
        }));

        return {
            id: p.id,
            name: p.name,
            category: p.categories.length > 0 ? p.categories[0].name : 'Uncategorized',
            price: price,
            originalPrice: originalPrice,
            rating: 4.5,
            reviews: 0,
            image: p.images.length > 0 ? p.images[0] : 'https://placehold.co/300?text=No+Image',
            images: p.images,
            brand: brandName,
            description: stripHtml(p.description),
            shortDescription: stripHtml(p.short_description),
            attributes: attributes,
            variations: variations,
            stock: 100,
            features: [],
            specs: {}
        };
    });

    // Process Orders
    const statusMap: Record<string, 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'> = {
        'pending': 'Processing',
        'processing': 'Processing',
        'on-hold': 'Processing',
        'completed': 'Delivered',
        'cancelled': 'Cancelled',
        'refunded': 'Cancelled',
        'failed': 'Cancelled'
    };

    const orders: Order[] = (data.orders || []).map(o => {
        // WordPress exports items as an object, convert to array
        const itemsArray = Array.isArray(o.items) ? o.items : Object.values(o.items || {});

        return {
            id: o.id.toString(),
            userId: o.user_id.toString(),
            customerName: o.billing?.first_name && o.billing?.last_name
                ? `${o.billing.first_name} ${o.billing.last_name}`.trim()
                : o.shipping?.first_name && o.shipping?.last_name
                    ? `${o.shipping.first_name} ${o.shipping.last_name}`.trim()
                    : o.billing?.first_name || o.shipping?.first_name || 'Guest Customer',
            items: itemsArray.map(item => ({
                productId: item.product_id,
                name: item.name,
                quantity: item.quantity,
                price: typeof item.total === 'string' ? parseFloat(item.total) : item.total
            })),
            total: typeof o.total === 'string' ? parseFloat(o.total) : o.total,
            status: statusMap[o.status] || 'Processing',
            date: o.date,
            shippingAddress: o.shipping || {},
            billingAddress: o.billing || {}
        };
    });

    // Process Users (Customers)
    const users: User[] = (data.users || []).map(u => ({
        name: u.name || 'Customer',
        email: u.email,
        phone: u.billing_phone || '',
        addresses: [],
        orders: orders.filter(o => o.userId === u.id.toString()),
        cart: [],
        wishlist: []
    }));

    return {
        products,
        categories: Array.from(categoryMap.values()),
        brands: Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        orders,
        users
    };
};
