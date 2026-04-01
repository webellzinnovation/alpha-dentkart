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
export declare function sendOrderConfirmationEmail(orderId: string, customerEmail: string | null, orderData: OrderData): Promise<void>;
export declare function sendAdminOrderNotification(orderId: string, orderData: OrderData): Promise<void>;
export {};
//# sourceMappingURL=emailService.d.ts.map