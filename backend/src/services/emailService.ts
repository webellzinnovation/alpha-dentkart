import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

interface OrderData {
    customerName: string;
    customerEmail: string | null;
    total: number;
    items: any[];
    shippingAddress?: any;
    paymentMethod?: string;
    paymentStatus?: string;
    status?: string;
}

export async function sendOrderConfirmationEmail(
    orderId: string,
    customerEmail: string | null,
    orderData: OrderData
): Promise<void> {
    if (!customerEmail) {
        logger.warn('No customer email provided, skipping order confirmation email');
        return;
    }

    const itemsList = orderData.items
        .map((item: any) => `<li>${item.name || 'Product'} x${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}</li>`)
        .join('');

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #DD3B5F; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
                <p>Dear <strong>${orderData.customerName}</strong>,</p>
                <p>Thank you for your order! We're pleased to confirm that your order has been placed successfully.</p>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Details</h3>
                    <p><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
                    <p><strong>Order Status:</strong> ${orderData.status || 'Processing'}</p>
                    <p><strong>Payment Method:</strong> ${orderData.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}</p>
                    <p><strong>Payment Status:</strong> ${orderData.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Items Ordered</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${itemsList}
                    </ul>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
                    <p style="text-align: right; font-size: 18px;">
                        <strong>Total: ₹${(orderData.total || 0).toLocaleString('en-IN')}</strong>
                    </p>
                </div>
                
                ${orderData.shippingAddress ? `
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Shipping Address</h3>
                    <p>${orderData.shippingAddress.name}</p>
                    <p>${orderData.shippingAddress.street}</p>
                    <p>${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.zip}</p>
                    <p>Phone: ${orderData.shippingAddress.phone}</p>
                </div>
                ` : ''}
                
                <p>We'll notify you as your order progresses through processing, shipping, and delivery.</p>
                <p>Thank you for shopping with <strong>Alpha Dentkart</strong>!</p>
            </div>
            <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Alpha Dentkart. All rights reserved.</p>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Alpha Dentkart" <noreply@alphadentkart.com>',
            to: customerEmail,
            subject: `Order Confirmed - #${orderId.slice(0, 8).toUpperCase()} | Alpha Dentkart`,
            html: htmlContent,
        });
        logger.info('Order confirmation email sent', { orderId, customerEmail });
    } catch (error) {
        logger.error('Failed to send order confirmation email', { error, orderId, customerEmail });
        throw error;
    }
}

export async function sendAdminOrderNotification(
    orderId: string,
    orderData: OrderData
): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        logger.warn('Admin email not configured');
        return;
    }

    const itemsList = orderData.items
        .map((item: any) => `<li>${item.name || 'Product'} x${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}</li>`)
        .join('');

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="background: #DD3B5F; color: white; padding: 15px; margin: 0;">New Order Received!</h2>
            <div style="padding: 20px; background: #f9f9f9;">
                <p><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
                <p><strong>Customer:</strong> ${orderData.customerName}</p>
                <p><strong>Email:</strong> ${orderData.customerEmail}</p>
                <p><strong>Total:</strong> ₹${(orderData.total || 0).toLocaleString('en-IN')}</p>
                <p><strong>Payment:</strong> ${orderData.paymentMethod === 'razorpay' ? 'Online' : 'COD'}</p>
                
                <h3>Items:</h3>
                <ul>${itemsList}</ul>
                
                ${orderData.shippingAddress ? `
                <h3>Shipping Address:</h3>
                <p>${orderData.shippingAddress.name}<br>
                ${orderData.shippingAddress.street}<br>
                ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.zip}</p>
                ` : ''}
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Alpha Dentkart" <noreply@alphadentkart.com>',
            to: adminEmail,
            subject: `New Order - #${orderId.slice(0, 8).toUpperCase()} | Alpha Dentkart`,
            html: htmlContent,
        });
        logger.info('Admin order notification sent', { orderId });
    } catch (error) {
        logger.error('Failed to send admin order notification', { error, orderId });
    }
}
