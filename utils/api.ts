import axios from 'axios';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 minute timeout for large product loads
    validateStatus: (status) => status >= 200 && status < 400, // Accept 304 as valid
});

// CSRF Protection: Attach token to all non-GET requests
api.interceptors.request.use((config) => {
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf-token='))
            ?.split('=')[1];
        if (csrfToken) {
            config.headers['x-csrf-token'] = csrfToken;
        }
    }
    return config;
});

// Global Error Handling: Handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('🚫 Global Auth Failure (401): Session expired or invalid.');
            
            // Clear local stale auth data
            localStorage.setItem('isAdmin', 'false');
            localStorage.removeItem('alpha_user');
            
            // Only force redirect to login if we are in a protected area (admin, dashboard, checkout)
            const path = window.location.pathname;
            const cleanPath = path.replace(/\/+$/, '');
            const isProtectedPage = (cleanPath.includes('/admin') && cleanPath !== '/admin-login') || 
                                    cleanPath.startsWith('/dashboard') || 
                                    cleanPath.startsWith('/checkout');
            
            if (isProtectedPage) {
                if (path.includes('/admin')) {
                    window.location.href = '/admin-login';
                } else if (path !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: async (data: { email: string; password: string; name: string; phone?: string }) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, password: string) => {
        const response = await api.post('/auth/reset-password', { token, password });
        return response.data;
    },

    verifyEmail: async (token: string) => {
        const response = await api.post('/auth/verify-email', { token });
        return response.data;
    },

    updateProfile: async (data: any) => {
        const response = await api.patch('/auth/profile', data);
        return response.data;
    },
};

// Products API
export const productsAPI = {
    getAll: async (params?: { page?: number; limit?: number; categoryId?: string | number; brandId?: string | number; search?: string; sortBy?: string; sortOrder?: string }) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    getById: async (id: number | string) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/products', data);
        return response.data;
    },

    update: async (id: number | string, data: any) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id: number | string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },

    sync: async (force = false) => {
        const response = await api.post(`/sync/full${force ? '?force=true' : ''}`);
        return response.data;
    },
    syncProducts: async (force = false) => {
        const response = await api.post(`/sync/products${force ? '?force=true' : ''}`);
        return response.data;
    }
};

// Categories API
export const categoriesAPI = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/categories', data);
        return response.data;
    },

    update: async (id: number | string, data: any) => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    delete: async (id: number | string) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
    sync: async () => {
        const response = await api.post('/sync/categories');
        return response.data;
    },
};

// Brands API
export const brandsAPI = {
    getAll: async () => {
        const response = await api.get('/brands');
        return response.data;
    },
    update: async (id: number | string, data: any) => {
        const response = await api.put(`/brands/${id}`, data);
        return response.data;
    },
    updateFeatured: async (id: number | string, data: any) => {
        const response = await api.patch(`/brands/${id}/featured`, data);
        return response.data;
    },
    reorder: async (brands: any[]) => {
        const response = await api.patch('/brands/featured/reorder', { brands });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/brands', data);
        return response.data;
    },
    delete: async (id: number | string) => {
        const response = await api.delete(`/brands/${id}`);
        return response.data;
    },
    sync: async () => {
        const response = await api.post('/sync/brands');
        return response.data;
    },
};

// Hero Slides API
export const heroSlidesAPI = {
    getAll: async () => {
        const response = await api.get('/hero-slides');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/hero-slides', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.patch(`/hero-slides/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/hero-slides/${id}`);
        return response.data;
    },
    reorder: async (slides: any[]) => {
        const response = await api.patch('/hero-slides/reorder/batch', { slides });
        return response.data;
    }
};

// Promotional Tiles API
export const promotionalTilesAPI = {
    getAll: async () => {
        const response = await api.get('/promotional-tiles');
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.patch(`/promotional-tiles/${id}`, data);
        return response.data;
    }
};

