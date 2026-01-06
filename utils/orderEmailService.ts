// Order status email notification service
import { SMTPSettings } from './emailService';
import { Order } from '../types';

export interface OrderStatusEmailData {
    to: string;
    customerName: string;
    orderId: string;
    orderStatus: Order['status'];
    orderTotal: number;
    orderDate: string;
}

/**
 * Sends order status update email to customer
 */
export async function sendOrderStatusEmail(
    emailData: OrderStatusEmailData,
    smtpSettings: SMTPSettings
): Promise<{ success: boolean; message: string }> {
    try {
        // For now, this is a placeholder that logs the email
        // In production, this would call a backend API to send the email

        console.log('📧 Sending order status email:', {
            to: emailData.to,
            subject: `Order #${emailData.orderId} - Status Update: ${emailData.orderStatus}`,
            status: emailData.orderStatus,
            smtpHost: smtpSettings.host
        });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            message: `Order status email sent to ${emailData.to}`
        };
    } catch (error: any) {
        console.error('Error sending order status email:', error);
        return {
            success: false,
            message: error.message || 'Failed to send order status email'
        };
    }
}

/**
 * Get email template for order status update
 */
export function getOrderStatusEmailHTML(
    customerName: string,
    orderId: string,
    orderStatus: Order['status'],
    orderTotal: number,
    orderDate: string
): string {
    // Status-specific messages and colors
    const statusConfig: Record<Order['status'], { message: string; color: string; icon: string }> = {
        'Processing': {
            message: 'Your order is being processed and will be shipped soon.',
            color: '#3b82f6',
            icon: '📦'
        },
        'Shipped': {
            message: 'Your order has been shipped and is on its way to you!',
            color: '#8b5cf6',
            icon: '🚚'
        },
        'Delivered': {
            message: 'Your order has been delivered successfully!',
            color: '#10b981',
            icon: '✅'
        },
        'Cancelled': {
            message: 'Your order has been cancelled.',
            color: '#ef4444',
            icon: '❌'
        }
    };

    const config = statusConfig[orderStatus];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Alpha Dentkart</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Order Status Update</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Hi ${customerName},</h2>
              
              <!-- Status Badge -->
              <div style="background-color: ${config.color}15; border-left: 4px solid ${config.color}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <div style="font-size: 32px; margin-bottom: 10px;">${config.icon}</div>
                <h3 style="color: ${config.color}; margin: 0 0 10px 0; font-size: 20px;">Order ${orderStatus}</h3>
                <p style="color: #666666; margin: 0; font-size: 16px;">${config.message}</p>
              </div>
              
              <!-- Order Details -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 15px 0; color: #333333;">Order Details</h4>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #666666; font-size: 14px;">Order ID:</td>
                    <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="color: #666666; font-size: 14px;">Order Date:</td>
                    <td style="color: #333333; font-size: 14px; text-align: right;">${orderDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #666666; font-size: 14px;">Total Amount:</td>
                    <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">₹${orderTotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="color: #666666; font-size: 14px;">Status:</td>
                    <td style="text-align: right;">
                      <span style="background-color: ${config.color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">${orderStatus}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              ${orderStatus === 'Shipped' ? `
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Your order is on its way! You can track your shipment using the tracking information provided separately.
              </p>
              ` : ''}
              
              ${orderStatus === 'Delivered' ? `
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Thank you for shopping with us! We hope you enjoy your purchase. If you have any questions or concerns, please don't hesitate to contact us.
              </p>
              ` : ''}
              
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                If you have any questions about your order, please contact our customer support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Alpha Dentkart. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
