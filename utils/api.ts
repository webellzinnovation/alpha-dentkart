import axios from 'axios';

const API_BASE_URL = '/api/v1';

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
};

// Products API
export const productsAPI = {
    getAll: async (params?: { page?: number; limit?: number; categoryId?: number; brandId?: number; search?: string }) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },
};

// Categories API
export const categoriesAPI = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data;
    },
};

// Brands API
export const brandsAPI = {
    getAll: async () => {
        const response = await api.get('/brands');
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.patch(`/brands/${id}/featured`, data);
        return response.data;
    },
    reorder: async (brands: any[]) => {
        const response = await api.patch('/brands/featured/reorder', { brands });
        return response.data;
    }
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
    
    updateStatus: async (id: string, status: string) => {
        const response = await api.put(`/orders/${id}/status`, { status });
        return response.data;
    }
};

// Users API - uses longer timeout for Firebase Auth which can be slow
export const usersAPI = {
    getAll: async (params?: { limit?: number }) => {
        const response = await api.get('/users/all', { 
            params,
            timeout: 60000 // 60 second timeout for users endpoint
        });
        return response.data;
    }
};

// Reviews API
export const reviewsAPI = {
    getAllAdmin: async () => {
        const response = await api.get('/reviews/all');
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

export default api;
