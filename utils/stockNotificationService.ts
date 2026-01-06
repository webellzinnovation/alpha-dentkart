import { Product, StockNotification } from '../types';

interface SMTPSettings {
    host: string;
    port: number;
    user: string;
    pass: string;
    encryption: 'TLS' | 'SSL' | 'None';
}

/**
 * Stock Notification Service
 * Manages customer subscriptions for out-of-stock product notifications
 */

// Local storage key for stock notifications
const STORAGE_KEY = 'stockNotifications';

/**
 * Get all stock notifications from localStorage
 */
export function getAllStockNotifications(): StockNotification[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading stock notifications:', error);
        return [];
    }
}

/**
 * Save stock notifications to localStorage
 */
function saveStockNotifications(notifications: StockNotification[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving stock notifications:', error);
    }
}

/**
 * Subscribe user to product stock notifications
 */
export function subscribeToProduct(
    productId: number,
    productName: string,
    userEmail: string,
    userName: string
): { success: boolean; message: string } {
    try {
        const notifications = getAllStockNotifications();

        // Check if already subscribed
        const existing = notifications.find(
            n => n.productId === productId && n.userEmail === userEmail
        );

        if (existing) {
            return {
                success: false,
                message: 'You are already subscribed to notifications for this product'
            };
        }

        // Add new subscription
        const newNotification: StockNotification = {
            productId,
            productName,
            userEmail,
            userName,
            subscribedDate: new Date().toISOString(),
            notified: false
        };

        notifications.push(newNotification);
        saveStockNotifications(notifications);

        return {
            success: true,
            message: `You'll be notified when ${productName} is back in stock!`
        };
    } catch (error: any) {
        console.error('Error subscribing to product:', error);
        return {
            success: false,
            message: error.message || 'Failed to subscribe to notifications'
        };
    }
}

/**
 * Unsubscribe user from product stock notifications
 */
export function unsubscribeFromProduct(
    productId: number,
    userEmail: string
): { success: boolean; message: string } {
    try {
        const notifications = getAllStockNotifications();
        const filtered = notifications.filter(
            n => !(n.productId === productId && n.userEmail === userEmail)
        );

        if (filtered.length === notifications.length) {
            return {
                success: false,
                message: 'No subscription found for this product'
            };
        }

        saveStockNotifications(filtered);

        return {
            success: true,
            message: 'Successfully unsubscribed from notifications'
        };
    } catch (error: any) {
        console.error('Error unsubscribing from product:', error);
        return {
            success: false,
            message: error.message || 'Failed to unsubscribe'
        };
    }
}

/**
 * Check if user is subscribed to a product
 */
export function isSubscribedToProduct(productId: number, userEmail: string): boolean {
    const notifications = getAllStockNotifications();
    return notifications.some(
        n => n.productId === productId && n.userEmail === userEmail && !n.notified
    );
}

/**
 * Get all subscribers for a specific product
 */
export function getSubscribersForProduct(productId: number): StockNotification[] {
    const notifications = getAllStockNotifications();
    return notifications.filter(n => n.productId === productId && !n.notified);
}

/**
 * Get subscriber count for a product
 */
export function getSubscriberCount(productId: number): number {
    return getSubscribersForProduct(productId).length;
}

/**
 * Mark notifications as sent for a product
 */
export function markNotificationsAsSent(productId: number): void {
    const notifications = getAllStockNotifications();
    const updated = notifications.map(n =>
        n.productId === productId ? { ...n, notified: true } : n
    );
    saveStockNotifications(updated);
}

/**
 * Send stock available email to a subscriber
 */
export async function sendStockAvailableEmail(
    product: Product,
    subscriber: StockNotification,
    smtpSettings: SMTPSettings
): Promise<{ success: boolean; message: string }> {
    try {
        const emailHTML = getStockAvailableEmailHTML(subscriber.userName, product);

        console.log('📧 Sending stock available email:', {
            to: subscriber.userEmail,
            product: product.name,
            smtpHost: smtpSettings.host
        });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            message: `Stock notification sent to ${subscriber.userEmail}`
        };
    } catch (error: any) {
        console.error('Error sending stock available email:', error);
        return {
            success: false,
            message: error.message || 'Failed to send stock notification'
        };
    }
}

/**
 * Send notifications to all subscribers of a product
 */
export async function notifyAllSubscribers(
    product: Product,
    smtpSettings: SMTPSettings
): Promise<{ success: boolean; sent: number; failed: number }> {
    const subscribers = getSubscribersForProduct(product.id);
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
        const result = await sendStockAvailableEmail(product, subscriber, smtpSettings);
        if (result.success) {
            sent++;
        } else {
            failed++;
        }
    }

    // Mark all as notified
    if (sent > 0) {
        markNotificationsAsSent(product.id);
    }

    return { success: sent > 0, sent, failed };
}

/**
 * Stock available email HTML template
 */
export function getStockAvailableEmailHTML(userName: string, product: Product): string {
    const productUrl = `${window.location.origin}/product/${product.id}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Back in Stock!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                            <div style="background-color: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">🎉</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Back in Stock!</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">The product you wanted is available again</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Hi ${userName},
                            </p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Great news! The product you were waiting for is now back in stock and ready to order.
                            </p>
                            
                            <!-- Product Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="120" style="vertical-align: top;">
                                                    <img src="${product.image}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; display: block;">
                                                </td>
                                                <td style="padding-left: 20px; vertical-align: top;">
                                                    <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">${product.name}</h2>
                                                    <p style="color: #666666; font-size: 14px; margin: 0 0 15px 0; line-height: 1.4;">${product.description || 'Premium quality dental equipment'}</p>
                                                    <div style="display: flex; align-items: center; gap: 10px;">
                                                        <span style="color: #10b981; font-size: 24px; font-weight: bold;">₹${product.price.toLocaleString()}</span>
                                                        ${product.originalPrice ? `<span style="color: #999999; font-size: 16px; text-decoration: line-through;">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                                                    </div>
                                                    <div style="margin-top: 10px;">
                                                        <span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                                                            ✓ In Stock
                                                        </span>
                                                        ${product.stock ? `<span style="color: #666666; font-size: 12px; margin-left: 10px;">${product.stock} available</span>` : ''}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${productUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                            Shop Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                                    ⚡ <strong>Hurry!</strong> This product is in high demand. Order now to avoid missing out again.
                                </p>
                            </div>
                            
                            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                                You received this email because you subscribed to stock notifications for this product. If you no longer wish to receive these notifications, you can manage your preferences in your account settings.
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
