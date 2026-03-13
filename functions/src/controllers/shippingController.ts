import { Request, Response } from 'express';
import { db, admin } from '../config/firebase'; // Firestore
import { z } from 'zod';
import logger from '../utils/logger';

// Shiprocket API Configuration
const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || 'https://api.shiprocket.in/v1';
const SHIPROCKET_TOKEN = process.env.SHIPROCKET_TOKEN;

// Validation Schema for Shipping Rates
const shippingRateSchema = z.object({
  pickup_postcode: z.string(),
  delivery_postcode: z.string(),
  cod: z.string().optional(),
  weight: z.number()
});

// Helper for Auth Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  }
}

// Create shipment with Shiprocket
export async function createShipment(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    // Get order details
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = { id: orderDoc.id, ...orderDoc.data() } as any;

    // Fetch user details mostly for address validation if order address is missing
    let user = null;
    if (order.userId && order.userId !== 'guest') {
      const userDoc = await db.collection('users').doc(order.userId).get();
      if (userDoc.exists) {
        user = userDoc.data();
      }
    }

    // Parse order items (Firestore stores them as array of objects natively now)
    const items = order.items || [];
    const shippingAddress = order.shippingAddress || (user?.addresses?.find((a: any) => a.default) || user?.addresses?.[0]);

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address missing' });
    }

    // Prepare Shiprocket order data
    const shiprocketData = {
      order_id: order.id,
      order_date: new Date(order.createdAt).toISOString(),
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || 'alpha_dentkart',
      comment: 'Order from Alpha Dentkart',
      company_name: 'Alpha Dentkart',
      billing_customer_name: order.customerName.split(' ')[0] || '',
      billing_last_name: order.customerName.split(' ').slice(1).join(' ') || '',
      billing_address: shippingAddress.street || '',
      billing_address_2: '',
      billing_city: shippingAddress.city || '',
      billing_state: shippingAddress.state || '',
      billing_country: 'IN',
      billing_pincode: shippingAddress.zip || '',
      billing_email: user?.email || 'guest@alphadentkart.com',
      billing_phone: shippingAddress.phone || user?.phone || '',
      shipping_is_billing: true,
      shipping_customer_name: order.customerName.split(' ')[0] || '',
      shipping_last_name: order.customerName.split(' ').slice(1).join(' ') || '',
      shipping_address: shippingAddress.street || '',
      shipping_address_2: '',
      shipping_city: shippingAddress.city || '',
      shipping_state: shippingAddress.state || '',
      shipping_country: 'IN',
      shipping_pincode: shippingAddress.zip || '',
      shipping_email: user?.email || 'guest@alphadentkart.com',
      shipping_phone: shippingAddress.phone || user?.phone || '',
      order_items: items.map((item: any) => ({
        name: item.name,
        sku: item.productId?.toString() || item.name,
        units: item.quantity,
        selling_price: item.price.toString(),
        discount: '0',
        tax: ((item.price * 0.18).toFixed(2)).toString(), // 18% GST assumption
        hsn_code: '9984'
      })),
      payment_method: order.paymentMethod || 'cod',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0, // Simplified
      sub_total: order.total,
      length: 20,
      breadth: 15,
      height: 10,
      weight: Math.max(0.5, items.reduce((sum: number, item: any) => sum + (item.weight || 0.1) * item.quantity, 0))
    };

    // Call Shiprocket API
    const response = await fetch(`${SHIPROCKET_API_URL}/order/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SHIPROCKET_TOKEN}`
      },
      body: JSON.stringify(shiprocketData)
    });

    const result = await response.json() as any;

    if (result.status === 1) {
      // Update order with tracking information
      await db.collection('orders').doc(orderId).update({
        status: 'Shipped',
        updatedAt: new Date().toISOString()
      });

      // Create shipping tracking records
      const batch = db.batch();
      for (const shipment of result.data.pickups) {
        const trackingRef = db.collection('shipping_tracking').doc(); // Auto ID
        batch.set(trackingRef, {
          orderId: order.id,
          carrier: shipment.courier_name.toLowerCase(),
          trackingId: shipment.tracking_id,
          serviceType: 'standard',
          status: 'in-transit',
          estimatedDelivery: shipment.etd ? new Date(shipment.etd).toISOString() : null,
          checkpoints: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();

      res.json({
        success: true,
        shipments: result.data.pickups,
        message: 'Shipment created successfully'
      });
    } else {
      res.status(400).json({
        error: 'Failed to create shipment',
        message: result.message || 'Unknown error'
      });
    }
  } catch (error) {
    logger.error('Error creating shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
}

// Track shipment using Shiprocket
export async function trackShipment(req: Request, res: Response) {
  try {
    const { trackingId } = req.params;

    // Check local database first
    const snapshot = await db.collection('shipping_tracking').where('trackingId', '==', trackingId).limit(1).get();

    let localTracking = null;
    let localTrackingId = null;

    if (!snapshot.empty) {
      localTracking = snapshot.docs[0].data();
      localTrackingId = snapshot.docs[0].id; // Doc ID
    }

    if (localTracking && localTracking.status === 'delivered') {
      // If delivered, rely on local data usually
      return res.json({ tracking: localTracking });
    }

    // If not local or not delivered, try Shiprocket API update
    const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/shipment/${trackingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SHIPROCKET_TOKEN}`
      }
    });

    const result = await response.json() as any;

    if (result.status === 200 && result.tracking_data.length > 0) {
      const tracking = result.tracking_data[0];

      const newStatus = tracking.status[tracking.status.length - 1]?.status_code || 'unknown';
      const checkpoints = tracking.status.map((checkpoint: any) => ({
        status: checkpoint.status,
        location: checkpoint.location,
        timestamp: checkpoint.status_date,
        description: checkpoint.status_remarks
      }));

      // Upsert to local
      if (localTrackingId) {
        await db.collection('shipping_tracking').doc(localTrackingId).update({
          status: newStatus,
          checkpoints: checkpoints, // Firestore array
          estimatedDelivery: tracking.etd ? new Date(tracking.etd).toISOString() : null,
          updatedAt: new Date().toISOString()
        });
      }

      // Return unified structure
      return res.json({
        tracking: {
          trackingId,
          carrier: tracking.courier_name,
          status: newStatus,
          statusText: tracking.status[tracking.status.length - 1]?.status,
          checkpoints: checkpoints,
          estimatedDelivery: tracking.etd,
          trackingUrl: result.tracking_url
        }
      });
    }

    // Fallback to local if API fails but we have data
    if (localTracking) {
      return res.json({ tracking: localTracking });
    }

    res.status(404).json({ error: 'Tracking not found' });
  } catch (error) {
    logger.error('Error tracking shipment:', error);
    res.status(500).json({ error: 'Failed to track shipment' });
  }
}

// Get shipping rates using Shiprocket
export async function getShippingRates(req: Request, res: Response) {
  try {
    const { pickup_postcode, delivery_postcode, cod, weight } = req.body;

    if (!pickup_postcode || !delivery_postcode || !weight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await fetch(`${SHIPROCKET_API_URL}/courier/serviceability/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SHIPROCKET_TOKEN}`
      },
      body: JSON.stringify({
        pickup_postcode,
        delivery_postcode,
        cod: cod || '0',
        weight: weight.toString()
      })
    });

    const result = await response.json() as any;

    if (result.status === 200) {
      const availableCouriers = result.data.available_courier_companies || [];

      res.json({
        success: true,
        rates: availableCouriers.map((courier: any) => ({
          courierName: courier.courier_name,
          courierId: courier.courier_id,
          etd: courier.etd,
          estimatedDays: courier.etd ? Math.ceil((new Date(courier.etd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
          charge: courier.rate,
          codAvailable: courier.cod === '1',
          serviceType: courier.service_type
        })),
        pickupPostalCode: pickup_postcode,
        deliveryPostalCode: delivery_postcode
      });
    } else {
      res.status(400).json({
        error: 'Failed to get shipping rates',
        message: result.message || 'Unknown error'
      });
    }
  } catch (error) {
    logger.error('Error getting shipping rates:', error);
    res.status(500).json({ error: 'Failed to get shipping rates' });
  }
}

// Check PIN code serviceability
export async function checkPincodeServiceability(req: Request, res: Response) {
  try {
    const { pincode } = req.params;

    if (!pincode) {
      return res.status(400).json({ error: 'PIN code required' });
    }

    // Check local database first
    const pincodeDoc = await db.collection('indian_pincodes').doc(String(pincode)).get();

    if (pincodeDoc.exists) {
      return res.json(pincodeDoc.data());
    }

    // Check Shiprocket API
    const response = await fetch(`${SHIPROCKET_API_URL}/courier/checkServiceability/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SHIPROCKET_TOKEN}`
      },
      body: JSON.stringify({
        pickup_postcode: process.env.DEFAULT_PICKUP_PINCODE || '400001',
        delivery_postcode: pincode
      })
    });

    const result = await response.json() as any;

    if (result.status === 200) {
      const serviceability = result.data;
      const companies = serviceability.available_courier_companies || [];

      const pincodeData = {
        pincode,
        isServiceable: companies.length > 0,
        codAvailable: companies.some((c: any) => c.cod === '1'),
        deliveryDays: companies.length > 0
          ? Math.min(...companies.map((c: any) => parseInt(c.etd_days) || 999))
          : null,
        availableCouriers: companies.map((c: any) => ({
          name: c.courier_name,
          etdDays: c.etd_days,
          codAvailable: c.cod === '1'
        })),
        updatedAt: new Date().toISOString()
      };

      // Save to local database
      await db.collection('indian_pincodes').doc(String(pincode)).set(pincodeData);

      return res.json(pincodeData);
    }

    res.status(404).json({ serviceable: false });
  } catch (error) {
    logger.error('Error checking PIN code serviceability:', error);
    res.status(500).json({ error: 'Failed to check serviceability' });
  }
}

// Get user's order tracking information
export async function getUserOrderTracking(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orderDoc = await db.collection('orders').doc(String(orderId)).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderDoc.data() as any;

    // Verify ownership
    if (order.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get tracking details
    const trackingSnapshot = await db.collection('shipping_tracking').where('orderId', '==', orderId).get();
    const trackingDetails = trackingSnapshot.docs.map(t => t.data());

    res.json({
      order: {
        id: orderDoc.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        shippingTracking: trackingDetails
      }
    });

  } catch (error) {
    logger.error('Error getting order tracking:', error);
    res.status(500).json({ error: 'Failed to get tracking information' });
  }
}

// Admin: Get all shipments
export async function getAllShipments(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    // Pagination in Firestore is tricky without cursors. For now, simple limit.
    // In production, use startAfter() with last doc snapshot.

    const snapshot = await db.collection('shipping_tracking')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const shipments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      shipments
    });
  } catch (error) {
    logger.error('Error getting all shipments:', error);
    res.status(500).json({ error: 'Failed to get shipments' });
  }
}