
import { Order } from '../types';

// Use local backend URL for development, or relative path for production (if served from same origin)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiService = {
    // Fetch all orders (Admin view)
    getOrders: async (): Promise<Order[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    // Create a new order
    createOrder: async (order: Order): Promise<{ message: string, orderId?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: order.id,
                    user_email: order.userId,
                    total: order.total,
                    items: order.items,
                    customer_name: order.customerName,
                    payment_id: order.paymentId
                }),
            });

            if (!response.ok) throw new Error('Failed to create order');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Placeholder for login (expand later)
    login: async (email: string) => {
        // In real implementation, this would POST to /api/login
        console.log('Login API not yet implemented on backend');
        return { success: true };
    }
};
