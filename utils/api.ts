import axios from 'axios';

const API_BASE_URL = '/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
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
        const response = await api.put(`/brands/${id}`, data);
        return response.data;
    },
    reorder: async (brands: any[]) => {
        const response = await api.post('/brands/reorder', { brands });
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
        const response = await api.put(`/hero-slides/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/hero-slides/${id}`);
        return response.data;
    },
    reorder: async (slides: any[]) => {
        const response = await api.post('/hero-slides/reorder', { slides });
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
        const response = await api.put(`/promotional-tiles/${id}`, data);
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
};

// AI API
export const aiAPI = {
    chat: async (message: string, context: string) => {
        const response = await api.post('/ai/chat', { message, context });
        return response.data;
    },
};

export default api;
