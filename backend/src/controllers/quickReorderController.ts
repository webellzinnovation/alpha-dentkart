import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import QuickReorderService, { QuickReorderData } from '../services/quickReorderService';

const prisma = new PrismaClient();
const quickReorderService = new QuickReorderService(prisma);

// Create quick reorder
export const createQuickReorder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const reorderData: QuickReorderData = {
      userId,
      orderId,
      notes,
      modifyQuantities: modifyQuantities || false,
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
    console.error('Error in createQuickReorder:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get user's reorders
export const getUserReorders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      limit,
      offset,
      status
    } = req.query;

    const result = await quickReorderService.getUserReorders(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      status: status as string
    });

    return res.status(200).json({
      success: true,
      reorders: result.reorders,
      total: result.total
    });
  } catch (error) {
    console.error('Error in getUserReorders:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get reorder by ID
export const getReorderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const reorder = await quickReorderService.getReorderById(id, userId);

    if (!reorder) {
      return res.status(404).json({
        success: false,
        error: 'Reorder not found'
      });
    }

    return res.status(200).json({
      success: true,
      reorder
    });
  } catch (error) {
    console.error('Error in getReorderById:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Cancel reorder
export const cancelReorder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required'
      });
    }

    const result = await quickReorderService.cancelReorder(id, userId, reason);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Reorder cancelled successfully',
        reorder: result.reorder
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in cancelReorder:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get reorder statistics
export const getReorderStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const stats = await quickReorderService.getReorderStats(userId);

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in getReorderStats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get recommended reorders
export const getRecommendedReorders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { limit = 5 } = req.query;

    const recommended = await quickReorderService.getRecommendedReorders(
      userId,
      parseInt(limit as string)
    );

    return res.status(200).json({
      success: true,
      recommended
    });
  } catch (error) {
    console.error('Error in getRecommendedReorders:', error);
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