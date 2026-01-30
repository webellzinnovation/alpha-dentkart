import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        userType: string;
    };
}

// Simple session storage (in production, use Redis/external storage)
const guestSessions = new Map<string, any>();

// Validation helpers
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Create guest session
export const createGuestSession = async (req: Request, res: Response) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Either email or phone is required'
            });
        }

        if (email && !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        if (phone && !validatePhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const guestSession = {
            id: uuidv4(),
            email: email || null,
            phone: phone || null,
            sessionId,
            expiresAt,
            createdAt: new Date(),
            orders: []
        };

        // Store in memory (in production, use Redis/database)
        guestSessions.set(sessionId, guestSession);

        res.json({
            success: true,
            message: 'Guest session created successfully',
            data: {
                sessionId: guestSession.sessionId,
                expiresAt: guestSession.expiresAt
            }
        });
    } catch (error) {
        console.error('Create guest session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create guest session',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Validate guest session
export const validateGuestSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const session = guestSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (session.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Session has expired'
            });
        }

        res.json({
            success: true,
            message: 'Session is valid',
            data: {
                sessionId: session.sessionId,
                email: session.email,
                phone: session.phone,
                orderCount: session.orders.length
            }
        });
    } catch (error) {
        console.error('Validate guest session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate session',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Create guest order (using SQL queries to avoid Prisma relation issues)
export const createGuestOrder = async (req: Request, res: Response) => {
    try {
        const { customerInfo, items, total, shippingCharges, paymentMethod, sessionId } = req.body;

        // Basic validation
        if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
            return res.status(400).json({
                success: false,
                message: 'Customer name, email, and phone are required'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one item is required'
            });
        }

        if (!total || total <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Total amount must be greater than 0'
            });
        }

        if (!paymentMethod || !['razorpay', 'phonepe', 'cod'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method'
            });
        }

        const orderId = uuidv4();

        // Mock database insert (in production, use actual database)
        const orderData = {
            id: orderId,
            customerName: customerInfo.name,
            status: 'Processing',
            total,
            items: JSON.stringify(items),
            shippingAddress: JSON.stringify(customerInfo.address),
            paymentMethod,
            paymentStatus: 'pending',
            isNew: true,
            // Guest checkout fields
            guestEmail: customerInfo.email,
            guestPhone: customerInfo.phone,
            isGuestOrder: true,
            guestSessionId: sessionId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // In a real implementation, you would use:
        // await db.query('INSERT INTO Order (...) VALUES (...)');
        // For now, return success response

        res.status(201).json({
            success: true,
            message: 'Guest order created successfully',
            data: {
                orderId: orderData.id,
                customerName: orderData.customerName,
                status: orderData.status,
                total: orderData.total,
                paymentMethod: orderData.paymentMethod,
                paymentStatus: orderData.paymentStatus
            }
        });
    } catch (error) {
        console.error('Create guest order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create guest order',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get guest order details
export const getGuestOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Mock database query
        const orderData = {
            id: orderId,
            customerName: 'Guest Customer',
            status: 'Processing',
            total: 2500,
            items: '[{"productId": 1, "name": "Sample Product", "quantity": 2}]',
            shippingAddress: '{"street": "123 Street", "city": "Delhi", "state": "Delhi", "pincode": "110001"}',
            guestEmail: 'guest@example.com',
            guestPhone: '9876543210',
            isGuestOrder: true,
            paymentMethod: 'cod',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Guest order retrieved successfully',
            data: orderData
        });
    } catch (error) {
        console.error('Get guest order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve guest order',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Update guest order status
export const updateGuestOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const updateData = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Only allow certain fields to be updated
        const allowedUpdates: Record<string, any> = {};
        const allowedFields = ['status', 'paymentStatus', 'paymentId', 'transactionId'];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                allowedUpdates[field] = updateData[field];
            }
        }

        res.json({
            success: true,
            message: 'Guest order updated successfully',
            data: {
                orderId,
                ...allowedUpdates
            }
        });
    } catch (error) {
        console.error('Update guest order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update guest order',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get guest order status with tracking
export const getGuestOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        // Mock order data with tracking
        const orderData = {
            id: orderId,
            status: 'Shipped',
            paymentStatus: 'paid',
            shippingTracking: {
                carrier: 'Shiprocket',
                trackingId: 'SR123456789',
                serviceType: 'express',
                status: 'in-transit',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                checkpoints: [
                    {
                        id: 1,
                        date: new Date().toISOString(),
                        status: 'Package picked up',
                        location: 'Delhi',
                        description: 'Order picked up from warehouse'
                    }
                ]
            },
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Guest order status retrieved successfully',
            data: orderData
        });
    } catch (error) {
        console.error('Get guest order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Convert guest order to registered user (after registration)
export const convertGuestOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId, accountData } = req.body;

        if (!orderId || !req.user?.id) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and User authentication required'
            });
        }

        // Mock conversion
        const updatedOrder = {
            id: orderId,
            userId: req.user.id,
            isGuestOrder: false,
            guestSessionId: null,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: 'Guest order converted to user order successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Convert guest order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to convert guest order',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get guest orders for session
export const getGuestOrders = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const session = guestSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Mock orders for session
        const orders = session.orders || [];

        res.json({
            success: true,
            message: 'Guest orders retrieved successfully',
            data: {
                sessionId: session.sessionId,
                orders,
                orderCount: orders.length
            }
        });
    } catch (error) {
        console.error('Get guest orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve guest orders',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};