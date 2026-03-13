import { Router } from 'express';
import { 
  createShiprocketOrder,
  getShippingRates,
  trackShipment,
  checkPincodeServiceability,
  getEstimatedDelivery,
  cancelShiprocketOrder,
  getAvailableCouriers,
  calculateShippingCharges
} from '../controllers/shiprocketController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation helper function
const validateRequest = (req: any, res: any, requiredFields: string[]) => {
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        message: `${field} is required`
      });
    }
  }
  return null;
};

// Public routes
router.post('/check-pincode', authLimiter, (req, res) => {
  const validation = validateRequest(req, res, ['pincode']);
  if (validation) return;
  checkPincodeServiceability(req, res);
});

router.post('/get-rates', authLimiter, (req, res) => {
  const validation = validateRequest(req, res, ['deliveryPincode']);
  if (validation) return;
  getShippingRates(req, res);
});

router.post('/estimate-delivery', authLimiter, (req, res) => {
  const validation = validateRequest(req, res, ['deliveryPincode']);
  if (validation) return;
  getEstimatedDelivery(req, res);
});

router.post('/calculate-charges', authLimiter, (req, res) => {
  const validation = validateRequest(req, res, ['deliveryPincode']);
  if (validation) return;
  calculateShippingCharges(req, res);
});

// Protected routes
router.post('/create-order', authenticateToken, (req, res) => {
  const validation = validateRequest(req, res, ['orderData']);
  if (validation) return;
  createShiprocketOrder(req, res);
});

router.post('/track', authenticateToken, (req, res) => {
  const { awbNumber, orderId } = req.body;
  
  if (!awbNumber && !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Either AWB number or Order ID is required'
    });
  }
  
  trackShipment(req, res);
});

router.post('/track-order', authenticateToken, (req, res) => {
  const validation = validateRequest(req, res, ['orderId']);
  if (validation) return;
  trackShipment(req, res); // Reuse same function with orderId
});

router.post('/cancel', authenticateToken, (req, res) => {
  const validation = validateRequest(req, res, ['orderIds']);
  if (validation) return;
  cancelShiprocketOrder(req, res);
});

router.post('/available-couriers', authLimiter, (req, res) => {
  const validation = validateRequest(req, res, ['deliveryPincode']);
  if (validation) return;
  getAvailableCouriers(req, res);
});

export default router;