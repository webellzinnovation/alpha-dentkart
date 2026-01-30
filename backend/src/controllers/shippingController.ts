import { Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

// Shiprocket API Configuration
const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL || 'https://api.shiprocket.in/v1';
const SHIPROCKET_TOKEN = process.env.SHIPROCKET_TOKEN;

interface ShiprocketOrderData {
  order_id: string;
  order_date: string;
  channel_id: string;
  comment: string;
  company_name: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_pincode: string;
  shipping_email: string;
  shipping_phone: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: string;
    discount: string;
    tax: string;
    hsn_code: string;
  }>;
  payment_method: string;
  shipping_charges: number;
  giftwrap_charges: number;
  transaction_charges: number;
  total_discount: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface ShiprocketTrackingResponse {
  tracking_data: Array<{
    id: string;
    awb: string;
    courier_name: string;
    status: {
      status_code: string;
      status: string;
      status_date: string;
      location: string;
      status_remarks: string;
    }[];
    etd: string;
  }>;
  tracking_url?: string;
}

// Create shipment with Shiprocket
export async function createShipment(req: Request, res: Response) {
  try {
    const { orderId } = req.body;
    
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            addresses: {
              where: { isDefault: true },
              take: 1,
              select: {
                street: true,
                city: true,
                state: true,
                zip: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Parse order items from JSON
    const items = JSON.parse(order.items as string);

    // Prepare Shiprocket order data
    const shiprocketData: ShiprocketOrderData = {
      order_id: order.id,
      order_date: new Date(order.createdAt).toISOString(),
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || 'alpha_dentkart',
      comment: 'Order from Alpha Dentkart',
      company_name: 'Alpha Dentkart',
      billing_customer_name: order.customerName.split(' ')[0] || '',
      billing_last_name: order.customerName.split(' ').slice(1).join(' ') || '',
      billing_address: order.user.addresses[0]?.street || '',
      billing_address_2: '',
      billing_city: order.user.addresses[0]?.city || '',
      billing_state: order.user.addresses[0]?.state || '',
      billing_country: 'IN',
      billing_pincode: order.user.addresses[0]?.zip || '',
      billing_email: order.user.email,
      billing_phone: order.user.addresses[0]?.phone || order.user.phone,
      shipping_is_billing: true,
      shipping_customer_name: order.customerName.split(' ')[0] || '',
      shipping_last_name: order.customerName.split(' ').slice(1).join(' ') || '',
      shipping_address: order.shippingAddress ? JSON.parse(order.shippingAddress as string).street : order.user.addresses[0]?.street || '',
      shipping_address_2: '',
      shipping_city: order.shippingAddress ? JSON.parse(order.shippingAddress as string).city : order.user.addresses[0]?.city || '',
      shipping_state: order.shippingAddress ? JSON.parse(order.shippingAddress as string).state : order.user.addresses[0]?.state || '',
      shipping_country: 'IN',
      shipping_pincode: order.shippingAddress ? JSON.parse(order.shippingAddress as string).zip : order.user.addresses[0]?.zip || '',
      shipping_email: order.user.email,
      shipping_phone: order.shippingAddress ? JSON.parse(order.shippingAddress as string).phone : order.user.addresses[0]?.phone || order.user.phone,
      order_items: items.map((item: any) => ({
        name: item.name,
        sku: item.productId.toString(),
        units: item.quantity,
        selling_price: item.price.toString(),
        discount: '0',
        tax: ((item.price * 0.18).toFixed(2)).toString(), // 18% GST
        hsn_code: '9984' // Medical devices
      })),
      payment_method: order.paymentMethod || 'cod',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: items.reduce((sum: number, item: any) => sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0),
      sub_total: order.total,
      length: 20, // Default package dimensions
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
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'Shipped',
          // Store tracking details in shippingTracking model
        }
      });

      // Create shipping tracking records
      for (const shipment of result.data.pickups) {
        await prisma.shippingTracking.create({
          data: {
            orderId: order.id,
            carrier: shipment.courier_name.toLowerCase(),
            trackingId: shipment.tracking_id,
            serviceType: 'standard',
            status: 'in-transit',
            estimatedDelivery: shipment.etd ? new Date(shipment.etd) : undefined,
            checkpoints: JSON.stringify([])
          }
        });
      }

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
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
}

// Track shipment using Shiprocket
export async function trackShipment(req: Request, res: Response) {
  try {
    const { trackingId } = req.params;

    // First check local database
    const localTracking = await prisma.shippingTracking.findUnique({
      where: { trackingId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (localTracking) {
      return res.json({
        tracking: {
          id: localTracking.id,
          trackingId: localTracking.trackingId,
          carrier: localTracking.carrier,
          serviceType: localTracking.serviceType,
          status: localTracking.status,
          estimatedDelivery: localTracking.estimatedDelivery,
          actualDelivery: localTracking.actualDelivery,
          checkpoints: localTracking.checkpoints ? JSON.parse(localTracking.checkpoints as string) : [],
          orderId: localTracking.orderId,
          createdAt: localTracking.createdAt,
          updatedAt: localTracking.updatedAt
        }
      });
    }

    // If not in local DB, try Shiprocket API
    const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/shipment/${trackingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SHIPROCKET_TOKEN}`
      }
    });

    const result = await response.json() as ShiprocketTrackingResponse;

    if (result.status === 200 && result.tracking_data.length > 0) {
      const tracking = result.tracking_data[0];
      
      // Save to local database
      await prisma.shippingTracking.upsert({
        where: { trackingId },
        update: {
          carrier: tracking.courier_name.toLowerCase(),
          status: tracking.status[tracking.status.length - 1].status_code,
          checkpoints: JSON.stringify(tracking.status.map(checkpoint => ({
            status: checkpoint.status,
            location: checkpoint.location,
            timestamp: checkpoint.status_date,
            description: checkpoint.status_remarks
          }))),
          estimatedDelivery: tracking.etd ? new Date(tracking.etd) : undefined
        },
        create: {
          trackingId,
          carrier: tracking.courier_name.toLowerCase(),
          serviceType: 'standard',
          status: tracking.status[tracking.status.length - 1].status_code,
          checkpoints: JSON.stringify(tracking.status.map(checkpoint => ({
            status: checkpoint.status,
            location: checkpoint.location,
            timestamp: checkpoint.status_date,
            description: checkpoint.status_remarks
          }))),
          estimatedDelivery: tracking.etd ? new Date(tracking.etd) : undefined
        }
      });

      return res.json({
        tracking: {
          trackingId,
          carrier: tracking.courier_name,
          status: tracking.status[tracking.status.length - 1].status_code,
          statusText: tracking.status[tracking.status.length - 1].status,
          checkpoints: tracking.status.map(checkpoint => ({
            status: checkpoint.status_code,
            statusText: checkpoint.status,
            location: checkpoint.location,
            timestamp: checkpoint.status_date,
            description: checkpoint.status_remarks
          })),
          estimatedDelivery: tracking.etd,
          trackingUrl: result.tracking_url
        }
      });
    }

    res.status(404).json({ error: 'Tracking not found' });
  } catch (error) {
    console.error('Error tracking shipment:', error);
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
        cod: cod || '0', // 0 for prepaid, 1 for COD
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
    console.error('Error getting shipping rates:', error);
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
    const localPincode = await prisma.indianPincode.findUnique({
      where: { pincode }
    });

    if (localPincode) {
      return res.json({
        serviceable: localPincode.isServiceable,
        codAvailable: localPincode.codAvailable,
        deliveryDays: localPincode.deliveryDays,
        city: localPincode.city,
        state: localPincode.state
      });
    }

    // Check Shiprocket API
    const response = await fetch(`${SHIPROCKET_API_URL}/courier/checkServiceability/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SHIPROCKET_TOKEN}`
      },
      body: JSON.stringify({
        pickup_postcode: '400001', // Default from Mumbai
        delivery_postcode: pincode
      })
    });

    const result = await response.json() as any;

    if (result.status === 200) {
      const serviceability = result.data;
      
      // Save to local database for future queries
      await prisma.indianPincode.upsert({
        where: { pincode },
        update: {
          isServiceable: serviceability.courier_companies.length > 0,
          codAvailable: serviceability.courier_companies.some((c: any) => c.cod === '1'),
          deliveryDays: serviceability.courier_companies.length > 0 
            ? Math.min(...serviceability.courier_companies.map((c: any) => parseInt(courier.etd_days) || 999))
            : null,
          carriers: JSON.stringify(serviceability.courier_companies.map((c: any) => c.courier_name))
        },
        create: {
          pincode,
          isServiceable: serviceability.courier_companies.length > 0,
          codAvailable: serviceability.courier_companies.some((c: any) => c.cod === '1'),
          deliveryDays: serviceability.courier_companies.length > 0 
            ? Math.min(...serviceability.courier_companies.map((c: any) => parseInt(courier.etd_days) || 999))
            : null,
          carriers: JSON.stringify(serviceability.courier_companies.map((c: any) => c.courier_name))
        }
      });

      return res.json({
        serviceable: serviceability.courier_companies.length > 0,
        codAvailable: serviceability.courier_companies.some((c: any) => c.cod === '1'),
        deliveryDays: serviceability.courier_companies.length > 0 
          ? Math.min(...serviceability.courier_companies.map((c: any) => parseInt(courier.etd_days) || 999))
          : null,
        availableCouriers: serviceability.courier_companies.map((c: any) => ({
          name: c.courier_name,
          etdDays: c.etd_days,
          codAvailable: c.cod === '1'
        }))
      });
    }

    res.status(404).json({ serviceable: false });
  } catch (error) {
    console.error('Error checking PIN code serviceability:', error);
    res.status(500).json({ error: 'Failed to check serviceability' });
  }
}

// Get user's order tracking information
export async function getUserOrderTracking(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        shippingTracking: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get real-time tracking from Shiprocket if tracking ID exists
    let trackingDetails = null;
    if (order.shippingTracking) {
      const response = await fetch(`${SHIPROCKET_API_URL}/courier/track/shipment/${order.shippingTracking.trackingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SHIPROCKET_TOKEN}`
        }
      });

      const result = await response.json() as ShiprocketTrackingResponse;
      
      if (result.status === 200 && result.tracking_data.length > 0) {
        const tracking = result.tracking_data[0];
        trackingDetails = {
          trackingId: order.shippingTracking.trackingId,
          carrier: tracking.courier_name,
          status: tracking.status[tracking.status.length - 1].status_code,
          statusText: tracking.status[tracking.status.length - 1].status,
          checkpoints: tracking.status.map(checkpoint => ({
            status: checkpoint.status_code,
            statusText: checkpoint.status,
            location: checkpoint.location,
            timestamp: checkpoint.status_date,
            description: checkpoint.status_remarks
          })),
          estimatedDelivery: tracking.etd,
          trackingUrl: result.tracking_url
        };

        // Update local tracking with latest data
        await prisma.shippingTracking.update({
          where: { id: order.shippingTracking.id },
          data: {
            status: tracking.status[tracking.status.length - 1].status_code,
            checkpoints: JSON.stringify(tracking.status.map(checkpoint => ({
              status: checkpoint.status_code,
              location: checkpoint.location,
              timestamp: checkpoint.status_date,
              description: checkpoint.status_remarks
            }))),
            estimatedDelivery: tracking.etd ? new Date(tracking.etd) : undefined
          }
        });
      }
    }

    res.json({
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        shippingTracking: trackingDetails || order.shippingTracking
      }
    });
  } catch (error) {
    console.error('Error getting order tracking:', error);
    res.status(500).json({ error: 'Failed to get tracking information' });
  }
}

// Admin: Get all shipments
export async function getAllShipments(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId || req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [shipments, total] = await Promise.all([
      prisma.shippingTracking.findMany({
        where,
        skip,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              total: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.shippingTracking.count({ where })
    ]);

    const parsedShipments = shipments.map(shipment => ({
      ...shipment,
      checkpoints: shipment.checkpoints ? JSON.parse(shipment.checkpoints as string) : []
    }));

    res.json({
      shipments: parsedShipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all shipments:', error);
    res.status(500).json({ error: 'Failed to get shipments' });
  }
}