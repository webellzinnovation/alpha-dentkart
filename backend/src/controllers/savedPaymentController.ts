import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import SavedPaymentService, { SavedPaymentMethodData } from '../services/savedPaymentService';

const prisma = new PrismaClient();
const savedPaymentService = new SavedPaymentService(prisma);

// Save payment method
export const savePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      type,
      gateway,
      token,
      last4,
      brand,
      expiry,
      holderName,
      bankName,
      upiId,
      isDefault
    } = req.body;

    // Validate required fields
    if (!type || !gateway || !token) {
      return res.status(400).json({
        success: false,
        error: 'Type, gateway, and token are required'
      });
    }

    // Validate payment type
    const validTypes = ['card', 'upi', 'netbanking'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment type. Must be card, upi, or netbanking'
      });
    }

    // Validate gateway
    const validGateways = ['razorpay', 'phonepe'];
    if (!validGateways.includes(gateway)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gateway. Must be razorpay or phonepe'
      });
    }

    // Validate card-specific fields
    if (type === 'card') {
      if (!last4 || last4.length !== 4) {
        return res.status(400).json({
          success: false,
          error: 'Last 4 digits are required for card payments'
        });
      }

      if (!brand) {
        return res.status(400).json({
          success: false,
          error: 'Card brand is required'
        });
      }

      if (!expiry || !expiry.match(/^\d{2}\/\d{2}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Expiry date must be in MM/YY format'
        });
      }
    }

    // Validate UPI-specific fields
    if (type === 'upi' && !upiId) {
      return res.status(400).json({
        success: false,
        error: 'UPI ID is required for UPI payments'
      });
    }

    // Validate bank-specific fields
    if (type === 'netbanking' && !bankName) {
      return res.status(400).json({
        success: false,
        error: 'Bank name is required for net banking'
      });
    }

    const paymentData: SavedPaymentMethodData = {
      userId,
      type: type as any,
      gateway: gateway as any,
      token,
      last4,
      brand,
      expiry,
      holderName,
      bankName,
      upiId,
      isDefault: isDefault || false
    };

    const result = await savedPaymentService.savePaymentMethod(paymentData);

    if (result.success) {
      // Mask sensitive info before returning
      const maskedMethod = savedPaymentService.maskSensitiveInfo(result.paymentMethod);
      
      return res.status(201).json({
        success: true,
        message: 'Payment method saved successfully',
        paymentMethod: maskedMethod
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in savePaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's payment methods
export const getUserPaymentMethods = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const paymentMethods = await savedPaymentService.getUserPaymentMethods(userId);

    // Mask sensitive info for all methods
    const maskedMethods = paymentMethods.map(method => 
      savedPaymentService.maskSensitiveInfo(method)
    );

    return res.status(200).json({
      success: true,
      paymentMethods: maskedMethods
    });
  } catch (error) {
    console.error('Error in getUserPaymentMethods:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get payment method by ID
export const getPaymentMethodById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const paymentMethod = await savedPaymentService.getPaymentMethodById(id, userId);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Mask sensitive info
    const maskedMethod = savedPaymentService.maskSensitiveInfo(paymentMethod);

    return res.status(200).json({
      success: true,
      paymentMethod: maskedMethod
    });
  } catch (error) {
    console.error('Error in getPaymentMethodById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update payment method
export const updatePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const {
      type,
      gateway,
      token,
      last4,
      brand,
      expiry,
      holderName,
      bankName,
      upiId,
      isDefault
    } = req.body;

    const updates: Partial<SavedPaymentMethodData> = {};
    
    if (type !== undefined) updates.type = type as any;
    if (gateway !== undefined) updates.gateway = gateway as any;
    if (token !== undefined) updates.token = token;
    if (last4 !== undefined) updates.last4 = last4;
    if (brand !== undefined) updates.brand = brand;
    if (expiry !== undefined) updates.expiry = expiry;
    if (holderName !== undefined) updates.holderName = holderName;
    if (bankName !== undefined) updates.bankName = bankName;
    if (upiId !== undefined) updates.upiId = upiId;
    if (isDefault !== undefined) updates.isDefault = isDefault;

    const result = await savedPaymentService.updatePaymentMethod(id, userId, updates);

    if (result.success) {
      // Mask sensitive info before returning
      const maskedMethod = savedPaymentService.maskSensitiveInfo(result.paymentMethod);
      
      return res.status(200).json({
        success: true,
        message: 'Payment method updated successfully',
        paymentMethod: maskedMethod
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in updatePaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete payment method
export const deletePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result = await savedPaymentService.deletePaymentMethod(id, userId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in deletePaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Set default payment method
export const setDefaultPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result = await savedPaymentService.setDefaultPaymentMethod(id, userId);

    if (result.success) {
      // Mask sensitive info before returning
      const maskedMethod = savedPaymentService.maskSensitiveInfo(result.paymentMethod);
      
      return res.status(200).json({
        success: true,
        message: 'Default payment method set successfully',
        paymentMethod: maskedMethod
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in setDefaultPaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get default payment method
export const getDefaultPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const defaultMethod = await savedPaymentService.getDefaultPaymentMethod(userId);

    if (!defaultMethod) {
      return res.status(200).json({
        success: true,
        message: 'No default payment method found'
      });
    }

    // Mask sensitive info before returning
    const maskedMethod = savedPaymentService.maskSensitiveInfo(defaultMethod);

    return res.status(200).json({
      success: true,
      paymentMethod: maskedMethod
    });
  } catch (error) {
    console.error('Error in getDefaultPaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get payment methods by gateway
export const getPaymentMethodsByGateway = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { gateway } = req.params;

    if (!['razorpay', 'phonepe'].includes(gateway)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gateway. Must be razorpay or phonepe'
      });
    }

    const paymentMethods = await savedPaymentService.getPaymentMethodsByGateway(
      userId, 
      gateway as 'razorpay' | 'phonepe'
    );

    // Mask sensitive info for all methods
    const maskedMethods = paymentMethods.map(method => 
      savedPaymentService.maskSensitiveInfo(method)
    );

    return res.status(200).json({
      success: true,
      paymentMethods: maskedMethods
    });
  } catch (error) {
    console.error('Error in getPaymentMethodsByGateway:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get payment method stats
export const getPaymentMethodStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const stats = await savedPaymentService.getPaymentMethodStats(userId);

    // Mask sensitive info in default method
    if (stats.defaultMethod) {
      stats.defaultMethod = savedPaymentService.maskSensitiveInfo(stats.defaultMethod);
    }

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in getPaymentMethodStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Validate payment token (for frontend form validation)
export const validatePaymentToken = async (req: AuthRequest, res: Response) => {
  try {
    const { token, gateway } = req.body;

    if (!token || !gateway) {
      return res.status(400).json({
        success: false,
        error: 'Token and gateway are required'
      });
    }

    if (!['razorpay', 'phonepe'].includes(gateway)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gateway. Must be razorpay or phonepe'
      });
    }

    const result = await savedPaymentService.validatePaymentToken(
      token, 
      gateway as 'razorpay' | 'phonepe'
    );

    return res.status(200).json({
      success: true,
      validation: result
    });
  } catch (error) {
    console.error('Error in validatePaymentToken:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  savePaymentMethod,
  getUserPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  getPaymentMethodsByGateway,
  getPaymentMethodStats,
  validatePaymentToken
};