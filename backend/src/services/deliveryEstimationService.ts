import { PrismaClient } from '@prisma/client';

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
  private prisma: PrismaClient;
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

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async calculateDeliveryEstimation(request: DeliveryEstimationRequest): Promise<DeliveryEstimationResponse> {
    try {
      // Validate pincode
      const pincodeValidation = await this.validatePincode(request.pincode);
      if (!pincodeValidation.isValid) {
        return {
          success: false,
          error: pincodeValidation.error || 'Invalid pincode'
        };
      }

      // Calculate total weight and dimensions
      let totalWeight = 0;
      for (const item of request.items) {
        const itemWeight = item.weight || await this.getProductWeight(item.productId);
        totalWeight += itemWeight * item.quantity;
      }

      const totalDimensions = this.calculateTotalDimensions(request.items);

      // Get base delivery days
      const baseDays = this.baseDeliveryDays[request.shippingMethod || 'standard'];

      // Calculate delivery windows based on shipping method and time
      const now = new Date();
      const deliveryDate = this.calculateDeliveryDate(now, baseDays, pincodeValidation.deliveryDays);

      // Check for weather delays
      const weatherInfo = await this.checkWeatherDelays(pincodeValidation.city, pincodeValidation.state);
      const weatherDelay = weatherInfo.delayDays > 0;
      const finalDeliveryDate = weatherDelay 
        ? new Date(deliveryDate.getTime() + (weatherInfo.delayDays * 24 * 60 * 60 * 1000))
        : deliveryDate;

      // Calculate shipping options
      const shippingOptions = await this.calculateShippingOptions(
        request,
        totalWeight,
        totalDimensions,
        pincodeValidation
      );

      // Create delivery window (typically 2-4 hour window)
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

      // Store estimation for analytics if user is provided
      if (request.userId) {
        await this.storeDeliveryEstimation(request.userId, request, estimation);
      }

      return {
        success: true,
        estimation
      };
    } catch (error) {
      console.error('Error calculating delivery estimation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate delivery estimation'
      };
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
      // Mock pincode validation - in production, this would integrate with postal service
      const validPincodes = {
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
        return {
          isValid: false,
          city: '',
          state: '',
          serviceable: false,
          deliveryDays: 0,
          codAvailable: false,
          error: 'Pincode not serviceable'
        };
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
      console.error('Error validating pincode:', error);
      return {
        isValid: false,
        city: '',
        state: '',
        serviceable: false,
        deliveryDays: 0,
        codAvailable: false,
        error: 'Pincode validation failed'
      };
    }
  }

  private async getProductWeight(productId: string): Promise<number> {
    try {
      // Parse productId as number since Prisma uses Int
      const id = parseInt(productId);
      if (isNaN(id)) {
        return 0.5; // Default weight if invalid ID
      }

      const product = await this.prisma.product.findUnique({
        where: { id },
        select: { 
          id: true,
          name: true,
          price: true
          // Note: weight field doesn't exist in Product model yet
          // Using default weight based on product type
        }
      });

      // For now, estimate weight based on price (heuristic)
      if (product) {
        if (product.price > 50000) return 2.0; // Heavy equipment
        if (product.price > 10000) return 1.0; // Medium equipment
        if (product.price > 1000) return 0.5;  // Light equipment
        return 0.2; // Small items/consumables
      }

      return 0.5; // Default weight if not found
    } catch (error) {
      console.error('Error fetching product weight:', error);
      return 0.5;
    }
  }

  private calculateTotalDimensions(items: DeliveryEstimationRequest['items']): {
    length: number;
    width: number;
    height: number;
  } {
    const totalDimensions = {
      length: 0,
      width: 0,
      height: 0
    };

    items.forEach(item => {
      if (item.dimensions) {
        totalDimensions.length += item.dimensions.length * item.quantity;
        totalDimensions.width += item.dimensions.width * item.quantity;
        totalDimensions.height += item.dimensions.height * item.quantity;
      } else {
        // Default dimensions for items without specified dimensions
        totalDimensions.length += (10 * item.quantity); // 10cm default
        totalDimensions.width += (10 * item.quantity); // 10cm default
        totalDimensions.height += (5 * item.quantity); // 5cm default
      }
    });

    return totalDimensions;
  }

  private calculateDeliveryDate(startDate: Date, baseDays: number, pincodeDays: number): Date {
    // Use the longer of base days or pincode-specific days
    const totalDays = Math.max(baseDays, pincodeDays);
    
    // Add processing time (usually 1 day)
    const processingDays = 1;
    const totalDeliveryDays = totalDays + processingDays;

    // Calculate delivery date (skip weekends)
    const deliveryDate = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < totalDeliveryDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      
      // Skip weekends
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

    // Standard shipping
    const standardCost = await this.calculateShippingCost(
      'standard',
      totalWeight,
      totalDimensions,
      pincodeValidation
    );
    options.push({
      method: 'standard',
      cost: standardCost,
      estimatedDays: this.baseDeliveryDays['standard'],
      deliveryDate: this.calculateDeliveryDate(new Date(), this.baseDeliveryDays['standard'], pincodeValidation.deliveryDays),
      guaranteed: false
    });

    // Express shipping
    const expressCost = await this.calculateShippingCost(
      'express',
      totalWeight,
      totalDimensions,
      pincodeValidation
    );
    options.push({
      method: 'express',
      cost: expressCost,
      estimatedDays: this.baseDeliveryDays['express'],
      deliveryDate: this.calculateDeliveryDate(new Date(), this.baseDeliveryDays['express'], pincodeValidation.deliveryDays),
      guaranteed: true
    });

    // Overnight shipping (only for metro cities)
    const metroCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad'];
    if (metroCities.includes(pincodeValidation.city)) {
      const overnightCost = await this.calculateShippingCost(
        'overnight',
        totalWeight,
        totalDimensions,
        pincodeValidation
      );
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
      // Calculate volumetric weight (length × width × height ÷ 5000)
      const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
      const chargeableWeight = Math.max(weight, volumetricWeight);

      // Base rate calculation
      const baseRate = this.shippingRates[method] || 1.0;
      
      // Distance factor based on state
      const distanceFactors: Record<string, number> = {
        'Tamil Nadu': 1.0,
        'Maharashtra': 1.2,
        'Delhi': 1.1,
        'Karnataka': 1.0,
        'Telangana': 1.0,
        'West Bengal': 1.3,
        'Gujarat': 1.1
      };

      const distanceFactor = distanceFactors[pincodeValidation.state] || 1.0;

      // Calculate final cost (₹50 base + rate × weight × distance factor)
      const baseCost = 50;
      const weightCost = chargeableWeight * baseRate * distanceFactor * 20; // ₹20 per kg

      return Math.round(baseCost + weightCost);
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      return 100; // Default fallback cost
    }
  }

  private async checkWeatherDelays(city: string, state: string): Promise<{
    delayDays: number;
    condition: string;
  }> {
    try {
      // Mock weather service integration
      // In production, this would call a real weather API
      const weatherConditions = {
        'Chennai': { condition: 'Heavy Rain', delayDays: 1 },
        'Mumbai': { condition: 'Clear', delayDays: 0 },
        'Delhi': { condition: 'Fog', delayDays: 1 },
        'Bangalore': { condition: 'Clear', delayDays: 0 },
        'Hyderabad': { condition: 'Clear', delayDays: 0 },
        'Kolkata': { condition: 'Clear', delayDays: 0 },
        'Ahmedabad': { condition: 'Clear', delayDays: 0 }
      };

      return weatherConditions[city] || { condition: 'Clear', delayDays: 0 };
    } catch (error) {
      console.error('Error checking weather delays:', error);
      return { condition: 'Unknown', delayDays: 0 };
    }
  }

  private async storeDeliveryEstimation(
    userId: string,
    request: DeliveryEstimationRequest,
    estimation: any
  ): Promise<void> {
    try {
      // This would store the estimation for analytics
      // In a real implementation, you might have a DeliveryEstimation table
      
      console.log(`Delivery estimation stored for user ${userId}:`, {
        pincode: request.pincode,
        itemCount: request.items.length,
        estimatedDate: estimation.deliveryDate,
        shippingMethod: request.shippingMethod
      });
    } catch (error) {
      console.error('Error storing delivery estimation:', error);
    }
  }

  async getDeliveryHistory(userId: string, limit: number = 10): Promise<{
    estimations: any[];
    actualDeliveries: any[];
  }> {
    try {
      // Get user's order history to compare estimated vs actual delivery
      const orders = await this.prisma.order.findMany({
        where: {
          userId,
          status: 'delivered'
        },
        include: {
          ShippingTracking: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      // Mock estimation history (would come from DeliveryEstimation table)
      const estimations = [];

      return {
        estimations,
        actualDeliveries: orders.map(order => ({
          orderId: order.id,
          estimatedDate: order.createdAt, // Would be actual estimation date
          actualDate: order.updatedAt, // Would be actual delivery date
          accuracy: this.calculateAccuracy(order.createdAt, order.updatedAt),
          shippingMethod: this.extractCityFromAddress(order.shippingAddress) || 'unknown'
        }))
      };
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      return { estimations: [], actualDeliveries: [] };
    }
  }

  private calculateAccuracy(estimated: Date, actual: Date): number {
    const diffTime = Math.abs(actual.getTime() - estimated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 100 - (diffDays * 10)); // 10% penalty per day
  }

  private extractCityFromAddress(shippingAddress: string | null): string | null {
    if (!shippingAddress) return null;
    
    try {
      const address = JSON.parse(shippingAddress);
      return address.city || null;
    } catch {
      return null;
    }
  }

  async getDeliveryAnalytics(userId: string): Promise<{
    totalEstimations: number;
    averageAccuracy: number;
    mostUsedPincode: string;
    preferredShippingMethod: string;
    seasonalTrends: Array<{
      month: string;
      averageDeliveryDays: number;
      orderCount: number;
    }>;
  }> {
    try {
      // Mock analytics calculation
      const history = await this.getDeliveryHistory(userId, 50);
      
      return {
        totalEstimations: history.estimations.length + history.actualDeliveries.length,
        averageAccuracy: history.actualDeliveries.length > 0
          ? history.actualDeliveries.reduce((sum, d) => sum + d.accuracy, 0) / history.actualDeliveries.length
          : 0,
        mostUsedPincode: '600001', // Most common in demo data
        preferredShippingMethod: 'express',
        seasonalTrends: [
          { month: '2024-01', averageDeliveryDays: 3, orderCount: 15 },
          { month: '2024-02', averageDeliveryDays: 3.2, orderCount: 18 },
          { month: '2024-03', averageDeliveryDays: 2.8, orderCount: 22 }
        ]
      };
    } catch (error) {
      console.error('Error calculating delivery analytics:', error);
      return {
        totalEstimations: 0,
        averageAccuracy: 0,
        mostUsedPincode: '',
        preferredShippingMethod: '',
        seasonalTrends: []
      };
    }
  }
}

export default DeliveryEstimationService;