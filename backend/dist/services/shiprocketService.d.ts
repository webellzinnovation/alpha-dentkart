export declare class ShiprocketService {
    private token;
    constructor();
    authenticate(): Promise<void>;
    validateIndianPincode(pincode: string): boolean;
    checkPincodeServiceability(pincode: string): Promise<{
        is_serviceable: boolean;
        city: string;
        state: string;
        postal_code: string;
        service_type: string;
    }>;
    getShippingRates(pickupPostcode: string, deliveryPostcode: string, weight: number, cod: boolean): Promise<{
        courier_name: string;
        courier_id: number;
        estimated_delivery_days: number;
        freight_charge: number;
        cod_charges: number;
        total: number;
        is_surface: boolean;
        is_reverse: boolean;
        delivery_eta: string;
    }[]>;
    getEstimatedDelivery(pickupPostcode: string, deliveryPostcode: string, weight: number): Promise<{
        estimated_delivery_date: string;
        courier_name: string;
    }>;
    createOrderRequest(orderData: any): {
        order_id: any;
        order_date: Date;
        pickup_location: string;
        billing_customer_name: any;
        billing_last_name: string;
        billing_address: any;
        billing_city: any;
        billing_pincode: any;
        billing_state: any;
        billing_country: string;
        billing_email: any;
        billing_phone: any;
        shipping_is_billing: boolean;
        order_items: any;
        payment_method: string;
        sub_total: any;
        length: number;
        width: number;
        height: number;
        weight: number;
    };
    createOrder(shiprocketOrderData: any): Promise<{
        status_code: number;
        message: string;
        order_id: number;
        shipment_id: number;
        awb_code: string;
        courier_name: string;
        estimated_delivery: string;
        track_url: string;
    }>;
    cancelOrder(shiprocketOrderIds: string[]): Promise<{
        status_code: number;
        message: string;
    }>;
    trackShipment(awb: string): Promise<{
        tracking_data: {
            awb_number: string;
            courier_name: string;
            current_status: string;
            delivered_date: string;
            estimated_delivery: string;
            track_url: string;
            shipment_track: never[];
        };
    }>;
    trackOrder(orderId: string): Promise<{
        tracking_data: {
            awb_number: string;
            courier_name: string;
            current_status: string;
            delivered_date: string;
            estimated_delivery: string;
            track_url: string;
            shipment_track: never[];
        };
    }>;
    getAvailableCouriers(pickupPostcode: string, deliveryPostcode: string, weight: number): Promise<{
        courier_name: string;
        rate: number;
        etd: string;
    }[]>;
    generateAWB(shipmentId: string): Promise<{
        awb_code: string;
        courier_company_id: number;
        courier_name: string;
    }>;
    requestPickup(shipmentId: string): Promise<{
        pickup_scheduled_date: string;
    }>;
    generateManifest(shipmentId: string): Promise<{
        manifest_url: string;
    }>;
    printManifest(shipmentId: string): Promise<{
        manifest_url: string;
    }>;
    generateLabel(shipmentId: string): Promise<{
        label_url: string;
    }>;
}
declare const _default: ShiprocketService;
export default _default;
//# sourceMappingURL=shiprocketService.d.ts.map