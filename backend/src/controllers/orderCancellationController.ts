import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

// Validation schemas
const cancelOrderSchema = z.object({
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500, 'Reason must not exceed 500 characters'),
    refundRequested: z.boolean().default(false),
    refundMethod: z.enum(['razorpay', 'phonepe', 'bank_transfer']).default('razorpay')
});

const bulkCancelOrdersSchema = z.object({
    orderIds: z.array(z.string()).min(1, 'At least one order ID is required'),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500, 'Reason must not exceed 500 characters'),
    refundMethod: z.enum(['razorpay', 'phonepe', 'bank_transfer']).default('razorpay')
});

// Cancel a single order
export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const { reason, refundRequested, refundMethod } = req.body;

        const validation = cancelOrderSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: validation.error.errors
            });
        }

        // Check if user can cancel this order
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const cancelData = validation.data;

        // Mock database query - replace with actual database call
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled
        const cancellableStatuses = ['Processing', 'Confirmed'];
        if (!cancellableStatuses.includes(order.status as any)) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled. Current status: ${order.status}`,
                data: {
                    currentStatus: order.status,
                    cancellableStatuses
                }
            });
        }

        // Update order status to cancelled
        const cancelledOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'Cancelled',
                updatedAt: new Date()
            }
        });

        // If refund requested, create refund record
        let refundRecord = null;
        if (refundRequested) {
            refundRecord = await prisma.refundTransaction.create({
                data: {
                    id: uuidv4(),
                    returnId: order.id,
                    paymentId: order.paymentId,
                    amount: order.total || 0,
                    status: 'pending',
                    gateway: refundMethod,
                    createdAt: new Date()
                }
            });
        }

        // Create cancellation audit trail
        await prisma.returnRequest.create({
            data: {
                id: uuidv4(),
                orderId,
                userId,
                orderItemId: 'all', // For order-level cancellation
                reason: cancelData.reason,
                condition: 'new', // Assuming items are new
                refundType: refundRequested ? 'refund' : 'none',
                refundAmount: refundRequested ? (order.total || 0) : 0,
                status: 'approved',
                approvedBy: 'system', // Auto-approved for order cancellation
                approvedAt: new Date(),
                completedAt: null,
                trackingId: null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Link refund transaction to return request
        if (refundRecord) {
            await prisma.returnRequest.update({
                where: { id: refundRecord.id },
                data: {
                    refundTransactionId: refundRecord.id
                }
            });
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: {
                orderId,
                cancelledAt: new Date().toISOString(),
                reason: cancelData.reason,
                refundRequested,
                refundMethod: refundRequested ? refundMethod : null,
                refundId: refundRecord?.id,
                refundStatus: refundRecord?.status || null
            }
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Bulk cancel multiple orders
export const bulkCancelOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const validation = bulkCancelOrdersSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: validation.error.errors
            });
        }

        // Check admin access
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { orderIds, reason, refundMethod } = validation.data;
        const userId = req.user.id;
        const cancelData = { reason, refundMethod };

        // Find and cancel orders
        const orders = await prisma.order.findMany({
            where: {
                id: { in: orderIds },
                userId,
                status: { in: ['Processing', 'Confirmed'] }
            }
        });

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No eligible orders found to cancel'
            });
        }

        const cancellableOrders = orders.filter(order => 
            !['Shipped', 'Delivered', 'Cancelled'].includes(order.status as any)
        );

        if (cancellableOrders.length !== orders.length) {
            return res.status(400).json({
                success: false,
                message: 'Some orders cannot be cancelled',
                data: {
                    nonCancellableOrders: orders.filter(order => 
                        ['Shipped', 'Delivered', 'Cancelled'].includes(order.status as any)
                    ).map(order => ({
                        orderId: order.id,
                        status: order.status
                    }))
                }
            });
        }

        // Cancel eligible orders and create cancellation records
        const cancellationPromises = cancellableOrders.map(async (order) => {
            const cancelledOrder = await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'Cancelled',
                    updatedAt: new Date()
                }
            });

            let refundRecord = null;
            if (cancelData.refundRequested) {
                refundRecord = await prisma.refundTransaction.create({
                    data: {
                        id: uuidv4(),
                        returnId: order.id,
                        paymentId: order.paymentId,
                        amount: order.total || 0,
                        status: 'pending',
                        gateway: cancelData.refundMethod,
                        createdAt: new Date()
                    }
                });
            }

            const returnRequestId = await prisma.returnRequest.create({
                data: {
                    id: uuidv4(),
                    orderId,
                    userId,
                    orderItemId: 'all', // Order-level cancellation
                    reason: cancelData.reason,
                    condition: 'new',
                    refundType: cancelData.refundRequested ? 'refund' : 'none',
                    refundAmount: cancelData.refundRequested ? (order.total || 0) : 0,
                    status: 'approved',
                    approvedBy: 'system',
                    approvedAt: new Date(),
                    completedAt: null,
                    trackingId: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            if (refundRecord) {
                await prisma.returnRequest.update({
                    where: { id: returnRequestId },
                    data: {
                        refundTransactionId: refundRecord.id
                    }
                });
            }

            return {
                orderId: order.id,
                cancelledAt: new Date(),
                refundRecord: refundRecord?.id
            };
        });

        const results = await Promise.all(cancellationPromises);

        // Send WhatsApp notification for cancellations
        const cancellationDetails = {
            orderIds: results.map(r => r.orderId),
            cancelledCount: results.length,
            reason: cancelData.reason,
            refundMethod: cancelData.refundRequested ? cancelData.refundMethod : null,
            cancelledAt: new Date().toISOString()
        };

        // WhatsApp notification logic (mock for now)
        console.log('WhatsApp cancellation notification:', cancellationDetails);

        res.json({
            success: true,
            message: `${results.length} order(s) cancelled successfully`,
            data: {
                cancelledOrders: results.map((result, index) => ({
                    orderId: result.orderId,
                    cancelledAt: result.cancelledAt,
                    refundId: result.refundRecord
                })),
                summary: {
                    totalRequested: orderIds.length,
                    successfulCancellations: results.length,
                    failedCancellations: 0
                },
                cancellationDetails
            }
        });
    } catch (error) {
        console.error('Bulk cancel orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel orders',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get cancellation reasons for dropdown
export const getCancellationReasons = async (req: Request, res: Response) => {
    try {
        const reasons = [
            { value: 'duplicate_order', label: 'Duplicate Order' },
            { value: 'wrong_item', label: 'Wrong Item Delivered' },
            { value: 'damaged_item', label: 'Item Damaged During Delivery' },
            { value: 'delivery_delay', label: 'Delivery Delay' },
            { value: 'found_cheaper_alternative', label: 'Found Cheaper Alternative' },
            { value: 'no_longer_needed', label: 'No Longer Needed' },
            { value: 'quality_issue', label: 'Quality Issue' },
            { value: 'shipping_damage', label: 'Shipping Damage' },
            { value: 'customer_request', label: 'Customer Request' },
            { value: 'payment_issue', label: 'Payment Issue' },
            { value: 'refund_policy', label: 'Refund Policy' },
            { value: 'other', label: 'Other' }
        ];

        res.json({
            success: true,
            data: reasons
        });
    } catch (error) {
        console.error('Get cancellation reasons error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cancellation reasons',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get order cancellation history
export const getOrderCancellationHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.id;
        const { page = 1, limit = 20, startDate, endDate, status = '' } = req.query;

        const whereClause: any = {
            userId,
            include: {
                ReturnRequest: {
                    select: {
                        orderId: true,
                        reason: true,
                        status: true,
                        createdAt: true,
                        approvedBy: true
                    }
                }
            }
        };

        if (startDate) {
            whereClause.createdAt = { gte: new Date(startDate as string) };
        }

        if (endDate) {
            whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate as string) };
        }

        if (status) {
            whereClause.ReturnRequest = { 
                ...whereClause.ReturnRequest,
                status
            };
        }

        const [cancellations, totalCount] = await prisma.$transaction([
            prisma.returnRequest.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            }),
            prisma.returnRequest.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            data: {
                cancellations: cancellations,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNext: Number(page) * Number(limit) < totalCount
                }
            }
        });
    } catch (error) {
        console.error('Get cancellation history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cancellation history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get order details for cancellation eligibility check
export const getOrderForCancellation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.id;
        
        // Mock order data
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId
            },
            include: {
                ReturnRequest: true,
                ShippingTracking: true
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled
        const cancellableStatuses = ['Processing', 'Confirmed'];
        const canCancel = cancellableStatuses.includes(order.status as any);
        
        const timeElapsed = Date.now() - new Date(order.createdAt).getTime();
        const hoursElapsed = timeElapsed / (1000 * 60 * 60);

        // Business rules for cancellation
        const cancellationPolicy = {
            canCancel,
            hoursElapsed,
            timeLimit: 24, // Can cancel within 24 hours
            cancellationFee: canCancel && hoursElapsed > 2 ? 0.05 : 0, // 5% fee after 2 hours
            allowedStatuses: cancellableStatuses
        };

        res.json({
            success: true,
            data: {
                orderId,
                status: order.status,
                createdAt: order.createdAt,
                totalAmount: order.total,
                cancellationPolicy,
                hasReturns: order.ReturnRequest?.length > 0 || false,
                shippingStatus: order.ShippingTracking?.status
            }
        });
    } catch (error) {
        console.error('Get order for cancellation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order details',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};