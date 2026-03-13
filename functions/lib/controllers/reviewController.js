"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviews = getProductReviews;
exports.getUserReviews = getUserReviews;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
exports.markReviewHelpful = markReviewHelpful;
exports.getAllReviews = getAllReviews;
exports.moderateReview = moderateReview;
const firebase_1 = require("../config/firebase"); // Firestore
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
// Validation schemas (Updated for Firestore String IDs)
const createReviewSchema = zod_1.z.object({
    productId: zod_1.z.string().or(zod_1.z.number().transform(String)), // Accept ID as string or number
    rating: zod_1.z.number().min(1).max(5),
    title: zod_1.z.string().min(1).max(100),
    content: zod_1.z.string().min(10).max(1000),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    clinicalUse: zod_1.z.string().optional(),
    efficacy: zod_1.z.number().min(1).max(5).optional(),
    safety: zod_1.z.number().min(1).max(5).optional(),
});
const updateReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5).optional(),
    title: zod_1.z.string().min(1).max(100).optional(),
    content: zod_1.z.string().min(10).max(1000).optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    clinicalUse: zod_1.z.string().optional(),
    efficacy: zod_1.z.number().min(1).max(5).optional(),
    safety: zod_1.z.number().min(1).max(5).optional(),
});
// Helper function to update product ratings
async function updateProductRatings(productId) {
    try {
        const reviewsSnapshot = await firebase_1.db.collection('reviews')
            .where('productId', '==', productId)
            .where('isApproved', '==', true) // Only approved reviews count? Or all? Usually verified/approved.
            .get();
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
            : 0;
        // Calculate separate ratings
        const professionalReviews = reviews.filter((r) => r.userType === 'dental-doctor');
        const customerReviews = reviews.filter((r) => r.userType !== 'dental-doctor'); // Assume others are regular
        const clinicalRating = professionalReviews.length > 0
            ? professionalReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / professionalReviews.length
            : 0;
        const customerRating = customerReviews.length > 0
            ? customerReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / customerReviews.length
            : 0;
        // Update Product Document
        await firebase_1.db.collection('products').doc(productId).update({
            rating: avgRating,
            reviewCount: totalReviews,
            reviewsCount: totalReviews, // Duplicate field if schema calls for it
            avgRating,
            clinicalRating,
            customerRating
        });
    }
    catch (err) {
        logger_1.default.error(`Failed to update ratings for product ${productId}:`, err);
    }
}
// Get all reviews for a product
async function getProductReviews(req, res) {
    try {
        const productId = req.params.productId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // Firestore offset is hard without cursors. 
        // We will fetch limited, but for meaningful migration we might need a workaround or accept simple list.
        let query = firebase_1.db.collection('reviews').where('productId', '==', productId);
        if (req.query.rating) {
            query = query.where('rating', '==', parseInt(req.query.rating));
        }
        if (req.query.verified === 'true') {
            query = query.where('isVerified', '==', true);
        }
        // Ordering requires index. Let's try basic query first.
        // query = query.orderBy('createdAt', 'desc'); 
        const snapshot = await query.get();
        // Manual pagination for now (not efficient for huge data, but works for typical review counts < 1000)
        const total = snapshot.size;
        const startIndex = (page - 1) * limit;
        const docs = snapshot.docs.slice(startIndex, startIndex + limit);
        const reviews = docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({
            reviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting product reviews:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
}
// Get user's reviews
async function getUserReviews(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const snapshot = await firebase_1.db.collection('reviews')
            .where('userId', '==', userId)
            .get(); // Should be small list per user
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({
            reviews,
            pagination: {
                total: reviews.length,
                page: 1,
                limit: reviews.length,
                totalPages: 1
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting user reviews:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
}
// Create a new review
async function createReview(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const validatedData = createReviewSchema.parse(req.body);
        const productId = validatedData.productId;
        // Check if user has purchased product
        // Query orders collection
        const ordersSnapshot = await firebase_1.db.collection('orders')
            .where('userId', '==', userId)
            // .where('status', '==', 'Delivered') // Optional: only delivered?
            .get();
        let hasPurchased = false;
        let orderId = null;
        for (const doc of ordersSnapshot.docs) {
            const orderData = doc.data();
            const items = orderData.items || [];
            if (items.some((item) => item.productId === productId)) {
                hasPurchased = true;
                orderId = doc.id;
                break;
            }
        }
        const isVerified = hasPurchased;
        // Check if already reviewed
        const existingSnapshot = await firebase_1.db.collection('reviews')
            .where('userId', '==', userId)
            .where('productId', '==', productId)
            .limit(1)
            .get();
        if (!existingSnapshot.empty) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }
        // Get User/Product details for denormalization
        const userDoc = await firebase_1.db.collection('users').doc(userId).get();
        const productDoc = await firebase_1.db.collection('products').doc(String(productId)).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const productData = productDoc.exists ? productDoc.data() : {};
        const reviewData = {
            ...validatedData,
            userId,
            userName: userData?.name || 'Anonymous',
            userAvatar: userData?.avatar || null,
            userType: userData?.userType || 'regular', // dental-doctor check
            productName: productData?.name || 'Unknown Product',
            productImage: productData?.images?.[0] || null,
            orderId,
            isVerified,
            isApproved: true, // Auto-approve? Or false? defaulted to true in previous controller implied? No, schema didn't specify.
            helpful: 0,
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await firebase_1.db.collection('reviews').add(reviewData);
        // Update Aggregates
        await updateProductRatings(productId);
        res.status(201).json({ review: { id: docRef.id, ...reviewData } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger_1.default.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
}
// Update a review
async function updateReview(req, res) {
    try {
        const userId = req.user?.id;
        const reviewId = req.params.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const validatedData = updateReviewSchema.parse(req.body);
        const reviewDoc = await firebase_1.db.collection('reviews').doc(String(reviewId)).get();
        if (!reviewDoc.exists) {
            return res.status(404).json({ error: 'Review not found' });
        }
        const reviewData = reviewDoc.data();
        if (reviewData.userId !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await firebase_1.db.collection('reviews').doc(String(reviewId)).update({
            ...validatedData,
            updatedAt: new Date().toISOString()
        });
        // Update aggregates
        await updateProductRatings(reviewData.productId);
        const updatedDoc = await firebase_1.db.collection('reviews').doc(String(reviewId)).get();
        res.json({ review: { id: updatedDoc.id, ...updatedDoc.data() } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update review' });
    }
}
// Delete a review
async function deleteReview(req, res) {
    try {
        const userId = req.user?.id;
        const reviewId = req.params.id;
        const reviewDoc = await firebase_1.db.collection('reviews').doc(String(reviewId)).get();
        if (!reviewDoc.exists) {
            return res.status(404).json({ error: 'Review not found' });
        }
        const reviewData = reviewDoc.data();
        if (reviewData.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await firebase_1.db.collection('reviews').doc(String(reviewId)).delete();
        await updateProductRatings(reviewData.productId);
        res.json({ message: 'Review deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete review' });
    }
}
// Mark review as helpful
async function markReviewHelpful(req, res) {
    try {
        const reviewId = req.params.id;
        await firebase_1.db.collection('reviews').doc(String(reviewId)).update({
            helpful: firebase_1.admin.firestore.FieldValue.increment(1)
        });
        const doc = await firebase_1.db.collection('reviews').doc(String(reviewId)).get();
        res.json({ helpful: doc.data().helpful });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update review' });
    }
}
// Get all reviews for admin
async function getAllReviews(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const snapshot = await firebase_1.db.collection('reviews').orderBy('createdAt', 'desc').limit(50).get();
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({
            reviews,
            pagination: { total: reviews.length, page: 1, limit: 50, totalPages: 1 }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get reviews' });
    }
}
// Admin: Approve/Reject review
async function moderateReview(req, res) {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const reviewId = req.params.id;
        const { isApproved } = req.body;
        await firebase_1.db.collection('reviews').doc(String(reviewId)).update({ isApproved });
        const doc = await firebase_1.db.collection('reviews').doc(String(reviewId)).get();
        if (doc.exists) {
            const data = doc.data();
            await updateProductRatings(data.productId);
        }
        res.json({ review: { id: doc.id, ...doc.data() } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to moderate review' });
    }
}
//# sourceMappingURL=reviewController.js.map