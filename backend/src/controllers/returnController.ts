import { Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        userType: string;
    };
}

// Validation schemas
const createReturnRequestSchema = z.object({
    orderId: z.string(),
    orderItemId: z.string(),
    reason: z.enum(['damaged', 'wrong-item', 'not-as-described', 'expired', 'size-issue', 'other']),
    condition: z.enum(['new', 'used', 'damaged']),
    description: z.string().min(10).max(500),
    images: z.array(z.string()).optional(),
    refundType: z.enum(['refund', 'replacement', 'exchange']),
    refundAmount: z.number().optional(),
    trackingId: z.string().optional()
});

const updateReturnRequestSchema = z.object({
    reason: z.enum(['damaged', 'wrong-item', 'not-as-described', 'expired', 'size-issue', 'other']).optional(),
    condition: z.enum(['new', 'used', 'damaged']).optional(),
    description: z.string().min(10).max(500).optional(),
    images: z.array(z.string()).optional(),
    refundType: z.enum(['refund', 'replacement', 'exchange']).optional(),
    refundAmount: z.number().optional(),
    trackingId: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'completed']).optional()
});

const createRefundSchema = z.object({
    returnId: z.string(),
    paymentId: z.string(),
    amount: z.number(),
    gateway: z.enum(['razorpay', 'phonepe', 'bank']),
    gatewayId: z.string().optional(),
    failureReason: z.string().optional()
});

