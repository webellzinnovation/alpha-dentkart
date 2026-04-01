export declare const mockSettings: {
    general: {
        storeName: string;
        logo: string;
        siteIcon: string;
        favicon: string;
        supportEmail: string;
        currency: string;
        contactPhone: string;
        whatsapp: string;
        address: string;
    };
    payment: {
        phonepe: {
            enabled: boolean;
        };
        razorpay: {
            enabled: boolean;
            keyId: string;
        };
        cod: {
            enabled: boolean;
        };
    };
    shipping: {
        standardRate: number;
        freeShippingThreshold: number;
        enableInternational: boolean;
    };
    featuredCategorySections: string[];
    featuredBrandSections: string[];
    showcaseCategories: string[];
    showcaseBrands: string[];
    badges: string[];
    notifications: {
        orderConfirmation: boolean;
        orderConfirmationMessage: string;
        orderShipped: boolean;
        orderShippedMessage: string;
        orderDelivered: boolean;
        orderDeliveredMessage: string;
        orderCancelled: boolean;
        orderCancelledMessage: string;
        welcomeEmail: boolean;
        welcomeEmailMessage: string;
        welcomeCouponCode: string;
        welcomeDiscount: number;
        promotional: boolean;
        promotionalTitle: string;
        promotionalMessage: string;
        abandonedCart: boolean;
        abandonedCartMessage: string;
        abandonedCartDelay: number;
        newsletter: boolean;
        newsletterTitle: string;
        newsletterFrequency: string;
    };
};
export declare const mockCategories: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: null;
    count: number;
    createdAt: string;
}[];
export declare const mockBrands: {
    id: string;
    name: string;
    image: string;
    slug: string;
}[];
export declare const mockProducts: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    stock: number;
    badge: string;
    categoryId: string;
    category: string;
    brand: string;
    brandId: string;
    slug: string;
    rating: number;
    reviews: number;
    images: string[];
    keywords: string[];
    features: string[];
    specs: {};
    attributes: never[];
    variations: never[];
    createdAt: string;
}[];
//# sourceMappingURL=localData.d.ts.map