import { Router } from 'express';
import { initiatePhonePePayment, handlePhonePeCallback, checkPhonePeCallback } from '../controllers/phonepeController';

const router = Router();

// Public / Authenticated: Initiate hosted checkout payment redirect
router.post('/initiate', initiatePhonePePayment);

// Public Webhook: PhonePe payment verification callback
router.post('/callback', handlePhonePeCallback);

// Public / Authenticated: Check if callback has been received for an order
router.get('/check/:orderId', checkPhonePeCallback);

export default router;
