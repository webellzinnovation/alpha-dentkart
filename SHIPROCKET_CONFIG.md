# Shiprocket Configuration for Alpha Dentkart

## Environment Variables

Add these to your `.env` file in the backend directory:

```env
# Shiprocket API Credentials
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password

# Shiprocket Configuration
SHIPROCKET_PICKUP_PINCODE=110001  # Delhi pickup location
SHIPROCKET_PICKUP_LOCATION=Primary
SHIPROCKET_CHANNEL_ID=ALPHA_DENTKART

# Shipping Configuration
FREE_SHIPPING_THRESHOLD=5000  # ₹5000 for free shipping
DEFAULT_PACKAGE_WEIGHT=0.5      # kg
DEFAULT_PACKAGE_LENGTH=10        # cm
DEFAULT_PACKAGE_BREADTH=8       # cm
DEFAULT_PACKAGE_HEIGHT=5         # cm
```

## Shiprocket Account Setup

### 1. Account Requirements
- Business email and password
- Pickup location details
- Bank account for COD settlements
- GST documentation (if applicable)

### 2. Required Information
- **Pickup Address**: Your primary warehouse/store location
- **Bank Account**: For COD and prepaid settlements
- **GST Details**: Required for Indian businesses
- **Courier Partners**: Choose preferred courier services

### 3. Test Mode
Shiprocket provides test mode for development:
- Use test API credentials
- Test pincodes for serviceability
- Simulate order creation and tracking

## API Endpoints

### Public Endpoints (No Authentication)
```
POST /api/shiprocket/check-pincode
POST /api/shiprocket/get-rates
POST /api/shiprocket/estimate-delivery
POST /api/shiprocket/calculate-charges
POST /api/shiprocket/available-couriers
```

### Protected Endpoints (Authentication Required)
```
POST /api/shiprocket/create-order
POST /api/shiprocket/track
POST /api/shiprocket/track-order
POST /api/shiprocket/cancel
```

## Integration Examples

### Check Pincode Serviceability
```javascript
const response = await fetch('/api/shiprocket/check-pincode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pincode: '110001' })
});

const result = await response.json();
console.log(result);
// Output: { success: true, isServiceable: true, city: 'Delhi', state: 'Delhi' }
```

### Calculate Shipping Charges
```javascript
const response = await fetch('/api/shiprocket/calculate-charges', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deliveryPincode: '110001',
    cartTotal: 3500,
    weight: 0.5
  })
});

const result = await response.json();
console.log(result);
// Output: { success: true, shippingCharges: 150, codCharges: 30, totalCharges: 180 }
```

### Create Order
```javascript
const orderData = {
  id: 'ORDER-12345',
  items: [
    {
      name: 'Dental Drill Pro',
      id: 'PROD-001',
      quantity: 2,
      price: 2500,
      weight: 0.5
    }
  ],
  customerInfo: {
    name: 'Dr. John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    address: {
      name: 'Dr. John Doe',
      phone: '9876543210',
      address: '123 Medical Street',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    }
  },
  total: 5000,
  shippingCharges: 0,
  paymentMethod: 'prepaid'
};

const response = await fetch('/api/shiprocket/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken
  },
  body: JSON.stringify({ orderData })
});
```

## Shipping Rules for Alpha Dentkart

### 1. Free Shipping
- Orders above ₹5000 get free shipping
- Automatically applied during checkout
- All India serviceability

### 2. COD Charges
- COD charges: ₹30-50 based on courier
- Only available for orders below ₹10,000
- Major metro cities优先

### 3. Delivery Timeline
- **Metro Cities**: 2-3 days
- **State Capitals**: 3-5 days
- **Other Cities**: 5-7 days
- **Remote Areas**: 7-10 days

### 4. Package Dimensions
- **Small Products**: 10x8x5 cm, 0.5 kg
- **Medium Products**: 15x10x8 cm, 1 kg
- **Large Equipment**: 30x20x15 cm, 2-5 kg

## Error Handling

### Common Error Codes
- **400**: Invalid input parameters
- **401**: Authentication failed
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Internal server error

### Error Response Format
```json
{
  "success": false,
  "message": "Pincode not serviceable",
  "error": "Invalid pincode format"
}
```

## Testing

### Test Pincodes
- Delhi: 110001, 110002, 110003
- Mumbai: 400001, 400002, 400003
- Bangalore: 560001, 560002, 560003
- Chennai: 600001, 600002, 600003

### Test Orders
1. Create test order with above pincodes
2. Track order status
3. Test cancellation workflow
4. Verify COD charges

## Production Checklist

- [ ] Production Shiprocket credentials
- [ ] Pickup location configured
- [ ] Bank account verified
- [ ] GST details updated
- [ ] Courier partners activated
- [ ] Webhook URLs configured
- [ ] Rate limits tested
- [ ] Error handling verified
- [ ] Tracking integration tested
- [ ] Customer notifications enabled

## Rate Limits

- **Public APIs**: 100 requests per hour
- **Protected APIs**: 1000 requests per hour
- **Authentication**: 24 hours token expiry

## Webhooks

Configure webhooks in Shiprocket dashboard for:
- Order status updates
- Shipment tracking updates
- Delivery confirmations
- Pickup confirmations

## Support

- **Shiprocket Support**: support@shiprocket.in
- **API Documentation**: https://apiv2.shiprocket.in/
- **Status Page**: https://status.shiprocket.in/
- **Developer Portal**: https://developer.shiprocket.in/