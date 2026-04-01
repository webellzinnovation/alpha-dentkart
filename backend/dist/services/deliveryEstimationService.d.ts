export interface DeliveryEstimationRequest {
    userId?: string;
    pincode: string;
    items: Array<{
        productId: string;
        quantity: number;
        weight?: number;
        dimensions?: {
            length: number;
            width: number;
            height: number;
        };
    }>;
    shippingMethod?: 'standard' | 'express' | 'overnight';
    address?: {
        city: string;
        state: string;
        country: string;
    };
}
export interface DeliveryEstimationResponse {
    success: boolean;
    estimation?: {
        deliveryDate: Date;
        deliveryDays: number;
        deliveryWindow: {
            start: Date;
            end: Date;
        };
        shippingOptions: Array<{
            method: string;
            cost: number;
            estimatedDays: number;
            deliveryDate: Date;
            guaranteed: boolean;
        }>;
        pincode: {
            city: string;
            state: string;
            serviceable: boolean;
            deliveryDays: number;
            codAvailable: boolean;
        };
        weatherDelay: boolean;
        weatherInfo?: {
            condition: string;
            delayDays: number;
        };
    };
    error?: string;
}
export declare class DeliveryEstimationService {
    private readonly baseDeliveryDays;
    private readonly shippingRates;
    constructor();
    calculateDeliveryEstimation(request: DeliveryEstimationRequest): Promise<DeliveryEstimationResponse>;
    private validatePincode;
    private getProductWeight;
    private calculateTotalDimensions;
    private calculateDeliveryDate;
    private calculateShippingOptions;
    private calculateShippingCost;
    private checkWeatherDelays;
    private storeDeliveryEstimation;
    getDeliveryHistory(userId: string, limit?: number): Promise<{
        estimations: any[];
        actualDeliveries: any[];
    }>;
    private calculateAccuracy;
    getDeliveryAnalytics(userId: string): Promise<{
        totalEstimations: number;
        averageAccuracy: number;
        mostUsedPincode: string;
        preferredShippingMethod: string;
        seasonalTrends: Array<{
            month: string;
            averageDeliveryDays: number;
            orderCount: number;
        }>;
    }>;
}
export default DeliveryEstimationService;
//# sourceMappingURL=deliveryEstimationService.d.ts.map