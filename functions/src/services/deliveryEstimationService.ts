import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';

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

export class DeliveryEstimationService {
  private readonly baseDeliveryDays: Record<string, number> = {
    'standard': 3,
    'express': 2,
    'overnight': 1
  };

  private readonly shippingRates: Record<string, number> = {
    'standard': 1.0,
    'express': 1.5,
    'overnight': 2.0
  };

  constructor() {
    // Empty constructor
  }

  async calculateDeliveryEstimation(request: DeliveryEstimationRequest): Promise<DeliveryEstimationResponse> {
    try {
      const pincodeValidation = await this.validatePincode(request.pincode);
      if (!pincodeValidation.isValid) {
        return { success: false, error: pincodeValidation.error || 'Invalid pincode' };
      }

      let totalWeight = 0;
      for (const item of request.items) {
        const itemWeight = item.weight || await this.getProductWeight(item.productId);
        totalWeight += itemWeight * item.quantity;
      }

      const totalDimensions = this.calculateTotalDimensions(request.items);
      const baseDays = this.baseDeliveryDays[request.shippingMethod || 'standard'];
      const now = new Date();
      const deliveryDate = this.calculateDeliveryDate(now, baseDays, pincodeValidation.deliveryDays);

      const weatherInfo = await this.checkWeatherDelays(pincodeValidation.city, pincodeValidation.state);
      const weatherDelay = weatherInfo.delayDays > 0;
      const finalDeliveryDate = weatherDelay
        ? new Date(deliveryDate.getTime() + (weatherInfo.delayDays * 24 * 60 * 60 * 1000))
        : deliveryDate;

      const shippingOptions = await this.calculateShippingOptions(
        request,
        totalWeight,
        totalDimensions,
        pincodeValidation
      );

      const deliveryWindow = {
        start: new Date(finalDeliveryDate.getTime() - (2 * 60 * 60 * 1000)),
        end: new Date(finalDeliveryDate.getTime() + (2 * 60 * 60 * 1000))
      };

      const estimation = {
        deliveryDate: finalDeliveryDate,
        deliveryDays: baseDays + (weatherInfo.delayDays || 0),
        deliveryWindow,
        shippingOptions,
        pincode: pincodeValidation,
        weatherDelay,
        weatherInfo: weatherDelay ? weatherInfo : undefined
      };

      if (request.userId) {
        await this.storeDeliveryEstimation(request.userId, request, estimation);
      }

      return { success: true, estimation };
    } catch (error) {
      logger.error('Error calculating delivery estimation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  }

  private async validatePincode(pincode: string): Promise<{
    isValid: boolean;
    city: string;
    state: string;
    serviceable: boolean;
    deliveryDays: number;
    codAvailable: boolean;
    error?: string;
  }> {
    try {
      const validPincodes: Record<string, any> = {
        '600001': { city: 'Chennai', state: 'Tamil Nadu', deliveryDays: 2, codAvailable: true },
        '600002': { city: 'Chennai', state: 'Tamil Nadu', deliveryDays: 2, codAvailable: true },
        '400001': { city: 'Mumbai', state: 'Maharashtra', deliveryDays: 3, codAvailable: true },
        '400002': { city: 'Mumbai', state: 'Maharashtra', deliveryDays: 3, codAvailable: true },
        '110001': { city: 'Delhi', state: 'Delhi', deliveryDays: 4, codAvailable: true },
        '560001': { city: 'Bangalore', state: 'Karnataka', deliveryDays: 3, codAvailable: true },
        '500001': { city: 'Hyderabad', state: 'Telangana', deliveryDays: 3, codAvailable: true },
        '700001': { city: 'Kolkata', state: 'West Bengal', deliveryDays: 4, codAvailable: true },
        '380001': { city: 'Ahmedabad', state: 'Gujarat', deliveryDays: 3, codAvailable: true }
      };

      const pincodeData = validPincodes[pincode];
      if (!pincodeData) {
        return { isValid: false, city: '', state: '', serviceable: false, deliveryDays: 0, codAvailable: false, error: 'Pincode not serviceable' };
      }

      return {
        isValid: true,
        city: pincodeData.city,
        state: pincodeData.state,
        serviceable: true,
        deliveryDays: pincodeData.deliveryDays,
        codAvailable: pincodeData.codAvailable
      };
    } catch (error) {
      return { isValid: false, city: '', state: '', serviceable: false, deliveryDays: 0, codAvailable: false };
    }
  }

  private async getProductWeight(productId: string): Promise<number> {
    try {
      const doc = await db.collection('products').doc(productId).get();
      if (doc.exists) {
        const product = doc.data();
        // Assuming price-based estimation as before, or real weight if available
        if (product) {
          if (product.weight) return product.weight; // If weight exists
          // Heuristic based on price if weight missing
          const price = product.price || 0;
          if (price > 50000) return 2.0;
          if (price > 10000) return 1.0;
          if (price > 1000) return 0.5;
          return 0.2;
        }
      }
      return 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  private calculateTotalDimensions(items: DeliveryEstimationRequest['items']): {
    length: number;
    width: number;
    height: number;
  } {
    const totalDimensions = { length: 0, width: 0, height: 0 };
    items.forEach(item => {
      if (item.dimensions) {
        totalDimensions.length += item.dimensions.length * item.quantity;
        totalDimensions.width += item.dimensions.width * item.quantity;
        totalDimensions.height += item.dimensions.height * item.quantity;
      } else {
        totalDimensions.length += (10 * item.quantity);
        totalDimensions.width += (10 * item.quantity);
        totalDimensions.height += (5 * item.quantity);
      }
    });
    return totalDimensions;
  }

  private calculateDeliveryDate(startDate: Date, baseDays: number, pincodeDays: number): Date {
    const totalDays = Math.max(baseDays, pincodeDays);
    const processingDays = 1;
    const totalDeliveryDays = totalDays + processingDays;
    const deliveryDate = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < totalDeliveryDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        daysAdded++;
      }
    }
    return deliveryDate;
  }

  private async calculateShippingOptions(
    request: DeliveryEstimationRequest,
    totalWeight: number,
    totalDimensions: { length: number; width: number; height: number },
    pincodeValidation: any
  ): Promise<Array<{
    method: string;
    cost: number;
    estimatedDays: number;
    deliveryDate: Date;
    guaranteed: boolean;
  }>> {
    const options = [];

    const standardCost = await this.calculateShippingCost('standard', totalWeight, totalDimensions, pincodeValidation);
    options.push({
      method: 'standard',
      cost: standardCost,
      estimatedDays: this.baseDeliveryDays['standard'],
      deliveryDate: this.calculateDeliveryDate(new Date(), this.baseDeliveryDays['standard'], pincodeValidation.deliveryDays),
      guaranteed: false
    });

    const expressCost = await this.calculateShippingCost('express', totalWeight, totalDimensions, pincodeValidation);
    options.push({
      method: 'express',
      cost: expressCost,
      estimatedDays: this.baseDeliveryDays['express'],
      deliveryDate: this.calculateDeliveryDate(new Date(), this.baseDeliveryDays['express'], pincodeValidation.deliveryDays),
      guaranteed: true
    });

    const metroCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad'];
    if (metroCities.includes(pincodeValidation.city)) {
      const overnightCost = await this.calculateShippingCost('overnight', totalWeight, totalDimensions, pincodeValidation);
      options.push({
        method: 'overnight',
        cost: overnightCost,
        estimatedDays: this.baseDeliveryDays['overnight'],
        deliveryDate: this.calculateDeliveryDate(new Date(), this.baseDeliveryDays['overnight'], pincodeValidation.deliveryDays),
        guaranteed: true
      });
    }

    return options;
  }

  private async calculateShippingCost(
    method: string,
    weight: number,
    dimensions: { length: number; width: number; height: number },
    pincodeValidation: any
  ): Promise<number> {
    try {
      const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
      const chargeableWeight = Math.max(weight, volumetricWeight);
      const baseRate = this.shippingRates[method] || 1.0;

      const distanceFactors: Record<string, number> = {
        'Tamil Nadu': 1.0, 'Maharashtra': 1.2, 'Delhi': 1.1,
        'Karnataka': 1.0, 'Telangana': 1.0, 'West Bengal': 1.3, 'Gujarat': 1.1
      };

      const distanceFactor = distanceFactors[pincodeValidation.state] || 1.0;
      const baseCost = 50;
      const weightCost = chargeableWeight * baseRate * distanceFactor * 20;

      return Math.round(baseCost + weightCost);
    } catch (error) {
      return 100;
    }
  }

  private async checkWeatherDelays(city: string, state: string): Promise<{ delayDays: number; condition: string }> {
    try {
      // Mock weather logic
      const weatherConditions: Record<string, any> = {
        'Chennai': { condition: 'Heavy Rain', delayDays: 1 },
        'Delhi': { condition: 'Fog', delayDays: 1 }
      };
      return weatherConditions[city] || { condition: 'Clear', delayDays: 0 };
    } catch {
      return { condition: 'Unknown', delayDays: 0 };
    }
  }

  private async storeDeliveryEstimation(userId: string, request: DeliveryEstimationRequest, estimation: any): Promise<void> {
    try {
      // Optional: Storing estimation events in Firestore
      await db.collection('delivery_estimations').add({
        userId,
        pincode: request.pincode,
        itemCount: request.items.length,
        shippingMethod: request.shippingMethod,
        estimatedDate: estimation.deliveryDate,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error storing delivery estimation:', error);
    }
  }

  async getDeliveryHistory(userId: string, limit: number = 10): Promise<{ estimations: any[]; actualDeliveries: any[] }> {
    try {
      const snapshot = await db.collection('orders')
        .where('userId', '==', userId)
        .where('status', '==', 'delivered')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        estimations: [], // Retrieve if stored
        actualDeliveries: orders.map((order: any) => ({
          orderId: order.id,
          estimatedDate: order.createdAt, // Mocked
          actualDate: order.updatedAt,
          accuracy: this.calculateAccuracy(new Date(order.createdAt), new Date(order.updatedAt)),
          shippingMethod: 'standard'
        }))
      };
    } catch (error) {
      logger.error('Error fetching delivery history:', error);
      return { estimations: [], actualDeliveries: [] };
    }
  }

  private calculateAccuracy(estimated: Date, actual: Date): number {
    const diffTime = Math.abs(actual.getTime() - estimated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 100 - (diffDays * 10));
  }

  async getDeliveryAnalytics(userId: string): Promise<{
    totalEstimations: number;
    averageAccuracy: number;
    mostUsedPincode: string;
    preferredShippingMethod: string;
    seasonalTrends: Array<{ month: string; averageDeliveryDays: number; orderCount: number }>;
  }> {
    try {
      // Mock logic as original was mostly mock/calc
      return {
        totalEstimations: 10,
        averageAccuracy: 95,
        mostUsedPincode: '600001',
        preferredShippingMethod: 'standard',
        seasonalTrends: []
      };
    } catch {
      return { totalEstimations: 0, averageAccuracy: 0, mostUsedPincode: '', preferredShippingMethod: '', seasonalTrends: [] };
    }
  }
}

export default DeliveryEstimationService;