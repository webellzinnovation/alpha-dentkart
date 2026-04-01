"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.get('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderDoc = await firebase_1.db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = orderDoc.data();
        // Generate invoice HTML
        const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #${orderId.slice(0, 8).toUpperCase()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #DD3B5F; }
        .invoice-title { font-size: 18px; color: #666; margin-top: 5px; }
        .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table th, .details-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .details-table th { background: #f5f5f5; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Alpha Dentkart</div>
        <div class="invoice-title">INVOICE</div>
    </div>
    
    <div class="details">
        <div>
            <strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}<br>
            <strong>Date:</strong> ${order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
        </div>
        <div>
            <strong>Customer:</strong> ${order?.customerName || 'Guest'}<br>
            <strong>Email:</strong> ${order?.customerEmail || 'N/A'}
        </div>
    </div>
    
    <table class="details-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${(order?.items || []).map((item) => `
                <tr>
                    <td>${item.name || 'Product'}</td>
                    <td>${item.quantity}</td>
                    <td>₹${(item.price || 0).toLocaleString('en-IN')}</td>
                    <td>₹${((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="total">
        <div>Subtotal: ₹${(order?.total || 0).toLocaleString('en-IN')}</div>
        ${order?.couponDiscount ? `<div>Discount: -₹${(order.couponDiscount).toLocaleString('en-IN')}</div>` : ''}
        <div>Total: ₹${((order?.total || 0) - (order?.couponDiscount || 0)).toLocaleString('en-IN')}</div>
    </div>
    
    <div class="footer">
        <p>Thank you for shopping with Alpha Dentkart!</p>
        <p>For queries: support@alphadentkart.com</p>
    </div>
</body>
</html>
        `;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId.slice(0, 8)}.html`);
        res.send(invoiceHtml);
    }
    catch (error) {
        logger_1.default.error('Generate invoice error', { error, orderId: req.params.id });
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
});
exports.default = router;
//# sourceMappingURL=invoice.js.map