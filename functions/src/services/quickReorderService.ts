import { db } from '../config/firebase'; // Firestore
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

export interface QuickReorderData {
  userId: string;
  orderId: string;
  notes?: string;
  modifyQuantities?: boolean;
  quantityModifications?: Array<{
    orderItemId: string; // This might be productId in Firestore if we don't have item IDs
    newQuantity: number;
  }>;
}

export interface QuickReorderResponse {
  success: boolean;
  reorder?: any;
  error?: string;
}

export class QuickReorderService {
  constructor() { }

  async createQuickReorder(data: QuickReorderData): Promise<QuickReorderResponse> {
    try {
      // Get original order
      const orderDoc = await db.collection('orders').doc(String(data.orderId)).get();
      if (!orderDoc.exists) {
        return { success: false, error: 'Original order not found' };
      }
      const originalOrder = orderDoc.data() as any;

      // Check ownership
      if (originalOrder.userId !== data.userId) {
        return { success: false, error: 'Unauthorized to reorder this order' };
      }

      // Check status
      if (originalOrder.status !== 'delivered') {
        return { success: false, error: 'Only delivered orders can be reordered' };
      }

      // Prepare new order data
      const newOrderId = randomUUID();
      const newOrderData: any = {
        id: newOrderId,
        userId: data.userId,
        status: 'pending',
        subtotal: 0, // Will recalculate
        total: 0,    // Will recalculate
        discountAmount: originalOrder.discountAmount || 0, // Logic to re-apply coupon might be complex
        taxAmount: 0,
        shippingAmount: originalOrder.shippingAmount || 0,
        orderType: 'quick_reorder',
        originalOrderId: data.orderId,
        notes: data.notes || `Quick reorder from order ${data.orderId}`,
        shippingAddress: originalOrder.shippingAddress,
        billingAddress: originalOrder.billingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Handle coupon - Simplified: Re-use if valid not implemented deeply here, assuming passed or re-calc
      // In Firestore version, we might need to re-fetch coupon to check validity
      if (originalOrder.couponCode) {
        // Logic to check coupon validity would go here
        newOrderData.couponCode = originalOrder.couponCode;
      }

      // Process items
      const orderItems = [];
      let newSubtotal = 0;

      for (const originalItem of (originalOrder.items || [])) {
        let quantity = originalItem.quantity;
        const productId = originalItem.productId;

        // Apply quantity modifications
        if (data.modifyQuantities && data.quantityModifications) {
          // Assuming orderItemId in modification refers to productId for simplicity or we match by index/id
          const modification = data.quantityModifications.find(m => m.orderItemId === originalItem.productId || m.orderItemId === originalItem.id);
          if (modification) {
            quantity = modification.newQuantity;
          }
        }

        if (quantity <= 0) continue;

        // Check product stock
        const productDoc = await db.collection('products').doc(String(productId)).get();
        if (!productDoc.exists) continue;
        const product = productDoc.data() as any;

        if (!product.isActive) continue;

        if (product.stock < quantity) {
          quantity = product.stock; // Adjust to max available
        }
        if (quantity <= 0) continue;

        const price = product.price; // Use current price

        orderItems.push({
          productId,
          name: product.name,
          quantity,
          price,
          originalPrice: price,
          image: product.images?.[0] || ''
        });

        newSubtotal += price * quantity;
      }

      if (orderItems.length === 0) {
        return { success: false, error: 'No items available for reorder' };
      }

      newOrderData.items = orderItems;
      newOrderData.subtotal = newSubtotal;
      // Recalculate tax/total
      newOrderData.taxAmount = newSubtotal * 0.18; // Approx tax
      newOrderData.total = newSubtotal + newOrderData.taxAmount + newOrderData.shippingAmount - newOrderData.discountAmount;

      // Save new order
      await db.collection('orders').doc(newOrderId).set(newOrderData);

      // Save QuickReorder tracking
      const reorderId = randomUUID();
      await db.collection('quick_reorders').doc(reorderId).set({
        id: reorderId,
        originalOrderId: data.orderId,
        newOrderId: newOrderId,
        userId: data.userId,
        notes: data.notes,
        quantityModifications: data.modifyQuantities ? JSON.stringify(data.quantityModifications) : null,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });

      return { success: true, reorder: newOrderData };

    } catch (error) {
      logger.error('Error creating quick reorder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  }

  async getUserReorders(userId: string, filters?: { limit?: number; offset?: number; status?: string }): Promise<{ reorders: any[]; total: number }> {
    try {
      let query = db.collection('quick_reorders').where('userId', '==', userId);
      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      // Firestore offset/limit is basic
      const snapshot = await query.get(); // Get all to filter/sort in memory if needed or use composite index

      let docs = snapshot.docs.map(d => d.data());
      docs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Desc

      const total = docs.length;
      if (filters?.offset) docs = docs.slice(filters.offset);
      if (filters?.limit) docs = docs.slice(0, filters.limit);

      // Fetch details (join)
      const reorders = await Promise.all(docs.map(async (reorder: any) => {
        const originalOrderSnap = await db.collection('orders').doc(String(reorder.originalOrderId)).get();
        const newOrderSnap = await db.collection('orders').doc(String(reorder.newOrderId)).get();
        return {
          ...reorder,
          originalOrder: originalOrderSnap.data(),
          newOrder: newOrderSnap.data()
        };
      }));

      return { reorders, total };
    } catch (error) {
      return { reorders: [], total: 0 };
    }
  }

  async getReorderById(reorderId: string, userId: string): Promise<any | null> {
    try {
      const doc = await db.collection('quick_reorders').doc(reorderId).get();
      if (!doc.exists) return null;
      const data = doc.data() as any;
      if (data.userId !== userId) return null;

      const originalOrderSnap = await db.collection('orders').doc(String(data.originalOrderId)).get();
      const newOrderSnap = await db.collection('orders').doc(String(data.newOrderId)).get();

      return {
        ...data,
        originalOrder: originalOrderSnap.data(),
        newOrder: newOrderSnap.data()
      };
    } catch (error) {
      return null;
    }
  }

  async cancelReorder(reorderId: string, userId: string, reason: string): Promise<QuickReorderResponse> {
    try {
      const docRef = db.collection('quick_reorders').doc(reorderId);
      const doc = await docRef.get();
      if (!doc.exists) return { success: false, error: 'Not found' };
      const data = doc.data() as any;

      if (data.userId !== userId) return { success: false, error: 'Unauthorized' };

      const newOrderRef = db.collection('orders').doc(data.newOrderId);
      const newOrderDoc = await newOrderRef.get();
      const newOrder = newOrderDoc.data() as any;

      if (newOrder.status !== 'pending') return { success: false, error: 'Can only cancel pending' };

      // Update order
      await newOrderRef.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString()
      });

      // Update reorder
      await docRef.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed' };
    }
  }

  async getReorderStats(userId: string): Promise<any> {
    // Mock stats or aggregate from Firestore
    return {
      totalReorders: 0,
      successfulReorders: 0,
      cancelledReorders: 0,
      pendingReorders: 0,
      averageOrderValue: 0,
      mostReorderedProducts: []
    };
  }

  async getRecommendedReorders(userId: string, limit: number = 5): Promise<any[]> {
    try {
      const ordersSnap = await db.collection('orders').where('userId', '==', userId).where('status', '==', 'delivered').get();
      const productCounts: Record<string, any> = {};

      ordersSnap.forEach(doc => {
        const order = doc.data();
        (order.items || []).forEach((item: any) => {
          if (!productCounts[item.productId]) {
            productCounts[item.productId] = { ...item, count: 0, lastOrdered: order.createdAt };
          }
          productCounts[item.productId].count++;
          if (order.createdAt > productCounts[item.productId].lastOrdered) {
            productCounts[item.productId].lastOrdered = order.createdAt;
          }
        });
      });

      return Object.values(productCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, limit);

    } catch (error) {
      return [];
    }
  }
}

export default QuickReorderService;