// Create return request
export async function createReturnRequest(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const validatedData = createReturnRequestSchema.parse(req.body);

        // Check if order belongs to user and is eligible for return
        const order = await prisma.order.findFirst({
            where: { id: validatedData.orderId, userId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check return window (15 days from delivery for regular users, 30 days for dental professionals)
        const deliveryDate = new Date(order.createdAt);
        const now = new Date();
        const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

        const maxReturnDays = req.user?.userType === 'dental-doctor' ? 30 : 15;

        if (daysSinceDelivery > maxReturnDays) {
            return res.status(400).json({
                error: 'Return window expired',
                message: `Returns must be requested within ${maxReturnDays} days of delivery`
            });
        }

        // Check if item is already returned
        const existingReturn = await prisma.returnRequest.findFirst({
            where: { orderId: validatedData.orderId, orderItemId: validatedData.orderItemId }
        });

        if (existingReturn && existingReturn.status !== 'rejected') {
            return res.status(400).json({ error: 'Return request already exists for this item' });
        }

        // Create return request
        const returnRequest = await prisma.returnRequest.create({
            data: {
                ...validatedData,
                userId,
                status: 'pending'
            }
        });

        res.status(201).json({ returnRequest });
    } catch (error) {
        console.error('Error creating return request:', error);
        res.status(500).json({ error: 'Failed to create return request' });
    }
}

// Get user's return requests
export async function getUserReturnRequests(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status as string;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const where: any = { userId };
        if (status) where.status = status;

        const [returnRequests, total] = await Promise.all([
            prisma.returnRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    order: {
                        select: {
                            id: true,
                            customerName: true,
                            total: true,
                            createdAt: true,
                            items: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.returnRequest.count({ where })
        ]);

        res.json({
            returnRequests,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting return requests:', error);
        res.status(500).json({ error: 'Failed to get return requests' });
    }
}

// Get return request details
export async function getReturnRequest(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { returnId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const returnRequest = await prisma.returnRequest.findFirst({
            where: { id: returnId, userId }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        res.json({ returnRequest });
    } catch (error) {
        console.error('Error getting return request:', error);
        res.status(500).json({ error: 'Failed to get return request' });
    }
}

// Admin: Get all return requests
export async function getAllReturnRequests(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId || req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status as string;

        const where: any = {};
        if (status) where.status = status;

        const [returnRequests, total] = await Promise.all([
            prisma.returnRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            userType: true
                        }
                    },
                    order: {
                        select: {
                            id: true,
                            customerName: true,
                            total: true,
                            createdAt: true,
                            items: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.returnRequest.count({ where })
        ]);

        // Parse images for each request
        const parsedReturnRequests = returnRequests.map(request => ({
            ...request,
            images: request.images ? JSON.parse(request.images as string) : []
        }));

        res.json({
            returnRequests: parsedReturnRequests,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting all return requests:', error);
        res.status(500).json({ error: 'Failed to get return requests' });
    }
}

// Admin: Approve return request
export async function approveReturnRequest(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId || req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { returnId } = req.params;
        const { approved, rejectionReason } = req.body;

        const returnRequest = await prisma.returnRequest.findFirst({
            where: { id: returnId }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        const updatedReturn = await prisma.returnRequest.update({
            where: { id: returnId },
            data: {
                status: approved ? 'approved' : 'rejected',
                approvedBy: userId,
                approvedAt: approved ? new Date() : undefined,
                rejectionReason: approved ? null : rejectionReason
            }
        });

        // If approved, create refund transaction
        if (approved && returnRequest.refundType && returnRequest.refundAmount) {
            const order = await prisma.order.findUnique({
                where: { id: returnRequest.orderId }
            });

            if (order && order.paymentId && order.transactionId) {
                await prisma.refundTransaction.create({
                    data: {
                        returnId,
                        paymentId: order.paymentId,
                        amount: returnRequest.refundAmount,
                        gateway: 'razorpay',
                        status: 'pending'
                    }
                });

                // Update order status
                await prisma.order.update({
                    where: { id: returnRequest.orderId },
                    data: { status: 'return-approved' }
                });
            }
        }

        res.json({ returnRequest: updatedReturn });
    } catch (error) {
        console.error('Error approving return request:', error);
        res.status(500).json({ error: 'Failed to approve return request' });
    }
}

// Process refund
export async function processRefund(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId || req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const validatedData = createRefundSchema.parse(req.body);
        const { returnId } = validatedData;

        // Get return request
        const returnRequest = await prisma.returnRequest.findFirst({
            where: { id: returnId }
        });

        if (!returnRequest) {
            return res.status(404).json({ error: 'Return request not found' });
        }

        // Get order for payment details
        const order = await prisma.order.findUnique({
            where: { id: returnRequest.orderId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Process refund via Razorpay
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const refundData = {
            amount: validatedData.amount * 100, // Convert to paise
            receipt: order.transactionId,
            notes: `Refund for return request ${returnId}`
        };

        // Create refund
        const refund = await razorpay.refund(refundData);

        // Update refund transaction
        const refundTransaction = await prisma.refundTransaction.update({
            where: { returnId },
            data: {
                status: refund?.error ? 'failed' : 'completed',
                gatewayId: refund?.razorpay_refund_id || refund?.id,
                processedAt: refund?.error ? null : new Date(),
                failureReason: refund?.error ? refund.error_description : null
            }
        });

        // Update return request status
        await prisma.returnRequest.update({
            where: { id: returnId },
            data: {
                status: refund?.error ? 'refund-failed' : 'completed',
                completedAt: refund?.error ? null : new Date()
            }
        });

        // Update order status
        await prisma.order.update({
            where: { id: returnRequest.orderId },
            data: { status: 'return-completed' }
        });

        res.json({
            success: refund?.error ? false : true,
            refund: refund?.error ? null : refund,
            message: refund?.error ? 'Refund failed: ' + refund.error_description : 'Refund processed successfully'
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ error: 'Failed to process refund' });
    }
}

// Get return policy information
export async function getReturnPolicy(req: Request, res: Response) {
    try {
        // Return policy based on product type and user type
        const regularUserPolicy = {
            returnWindowDays: 15,
            returnConditions: ['new', 'unused', 'original-packaging'],
            restockingFee: 50, // ₹50 for regular users
            nonReturnableItems: ['personal-care-items', 'custom-products', 'clearance-items'],
            shippingCost: 'customer-pays'
        };

        const dentalProfessionalPolicy = {
            returnWindowDays: 30,
            returnConditions: ['new', 'unused', 'original-packaging', 'damaged-in-transit'],
            restockingFee: 0, // No restocking fee for dental professionals
            nonReturnableItems: ['personal-care-items', 'consumables', 'expired-products'],
            shippingCost: 'seller-pays' // Free return shipping for professionals
        };

        res.json({
            regularUserPolicy,
            dentalProfessionalPolicy,
            generalTerms: 'All returns subject to inspection and approval by Alpha Dentkart team',
            contactSupport: 'For return issues, contact support@alphadentkart.com'
        });
    } catch (error) {
        console.error('Error getting return policy:', error);
        res.status(500).json({ error: 'Failed to get return policy' });
    }
}