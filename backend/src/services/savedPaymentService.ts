import { PrismaClient } from '@prisma/client';

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
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async savePaymentMethod(data: SavedPaymentMethodData): Promise<PaymentMethodResponse> {
    try {
      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await this.prisma.savedPaymentMethod.updateMany({
          where: {
            userId: data.userId,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }

      // Create new saved payment method
      const paymentMethod = await this.prisma.savedPaymentMethod.create({
        data: {
          userId: data.userId,
          type: data.type,
          gateway: data.gateway,
          token: data.token,
          last4: data.last4,
          brand: data.brand,
          expiry: data.expiry,
          holderName: data.holderName,
          bankName: data.bankName,
          upiId: data.upiId,
          isDefault: data.isDefault || false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        paymentMethod
      };
    } catch (error) {
      console.error('Error saving payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save payment method'
      };
    }
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    try {
      const paymentMethods = await this.prisma.savedPaymentMethod.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return paymentMethods;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async getPaymentMethodById(id: string, userId: string): Promise<any | null> {
    try {
      const paymentMethod = await this.prisma.savedPaymentMethod.findFirst({
        where: {
          id,
          userId
        }
      });

      return paymentMethod;
    } catch (error) {
      console.error('Error fetching payment method:', error);
      return null;
    }
  }

  async updatePaymentMethod(
    id: string,
    userId: string,
    updates: Partial<SavedPaymentMethodData>
  ): Promise<PaymentMethodResponse> {
    try {
      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await this.prisma.savedPaymentMethod.updateMany({
          where: {
            userId,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }

      const updatedPaymentMethod = await this.prisma.savedPaymentMethod.update({
        where: {
          id,
          userId
        },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        paymentMethod: updatedPaymentMethod
      };
    } catch (error) {
      console.error('Error updating payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment method'
      };
    }
  }

  async deletePaymentMethod(id: string, userId: string): Promise<PaymentMethodResponse> {
    try {
      // Check if payment method exists and belongs to user
      const paymentMethod = await this.prisma.savedPaymentMethod.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!paymentMethod) {
        return {
          success: false,
          error: 'Payment method not found'
        };
      }

      // Delete the payment method
      await this.prisma.savedPaymentMethod.delete({
        where: {
          id,
          userId
        }
      });

      // If this was the default, set another one as default if available
      if (paymentMethod.isDefault) {
        const remainingMethods = await this.prisma.savedPaymentMethod.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1
        });

        if (remainingMethods.length > 0) {
          await this.prisma.savedPaymentMethod.update({
            where: { id: remainingMethods[0].id },
            data: { isDefault: true }
          });
        }
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete payment method'
      };
    }
  }

  async setDefaultPaymentMethod(id: string, userId: string): Promise<PaymentMethodResponse> {
    try {
      // Unset all other payment methods
      await this.prisma.savedPaymentMethod.updateMany({
        where: {
          userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });

      // Set new default
      const updatedPaymentMethod = await this.prisma.savedPaymentMethod.update({
        where: {
          id,
          userId
        },
        data: {
          isDefault: true,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        paymentMethod: updatedPaymentMethod
      };
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set default payment method'
      };
    }
  }

  async getDefaultPaymentMethod(userId: string): Promise<any | null> {
    try {
      const defaultMethod = await this.prisma.savedPaymentMethod.findFirst({
        where: {
          userId,
          isDefault: true
        }
      });

      return defaultMethod;
    } catch (error) {
      console.error('Error fetching default payment method:', error);
      return null;
    }
  }

  async getPaymentMethodsByGateway(userId: string, gateway: 'razorpay' | 'phonepe'): Promise<any[]> {
    try {
      const paymentMethods = await this.prisma.savedPaymentMethod.findMany({
        where: {
          userId,
          gateway
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return paymentMethods;
    } catch (error) {
      console.error('Error fetching payment methods by gateway:', error);
      return [];
    }
  }

  async validatePaymentToken(token: string, gateway: 'razorpay' | 'phonepe'): Promise<{
    isValid: boolean;
    last4?: string;
    brand?: string;
    expiry?: string;
    error?: string;
  }> {
    try {
      // This would integrate with payment gateway to validate token
      // For now, we'll implement basic validation
      
      if (gateway === 'razorpay') {
        // Razorpay token validation
        // In production, this would call Razorpay's validation API
        return {
          isValid: true,
          last4: token.slice(-4), // Mock last 4 digits
          brand: 'VISA', // Mock brand
          expiry: '12/25' // Mock expiry
        };
      } else if (gateway === 'phonepe') {
        // PhonePe token validation
        // In production, this would call PhonePe's validation API
        return {
          isValid: true
        };
      }

      return {
        isValid: false,
        error: 'Invalid gateway'
      };
    } catch (error) {
      console.error('Error validating payment token:', error);
      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }

  maskSensitiveInfo(paymentMethod: any): any {
    const masked = { ...paymentMethod };

    // Mask card number
    if (masked.type === 'card' && masked.last4) {
      masked.last4 = `****${masked.last4}`;
    }

    // Mask token
    if (masked.token) {
      masked.token = masked.token.substring(0, 8) + '...';
    }

    // Remove sensitive data from response
    delete masked.rawGatewayResponse;

    return masked;
  }

  async getPaymentMethodStats(userId: string): Promise<{
    totalMethods: number;
    byType: Record<string, number>;
    byGateway: Record<string, number>;
    defaultMethod: any | null;
  }> {
    try {
      const [methods, byType, byGateway, defaultMethod] = await Promise.all([
        this.prisma.savedPaymentMethod.count({
          where: { userId }
        }),
        this.prisma.savedPaymentMethod.groupBy({
          by: ['type'],
          where: { userId },
          _count: { type: true }
        }),
        this.prisma.savedPaymentMethod.groupBy({
          by: ['gateway'],
          where: { userId },
          _count: { gateway: true }
        }),
        this.getDefaultPaymentMethod(userId)
      ]);

      const typeCounts = byType.reduce((acc, item) => {
        acc[item.type] = (item._count.type as number) || 0;
        return acc;
      }, {} as Record<string, number>);

      const gatewayCounts = byGateway.reduce((acc, item) => {
        acc[item.gateway] = (item._count.gateway as number) || 0;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalMethods: methods,
        byType: typeCounts,
        byGateway: gatewayCounts,
        defaultMethod
      };
    } catch (error) {
      console.error('Error fetching payment method stats:', error);
      return {
        totalMethods: 0,
        byType: {},
        byGateway: {},
        defaultMethod: null
      };
    }
  }
}

export default SavedPaymentService;