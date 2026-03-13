import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import QuickReorderService, { QuickReorderData } from '../services/quickReorderService';
import logger from '../utils/logger';

const quickReorderService = new QuickReorderService();

// Create quick reorder
export const createQuickReorder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      orderId,
      notes,
      modifyQuantities,
      quantityModifications
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'OrderId is required' });
    }

    const reorderData: QuickReorderData = {
      userId,
      orderId,
      notes,
      modifyQuantities,
      quantityModifications
    };

    const result = await quickReorderService.createQuickReorder(reorderData);

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Quick reorder created successfully',
        reorder: result.reorder
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in createQuickReorder:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user reorders
export const getUserReorders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { limit = 20, offset = 0, status } = req.query;

    const result = await quickReorderService.getUserReorders(userId, {
      limit: Number(limit),
      offset: Number(offset),
      status: status ? String(status) : undefined
    });

    return res.status(200).json({
      success: true,
      reorders: result.reorders,
      total: result.total
    });
  } catch (error) {
    logger.error('Error in getUserReorders:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get reorder details
export const getReorderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const reorderId = String(id);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const reorder = await quickReorderService.getReorderById(reorderId, userId);

    if (reorder) {
      return res.status(200).json({
        success: true,
        reorder
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Reorder not found'
      });
    }
  } catch (error) {
    logger.error('Error in getReorderById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Cancel reorder
export const cancelReorder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Cancellation reason is required' });
    }

    const result = await quickReorderService.cancelReorder(String(id), userId, reason);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Reorder cancelled successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error in cancelReorder:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get stats
export const getReorderStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const stats = await quickReorderService.getReorderStats(userId);

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error in getReorderStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get recommended reorders
export const getRecommendedReorders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { limit = 5 } = req.query;

    const recommendations = await quickReorderService.getRecommendedReorders(userId, Number(limit));

    return res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error) {
    logger.error('Error in getRecommendedReorders:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  createQuickReorder,
  getUserReorders,
  getReorderById,
  cancelReorder,
  getReorderStats,
  getRecommendedReorders
};