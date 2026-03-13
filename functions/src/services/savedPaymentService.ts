import { db } from '../config/firebase'; // Firestore
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

export interface SavedPaymentMethodData {
  userId: string;
  type: 'card' | 'upi' | 'netbanking';
  gateway: 'razorpay' | 'phonepe';
  token: string;
  last4?: string;
  brand?: string;
  expiry?: string;
  holderName?: string;
  bankName?: string;
  upiId?: string;
  isDefault?: boolean;
}

export interface PaymentMethodResponse {
  success: boolean;
  paymentMethod?: any;
  error?: string;
}

export class SavedPaymentService {
  constructor() { }

  async savePaymentMethod(data: SavedPaymentMethodData): Promise<PaymentMethodResponse> {
    try {
      // If default, unset others
      if (data.isDefault) {
        const batch = db.batch();
        const otherDefaults = await db.collection('saved_payment_methods')
          .where('userId', '==', data.userId)
          .where('isDefault', '==', true)
          .get();
        otherDefaults.forEach(doc => {
          batch.update(doc.ref, { isDefault: false });
        });
        await batch.commit();
      }

      const id = randomUUID();
      const paymentData = {
        id,
        ...data,
        isDefault: data.isDefault || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('saved_payment_methods').doc(id).set(paymentData);

      return { success: true, paymentMethod: paymentData };
    } catch (error) {
      logger.error('Error saving payment method:', error);
      return { success: false, error: 'Failed to save payment method' };
    }
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    try {
      const snapshot = await db.collection('saved_payment_methods')
        .where('userId', '==', userId)
        //.orderBy('isDefault', 'desc') // Requires composite index if multiple fields
        .get();

      const methods = snapshot.docs.map(doc => doc.data());
      // Sort in memory to avoid index requirement for now
      methods.sort((a: any, b: any) => (b.isDefault === a.isDefault ? 0 : b.isDefault ? 1 : -1));
      return methods;
    } catch (error) {
      return [];
    }
  }

  async getPaymentMethodById(id: string, userId: string): Promise<any | null> {
    try {
      const doc = await db.collection('saved_payment_methods').doc(String(id)).get();
      if (!doc.exists) return null;
      const data = doc.data() as any;
      if (data.userId !== userId) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  async updatePaymentMethod(id: string, userId: string, updates: Partial<SavedPaymentMethodData>): Promise<PaymentMethodResponse> {
    try {
      const docRef = db.collection('saved_payment_methods').doc(String(id));
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.userId !== userId) return { success: false, error: 'Not found' };

      if (updates.isDefault) {
        const batch = db.batch();
        const otherDefaults = await db.collection('saved_payment_methods')
          .where('userId', '==', userId)
          .where('isDefault', '==', true)
          .get();
        otherDefaults.forEach(d => {
          if (d.id !== id) batch.update(d.ref, { isDefault: false });
        });
        await batch.commit();
      }

      await docRef.update({
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return { success: true, paymentMethod: { ...(doc.data()), ...updates } };
    } catch (error) {
      return { success: false, error: 'Failed to update' };
    }
  }

  async deletePaymentMethod(id: string, userId: string): Promise<PaymentMethodResponse> {
    try {
      const docRef = db.collection('saved_payment_methods').doc(String(id));
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.userId !== userId) return { success: false, error: 'Not found' };

      const wasDefault = doc.data()?.isDefault;
      await docRef.delete();

      if (wasDefault) {
        const snapshot = await db.collection('saved_payment_methods')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({ isDefault: true });
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed' };
    }
  }

  async setDefaultPaymentMethod(id: string, userId: string): Promise<PaymentMethodResponse> {
    try {
      const batch = db.batch();
      const allDocs = await db.collection('saved_payment_methods').where('userId', '==', userId).get();
      let found = false;

      allDocs.forEach(doc => {
        if (doc.id === id) {
          batch.update(doc.ref, { isDefault: true, updatedAt: new Date().toISOString() });
          found = true;
        } else if (doc.data().isDefault) {
          batch.update(doc.ref, { isDefault: false });
        }
      });

      if (!found) return { success: false, error: 'Not found' };
      await batch.commit();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed' };
    }
  }

  async getDefaultPaymentMethod(userId: string): Promise<any | null> {
    try {
      const snapshot = await db.collection('saved_payment_methods')
        .where('userId', '==', userId)
        .where('isDefault', '==', true)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      return snapshot.docs[0].data();
    } catch (error) {
      return null;
    }
  }

  async getPaymentMethodsByGateway(userId: string, gateway: string): Promise<any[]> {
    try {
      const snapshot = await db.collection('saved_payment_methods')
        .where('userId', '==', userId)
        .where('gateway', '==', gateway)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      return [];
    }
  }

  async validatePaymentToken(token: string, gateway: 'razorpay' | 'phonepe'): Promise<{ isValid: boolean; last4?: string; brand?: string; expiry?: string; error?: string }> {
    // Mock validation logic
    if (gateway === 'razorpay') {
      return { isValid: true, last4: token.slice(-4), brand: 'VISA', expiry: '12/25' };
    }
    return { isValid: true };
  }

  async getPaymentMethodStats(userId: string): Promise<any> {
    // Mock or basic aggregation
    return {
      totalMethods: 0,
      byType: {},
      byGateway: {},
      defaultMethod: null
    };
  }
}

export default SavedPaymentService;