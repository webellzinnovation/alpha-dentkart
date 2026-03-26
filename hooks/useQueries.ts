import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    categoriesAPI,
    brandsAPI,
    heroSlidesAPI,
    promotionalTilesAPI,
    productsAPI,
    settingsAPI,
    ordersAPI,
    usersAPI,
    reviewsAPI
} from '../utils/api';

// --- Public Data Queries ---

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await categoriesAPI.getAll();
            return (res.categories || []).map((cat: any) => ({
                ...cat,
                slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
                iconClass: cat.iconClass || 'fas fa-teeth'
            }));
        }
    });
};

export const useBrands = () => {
    return useQuery({
        queryKey: ['brands'],
        queryFn: async () => {
            const res = await brandsAPI.getAll();
            return (res.brands || []).map((brand: any) => ({
                ...brand,
                logo: brand.logo || `https://placehold.co/200x200?text=${brand.name}`,
                productCount: brand.productCount || 0
            }));
        }
    });
};

export const useHeroSlides = () => {
    return useQuery({
        queryKey: ['heroSlides'],
        queryFn: async () => {
            const res = await heroSlidesAPI.getAll();
            return res.slides || [];
        }
    });
};

export const usePromotionalTiles = () => {
    return useQuery({
        queryKey: ['promotionalTiles'],
        queryFn: async () => {
            const res = await promotionalTilesAPI.getAll();
            return res.tiles || [];
        }
    });
};

export const useSettings = () => {
    return useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await settingsAPI.get();
            return res.settings || null;
        }
    });
};

export const useProductReviews = (productId: number | string) => {
    return useQuery({
        queryKey: ['productReviews', productId],
        queryFn: async () => {
            const res = await reviewsAPI.getProductReviews(productId);
            // The backed returns: { reviews: [...], pagination: {...} }
            return res.reviews || [];
        },
        enabled: !!productId
    });
};

// --- Admin Queries ---

export const useAdminOrders = (params: any) => {
    return useQuery({
        queryKey: ['adminOrders', params],
        queryFn: async () => {
            try {
                const res = await ordersAPI.getAllAdmin(params);
                return {
                    orders: res.orders || [],
                    total: res.pagination?.total || (res.orders || []).length
                };
            } catch (error: any) {
                console.error('Error fetching admin orders:', error);
                return { orders: [], total: 0 };
            }
        },
        enabled: !!params
    });
};

export const useAdminUsers = (params?: any) => {
    return useQuery({
        queryKey: ['adminUsers', params],
        queryFn: async () => {
            try {
                const res = await usersAPI.getAll(params);
                return {
                    users: res.users || [],
                    total: res.pagination?.total || res.users?.length || 0
                };
            } catch (error: any) {
                console.error('Error fetching admin users:', error);
                // Return empty data on error
                return { users: [], total: 0 };
            }
        }
    });
};
export const useAdminReviews = (params?: any) => {
    return useQuery({
        queryKey: ['adminReviews', params],
        queryFn: async () => {
            const res = await reviewsAPI.getAllAdmin();
            return {
                // Return reviews sorted by newest first
                reviews: (res.reviews || []).sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ),
                total: res.reviews?.length || 0
            };
        }
    });
};
