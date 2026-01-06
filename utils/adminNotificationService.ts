import { AdminNotification, Order, Product } from '../types';

/**
 * Admin Notification Service
 * Manages notifications for admin dashboard (orders, inventory, customers, system)
 */

const STORAGE_KEY = 'adminNotifications';

/**
 * Get all admin notifications from localStorage
 */
export function getAllAdminNotifications(): AdminNotification[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading admin notifications:', error);
        return [];
    }
}

/**
 * Save admin notifications to localStorage
 */
function saveAdminNotifications(notifications: AdminNotification[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving admin notifications:', error);
    }
}

/**
 * Generate unique notification ID
 */
function generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new admin notification
 */
export function addAdminNotification(
    type: 'order' | 'inventory' | 'customer' | 'system',
    category: string,
    title: string,
    message: string,
    link?: string,
    data?: any
): AdminNotification {
    const notification: AdminNotification = {
        id: generateNotificationId(),
        type,
        category,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        link,
        data
    };

    const notifications = getAllAdminNotifications();
    notifications.unshift(notification); // Add to beginning

    // Keep only last 100 notifications
    if (notifications.length > 100) {
        notifications.splice(100);
    }

    saveAdminNotifications(notifications);
    return notification;
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId: string): void {
    const notifications = getAllAdminNotifications();
    const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
    );
    saveAdminNotifications(updated);
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): void {
    const notifications = getAllAdminNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveAdminNotifications(updated);
}

/**
 * Delete a notification
 */
export function deleteNotification(notificationId: string): void {
    const notifications = getAllAdminNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    saveAdminNotifications(filtered);
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
    saveAdminNotifications([]);
}

/**
 * Get unread notification count
 */
export function getUnreadCount(): number {
    const notifications = getAllAdminNotifications();
    return notifications.filter(n => !n.read).length;
}

/**
 * Get notifications by type
 */
export function getNotificationsByType(type: 'order' | 'inventory' | 'customer' | 'system'): AdminNotification[] {
    const notifications = getAllAdminNotifications();
    return notifications.filter(n => n.type === type);
}

// ============================================
// Notification Creators for Specific Events
// ============================================

/**
 * Create notification for new order
 */
export function notifyNewOrder(order: Order): void {
    addAdminNotification(
        'order',
        'new-order',
        'New Order Received',
        `Order #${order.id} placed by ${order.customerName || 'Customer'}`,
        '/admin?tab=orders',
        { orderId: order.id }
    );
}

/**
 * Create notification for order status change
 */
export function notifyOrderStatusChange(orderId: string, newStatus: string, customerName?: string): void {
    const statusMessages: Record<string, string> = {
        'Processing': 'is being processed',
        'Shipped': 'has been shipped',
        'Delivered': 'has been delivered',
        'Cancelled': 'was cancelled'
    };

    addAdminNotification(
        'order',
        'status-change',
        `Order ${newStatus}`,
        `Order #${orderId} ${statusMessages[newStatus] || 'status updated'}`,
        '/admin?tab=orders',
        { orderId, status: newStatus }
    );
}

/**
 * Create notification for low stock
 */
export function notifyLowStock(product: Product): void {
    addAdminNotification(
        'inventory',
        'low-stock',
        'Low Stock Alert',
        `${product.name} is running low (${product.stock} units left)`,
        '/admin?tab=products',
        { productId: product.id, stock: product.stock }
    );
}

/**
 * Create notification for out of stock
 */
export function notifyOutOfStock(product: Product): void {
    addAdminNotification(
        'inventory',
        'out-of-stock',
        'Out of Stock',
        `${product.name} is now out of stock`,
        '/admin?tab=products',
        { productId: product.id }
    );
}

/**
 * Create notification for stock restocked
 */
export function notifyStockRestocked(product: Product, newStock: number): void {
    addAdminNotification(
        'inventory',
        'restocked',
        'Product Restocked',
        `${product.name} restocked with ${newStock} units`,
        '/admin?tab=products',
        { productId: product.id, stock: newStock }
    );
}

/**
 * Create notification for new customer registration
 */
export function notifyNewCustomer(customerName: string, customerEmail: string): void {
    addAdminNotification(
        'customer',
        'new-registration',
        'New Customer Registered',
        `${customerName} (${customerEmail}) just registered`,
        '/admin?tab=customers',
        { email: customerEmail }
    );
}

/**
 * Create notification for customer verification pending
 */
export function notifyVerificationPending(customerName: string, customerEmail: string): void {
    addAdminNotification(
        'customer',
        'verification-pending',
        'Verification Pending',
        `${customerName} is waiting for account verification`,
        '/admin?tab=customers',
        { email: customerEmail }
    );
}

/**
 * Create notification for payment received
 */
export function notifyPaymentReceived(orderId: string, amount: number): void {
    addAdminNotification(
        'order',
        'payment-received',
        'Payment Received',
        `Payment of ₹${amount.toLocaleString()} received for order #${orderId}`,
        '/admin?tab=orders',
        { orderId, amount }
    );
}

/**
 * Create notification for refund requested
 */
export function notifyRefundRequested(orderId: string, customerName?: string): void {
    addAdminNotification(
        'order',
        'refund-requested',
        'Refund Requested',
        `Refund requested for order #${orderId}${customerName ? ` by ${customerName}` : ''}`,
        '/admin?tab=orders',
        { orderId }
    );
}

/**
 * Create notification for system error
 */
export function notifySystemError(title: string, message: string): void {
    addAdminNotification(
        'system',
        'error',
        title,
        message,
        undefined,
        undefined
    );
}

/**
 * Create notification for SMTP connection issue
 */
export function notifySMTPError(errorMessage: string): void {
    addAdminNotification(
        'system',
        'smtp-error',
        'Email Service Error',
        `SMTP connection failed: ${errorMessage}`,
        '/admin?tab=settings',
        undefined
    );
}

/**
 * Create notification for stock notification subscribers
 */
export function notifyStockSubscribers(productName: string, subscriberCount: number): void {
    addAdminNotification(
        'inventory',
        'stock-subscribers',
        'Stock Notification Subscribers',
        `${subscriberCount} customer(s) waiting for ${productName} to be restocked`,
        '/admin?tab=stock-notifications',
        { productName, subscriberCount }
    );
}

/**
 * Get relative time string (e.g., "2 minutes ago")
 */
export function getRelativeTime(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return then.toLocaleDateString();
}

/**
 * Get notification icon based on type and category
 */
export function getNotificationIcon(type: string, category: string): string {
    const icons: Record<string, Record<string, string>> = {
        order: {
            'new-order': 'fa-shopping-cart',
            'status-change': 'fa-truck',
            'payment-received': 'fa-credit-card',
            'refund-requested': 'fa-undo',
            default: 'fa-shopping-bag'
        },
        inventory: {
            'low-stock': 'fa-exclamation-triangle',
            'out-of-stock': 'fa-times-circle',
            'restocked': 'fa-box',
            'stock-subscribers': 'fa-bell',
            default: 'fa-boxes'
        },
        customer: {
            'new-registration': 'fa-user-plus',
            'verification-pending': 'fa-user-clock',
            default: 'fa-users'
        },
        system: {
            'error': 'fa-exclamation-circle',
            'smtp-error': 'fa-envelope-open-text',
            default: 'fa-cog'
        }
    };

    return icons[type]?.[category] || icons[type]?.default || 'fa-bell';
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
        order: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        inventory: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
        customer: 'text-green-600 bg-green-50 dark:bg-green-900/20',
        system: 'text-red-600 bg-red-50 dark:bg-red-900/20'
    };

    return colors[type] || 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
}
