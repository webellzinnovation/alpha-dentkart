import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SavedPaymentService, { SavedPaymentMethodData } from '../services/savedPaymentService';
import logger from '../utils/logger';

const savedPaymentService = new SavedPaymentService();

// Save new payment method
export const savePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
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

    if (!type || !gateway || !token) {
      return res.status(400).json({
        success: false,
        error: 'Type, gateway, and token are required'
      });
    }

    const paymentData: SavedPaymentMethodData = {
      userId,
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
    };

    const result = await savedPaymentService.savePaymentMethod(paymentData);

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Payment method saved successfully',
        paymentMethod: result.paymentMethod
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in savePaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user payment methods
export const getUserPaymentMethods = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const paymentMethods = await savedPaymentService.getUserPaymentMethods(userId);

    return res.status(200).json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    logger.error('Error in getUserPaymentMethods:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get payment method by ID
export const getPaymentMethodById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const paymentId = String(id);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const paymentMethod = await savedPaymentService.getPaymentMethodById(paymentId, userId);

    if (paymentMethod) {
      return res.status(200).json({
        success: true,
        paymentMethod
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }
  } catch (error) {
    logger.error('Error in getPaymentMethodById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Delete payment method
export const deletePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const paymentId = String(id);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await savedPaymentService.deletePaymentMethod(paymentId, userId);

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
    logger.error('Error in deletePaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Set default payment method
export const setDefaultPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const paymentId = String(id);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await savedPaymentService.setDefaultPaymentMethod(paymentId, userId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Default payment method updated successfully',
        paymentMethod: result.paymentMethod
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in setDefaultPaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update payment method
export const updatePaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const paymentId = String(id);
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await savedPaymentService.updatePaymentMethod(paymentId, userId, updates);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Payment method updated successfully',
        paymentMethod: result.paymentMethod
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in updatePaymentMethod:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get payment methods by gateway
export const getPaymentMethodsByGateway = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { gateway } = req.params;
    const gatewayStr = String(gateway);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const paymentMethods = await savedPaymentService.getPaymentMethodsByGateway(userId, gatewayStr);
    return res.status(200).json({ success: true, paymentMethods });
  } catch (error) {
    logger.error('Error in getPaymentMethodsByGateway:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get default payment method
export const getDefaultPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const paymentMethod = await savedPaymentService.getDefaultPaymentMethod(userId);
    return res.status(200).json({ success: true, paymentMethod });
  } catch (error) {
    logger.error('Error in getDefaultPaymentMethod:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get stats
export const getPaymentMethodStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const stats = await savedPaymentService.getPaymentMethodStats(userId);

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error in getPaymentMethodStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Validate payment token
export const validatePaymentToken = async (req: AuthRequest, res: Response) => {
  try {
    const { token, gateway } = req.body;
    if (!token || !gateway) {
      return res.status(400).json({ success: false, error: 'Token and gateway are required' });
    }

    const result = await savedPaymentService.validatePaymentToken(token, gateway);
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error in validatePaymentToken:', error);
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
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getDefaultPaymentMethod,
  updatePaymentMethod,
  getPaymentMethodsByGateway,
  getPaymentMethodStats,
  validatePaymentToken
};