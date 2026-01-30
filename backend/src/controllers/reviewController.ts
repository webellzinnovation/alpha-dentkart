import { Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { z } from 'zod';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        userType: string;
    };
}

// Validation schemas
const createReviewSchema = z.object({
    productId: z.number(),
    rating: z.number().min(1).max(5),
    title: z.string().min(1).max(100),
    content: z.string().min(10).max(1000),
    images: z.array(z.string()).optional(),
    clinicalUse: z.string().optional(),
    efficacy: z.number().min(1).max(5).optional(),
    safety: z.number().min(1).max(5).optional(),
});

const updateReviewSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    title: z.string().min(1).max(100).optional(),
    content: z.string().min(10).max(1000).optional(),
    images: z.array(z.string()).optional(),
    clinicalUse: z.string().optional(),
    efficacy: z.number().min(1).max(5).optional(),
    safety: z.number().min(1).max(5).optional(),
});

// Get all reviews for a product
export async function getProductReviews(req: Request, res: Response) {
    try {
        const productId = parseInt(req.params.productId);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
        const isVerified = req.query.verified === 'true';

        const where: any = { productId };
        if (rating) where.rating = rating;
        if (isVerified) where.isVerified = true;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            userType: true,
                            verificationStatus: true,
                            avatar: true,
                        }
                    },
                    order: {
                        select: {
                            id: true,
                            createdAt: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.review.count({ where })
        ]);

        // Parse JSON fields
        const parsedReviews = reviews.map(review => ({
            ...review,
            images: review.images ? JSON.parse(review.images as string) : [],
        }));

        res.json({
            reviews: parsedReviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting product reviews:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
}

// Get user's reviews
export async function getUserReviews(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { userId },
                skip,
                take: limit,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        }
                    },
                    order: {
                        select: {
                            id: true,
                            createdAt: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.review.count({ where: { userId } })
        ]);

        const parsedReviews = reviews.map(review => ({
            ...review,
            images: review.images ? JSON.parse(review.images as string) : [],
        }));

        res.json({
            reviews: parsedReviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting user reviews:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
}

// Create a new review
export async function createReview(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const validatedData = createReviewSchema.parse(req.body);
        
        // Check if user has purchased product
        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId,
                items: {
                    contains: `"productId":${validatedData.productId}`
                }
            }
        });

        const isVerified = !!hasPurchased;

        // Check if user already reviewed this product
        const existingReview = await prisma.review.findUnique({
            where: {
                productId_userId: {
                    productId: validatedData.productId,
                    userId
                }
            }
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                ...validatedData,
                userId,
                images: validatedData.images ? JSON.stringify(validatedData.images) : null,
                isVerified,
                orderId: hasPurchased?.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        userType: true,
                        verificationStatus: true,
                        avatar: true,
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                }
            }
        });

        // Update product rating calculations
        await updateProductRatings(validatedData.productId);

        // Parse JSON fields for response
        const parsedReview = {
            ...review,
            images: review.images ? JSON.parse(review.images as string) : [],
        };

        res.status(201).json({ review: parsedReview });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
}

// Update a review
export async function updateReview(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const reviewId = req.params.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const validatedData = updateReviewSchema.parse(req.body);

        // Check if review belongs to user
        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!existingReview) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (existingReview.userId !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const review = await prisma.review.update({
            where: { id: reviewId },
            data: {
                ...validatedData,
                images: validatedData.images ? JSON.stringify(validatedData.images) : existingReview.images,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        userType: true,
                        verificationStatus: true,
                        avatar: true,
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                }
            }
        });

        // Update product rating calculations
        await updateProductRatings(existingReview.productId);

        const parsedReview = {
            ...review,
            images: review.images ? JSON.parse(review.images as string) : [],
        };

        res.json({ review: parsedReview });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
}

// Delete a review
export async function deleteReview(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const reviewId = req.params.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!existingReview) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (existingReview.userId !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.review.delete({
            where: { id: reviewId }
        });

        // Update product rating calculations
        await updateProductRatings(existingReview.productId);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
}

// Mark review as helpful
export async function markReviewHelpful(req: Request, res: Response) {
    try {
        const reviewId = req.params.id;
        
        const review = await prisma.review.update({
            where: { id: reviewId },
            data: {
                helpful: {
                    increment: 1
                }
            }
        });

        res.json({ helpful: review.helpful });
    } catch (error) {
        console.error('Error marking review helpful:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
}

// Get all reviews for admin
export async function getAllReviews(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId || req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status as string;
        const isApproved = req.query.approved === 'true' ? true : req.query.approved === 'false' ? false : undefined;

        const where: any = {};
        if (status) where.status = status;
        if (isApproved !== undefined) where.isApproved = isApproved;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            userType: true,
                            verificationStatus: true,
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        }
                    },
                    order: {
                        select: {
                            id: true,
                            createdAt: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.review.count({ where })
        ]);

        const parsedReviews = reviews.map(review => ({
            ...review,
            images: review.images ? JSON.parse(review.images as string) : [],
        }));

        res.json({
            reviews: parsedReviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting all reviews:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
}

// Admin: Approve/Reject review
export async function moderateReview(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId || req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const reviewId = req.params.id;
        const { isApproved, rejectionReason } = req.body;

        const review = await prisma.review.update({
            where: { id: reviewId },
            data: {
                isApproved,
            }
        });

        // Update product rating calculations
        await updateProductRatings(review.productId);

        res.json({ review });
    } catch (error) {
        console.error('Error moderating review:', error);
        res.status(500).json({ error: 'Failed to moderate review' });
    }
}

// Helper function to update product ratings
async function updateProductRatings(productId: number) {
    const reviews = await prisma.review.findMany({
        where: { productId, isApproved: true },
        select: { 
            rating: true, 
            userId: true, 
            user: { select: { userType: true } } 
        }
    });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

    // Calculate separate ratings for professionals and regular users
    const professionalReviews = reviews.filter(r => r.user?.userType === 'dental-doctor');
    const customerReviews = reviews.filter(r => r.user?.userType === 'regular');

    const clinicalRating = professionalReviews.length > 0
        ? professionalReviews.reduce((sum, r) => sum + r.rating, 0) / professionalReviews.length
        : null;

    const customerRating = customerReviews.length > 0
        ? customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length
        : null;

    await prisma.product.update({
        where: { id: productId },
        data: {
            rating: avgRating,
            reviewCount: totalReviews,
            avgRating,
            clinicalRating,
            customerRating
        }
    });
}