// Orders API
export const ordersAPI = {
    create: async (orderData: any) => {
        const response = await api.post('/orders', orderData);
        return response.data;
    },

    getMyOrders: async () => {
        const response = await api.get('/orders/me');
        return response.data;
    },

    getAllAdmin: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/orders/all', { params });
        return response.data;
    },
    
    updateStatus: async (id: string, status: string, trackingInfo?: { courierName?: string; trackingNumber?: string; trackingUrl?: string }) => {
        const response = await api.patch(`/orders/${id}/status`, { status, ...trackingInfo });
        return response.data;
    },
    sync: async (force = false) => {
        const response = await api.post(`/sync/orders${force ? '?force=true' : ''}`);
        return response.data;
    }
};

// Users API - uses longer timeout for Firebase Auth which can be slow
export const usersAPI = {
    getAll: async (params?: { limit?: number; pageToken?: string; search?: string }) => {
        const response = await api.get('/users/all', { 
            params,
            timeout: 60000 // 60 second timeout for users endpoint
        });
        return response.data;
    },
    update: async (id: number | string, data: any) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    updateByEmail: async (email: string, data: any) => {
        const response = await api.put('/users/by-email', { email, ...data });
        return response.data;
    },
    getByEmail: async (email: string) => {
        const response = await api.get('/users/all', { 
            params: { email, limit: 1 },
            timeout: 30000
        });
        return response.data;
    },
    delete: async (id: number | string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    sync: async (force = false) => {
        const response = await api.post(`/sync/users${force ? '?force=true' : ''}`);
        return response.data;
    }
};

// WordPress Sync API
export const wordpressSyncAPI = {
    testConnection: async (credentials: any) => {
        const response = await api.post('/sync/test-connection', credentials);
        return response.data;
    },
    saveCredentials: async (credentials: any) => {
        const response = await api.post('/sync/credentials', credentials);
        return response.data;
    },
    getCredentials: async () => {
        const response = await api.get('/sync/credentials');
        return response.data;
    },
    getStatus: async () => {
        const response = await api.get('/sync/status');
        return response.data;
    },
    syncProducts: async (force = false) => {
        const response = await api.post(`/sync/products${force ? '?force=true' : ''}`);
        return response.data;
    },
    syncOrders: async (force = false) => {
        const response = await api.post(`/sync/orders${force ? '?force=true' : ''}`);
        return response.data;
    },
    syncUsers: async (force = false) => {
        const response = await api.post(`/sync/users${force ? '?force=true' : ''}`);
        return response.data;
    },
    syncCategories: async () => {
        const response = await api.post('/sync/categories');
        return response.data;
    },
    syncBrands: async () => {
        const response = await api.post('/sync/brands');
        return response.data;
    },
    syncAll: async (force = false) => {
        const response = await api.post(`/sync/full${force ? '?force=true' : ''}`);
        return response.data;
    }
};

// Reviews API
export const reviewsAPI = {
    getAllAdmin: async () => {
        const response = await api.get('/reviews/all');
        return response.data;
    },
    getProductReviews: async (productId: number | string) => {
        const response = await api.get(`/reviews/products/${productId}`);
        return response.data;
    },
    create: async (data: { productId: number | string; rating: number; title: string; content: string }) => {
        const response = await api.post('/reviews', data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/reviews/${id}`);
        return response.data;
    },
    moderate: async (id: string, isApproved: boolean) => {
        const response = await api.put(`/reviews/${id}/moderate`, { isApproved });
        return response.data;
    }
};

// Order Cancellation API
export const orderCancellationAPI = {
    checkEligibility: async (orderId: string) => {
        const response = await api.get(`/order-cancellation/check/${orderId}`);
        return response.data;
    },
    cancel: async (orderId: string, reason: string) => {
        const response = await api.post(`/order-cancellation/cancel/${orderId}`, { reason });
        return response.data;
    },
    getReasons: async () => {
        const response = await api.get('/order-cancellation/reasons');
        return response.data;
    }
};

// Returns API
export const returnsAPI = {
    create: async (data: { 
        orderId: string; 
        orderItemId: string; 
        reason: string; 
        description: string;
        condition: string;
        refundType: string;
    }) => {
        const response = await api.post('/returns', data);
        return response.data;
    },
    getMyReturns: async () => {
        const response = await api.get('/returns/me');
        return response.data;
    },
    getPolicy: async () => {
        const response = await api.get('/returns/policy');
        return response.data;
    }
};

// Notifications API
export const notificationsAPI = {
    send: async (data: { to: string; subject: string; message: string; isHtml?: boolean }) => {
        const response = await api.post('/notifications/send', data);
        return response.data;
    },

    sendTracking: async (data: { 
        to: string; 
        orderId: string; 
        customerName: string; 
        trackingProvider: string; 
        trackingNumber: string; 
        trackingUrl?: string; 
        orderTotal?: number 
    }) => {
        const response = await api.post('/notifications/tracking', data);
        return response.data;
    },

    sendOrderStatus: async (data: { 
        to: string; 
        orderId: string; 
        customerName: string; 
        orderStatus: string; 
        orderTotal: number; 
        orderDate: string;
        trackingNumber?: string;
        courierName?: string;
    }) => {
        const response = await api.post('/notifications/order-status', data);
        return response.data;
    }
};

// Settings API
export const settingsAPI = {
    get: async () => {
        const response = await api.get('/settings');
        return response.data;
    },
    update: async (data: any) => {
        const response = await api.put('/settings', data);
        return response.data;
    }
};

// AI API
export const aiAPI = {
    chat: async (message: string, context: string) => {
        const response = await api.post('/ai/chat', { message, context });
        return response.data;
    },
};

// Coupons API
export const couponsAPI = {
    getAll: async () => {
        const response = await api.get('/coupons');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/coupons', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/coupons/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/coupons/${id}`);
        return response.data;
    },
    validate: async (code: string, orderAmount: number) => {
        const response = await api.post('/coupons/validate', { code, orderAmount });
        return response.data;
    },
};

// Verification API
export const verificationAPI = {
    submit: async (data: any) => {
        const response = await api.post('/verification/submit', data);
        return response.data;
    },
    getUserDocuments: async (userId: string) => {
        const response = await api.get(`/verification/user/${userId}`);
        return response.data;
    },
    getAll: async (params?: { status?: string; documentType?: string; limit?: number; offset?: number }) => {
        const response = await api.get('/verification/all', { params });
        return response.data;
    },
    updateStatus: async (id: string, data: { status: 'approved' | 'rejected'; notes?: string; rejectionReason?: string }) => {
        const response = await api.put(`/verification/${id}/status`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/verification/${id}`);
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/verification/stats');
        return response.data;
    },
    getAuditLogs: async (userId: string) => {
        const response = await api.get(`/verification/audit-logs/${userId}`);
        return response.data;
    }
};

// Wishlist API
export const wishlistAPI = {
    get: async () => {
        const response = await api.get('/wishlist');
        return response.data;
    },
    add: async (productId: string | number) => {
        const response = await api.post('/wishlist', { productId });
        return response.data;
    },
    remove: async (productId: string | number) => {
        const response = await api.delete(`/wishlist/${productId}`);
        return response.data;
    },
    sync: async (items: (string | number)[]) => {
        const response = await api.post('/wishlist/sync', { items });
        return response.data;
    }
};

// Cart API
export const cartAPI = {
    get: async () => {
        const response = await api.get('/cart');
        return response.data;
    },
    sync: async (items: any[]) => {
        const response = await api.post('/cart/sync', { items });
        return response.data;
    },
    clear: async () => {
        const response = await api.delete('/cart');
        return response.data;
    }
};

// Chat Sessions API (Admin)
export const chatSessionsAPI = {
    getAll: async () => {
        const response = await api.get('/chat-sessions');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/chat-sessions/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/chat-sessions', data);
        return response.data;
    },
    addMessage: async (sessionId: string, text: string, sender: 'user' | 'bot' | 'agent', senderName?: string) => {
        const response = await api.post(`/chat-sessions/${sessionId}/messages`, {
            text,
            sender,
            senderName
        });
        return response.data;
    },
    updateStatus: async (sessionId: string, status: 'ai' | 'admin' | 'closed', adminName?: string, unreadCount?: number) => {
        const response = await api.patch(`/chat-sessions/${sessionId}/status`, {
            status,
            adminName,
            unreadCount
        });
        return response.data;
    }
};

export default api;
