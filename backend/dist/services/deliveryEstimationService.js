"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryEstimationService = void 0;
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
class DeliveryEstimationService {
    constructor() {
        this.baseDeliveryDays = {
            'standard': 3,
            'express': 2,
            'overnight': 1
        };
        this.shippingRates = {
            'standard': 1.0,
            'express': 1.5,
            'overnight': 2.0
        };
        // Empty constructor
    }
    async calculateDeliveryEstimation(request) {
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
            const shippingOptions = await this.calculateShippingOptions(request, totalWeight, totalDimensions, pincodeValidation);
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
        }
        catch (error) {
            logger_1.default.error('Error calculating delivery estimation:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed' };
        }
    }
    async validatePincode(pincode) {
        try {
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
        }
        catch (error) {
            return { isValid: false, city: '', state: '', serviceable: false, deliveryDays: 0, codAvailable: false };
        }
    }
    async getProductWeight(productId) {
        try {
            const doc = await firebase_1.db.collection('products').doc(productId).get();
            if (doc.exists) {
                const product = doc.data();
                // Assuming price-based estimation as before, or real weight if available
                if (product) {
                    if (product.weight)
                        return product.weight; // If weight exists
                    // Heuristic based on price if weight missing
                    const price = product.price || 0;
                    if (price > 50000)
                        return 2.0;
                    if (price > 10000)
                        return 1.0;
                    if (price > 1000)
                        return 0.5;
                    return 0.2;
                }
            }
            return 0.5;
        }
        catch (error) {
            return 0.5;
        }
    }
    calculateTotalDimensions(items) {
        const totalDimensions = { length: 0, width: 0, height: 0 };
        items.forEach(item => {
            if (item.dimensions) {
                totalDimensions.length += item.dimensions.length * item.quantity;
                totalDimensions.width += item.dimensions.width * item.quantity;
                totalDimensions.height += item.dimensions.height * item.quantity;
            }
            else {
                totalDimensions.length += (10 * item.quantity);
                totalDimensions.width += (10 * item.quantity);
                totalDimensions.height += (5 * item.quantity);
            }
        });
        return totalDimensions;
    }
    calculateDeliveryDate(startDate, baseDays, pincodeDays) {
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
    async calculateShippingOptions(request, totalWeight, totalDimensions, pincodeValidation) {
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
    async calculateShippingCost(method, weight, dimensions, pincodeValidation) {
        try {
            const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
            const chargeableWeight = Math.max(weight, volumetricWeight);
            const baseRate = this.shippingRates[method] || 1.0;
            const distanceFactors = {
                'Tamil Nadu': 1.0, 'Maharashtra': 1.2, 'Delhi': 1.1,
                'Karnataka': 1.0, 'Telangana': 1.0, 'West Bengal': 1.3, 'Gujarat': 1.1
            };
            const distanceFactor = distanceFactors[pincodeValidation.state] || 1.0;
            const baseCost = 50;
            const weightCost = chargeableWeight * baseRate * distanceFactor * 20;
            return Math.round(baseCost + weightCost);
        }
        catch (error) {
            return 100;
        }
    }
    async checkWeatherDelays(city, state) {
        try {
            // Mock weather logic
            const weatherConditions = {
                'Chennai': { condition: 'Heavy Rain', delayDays: 1 },
                'Delhi': { condition: 'Fog', delayDays: 1 }
            };
            return weatherConditions[city] || { condition: 'Clear', delayDays: 0 };
        }
        catch {
            return { condition: 'Unknown', delayDays: 0 };
        }
    }
    async storeDeliveryEstimation(userId, request, estimation) {
        try {
            // Optional: Storing estimation events in Firestore
            await firebase_1.db.collection('delivery_estimations').add({
                userId,
                pincode: request.pincode,
                itemCount: request.items.length,
                shippingMethod: request.shippingMethod,
                estimatedDate: estimation.deliveryDate,
                createdAt: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error storing delivery estimation:', error);
        }
    }
    async getDeliveryHistory(userId, limit = 10) {
        try {
            const snapshot = await firebase_1.db.collection('orders')
                .where('userId', '==', userId)
                .where('status', '==', 'delivered')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return {
                estimations: [], // Retrieve if stored
                actualDeliveries: orders.map((order) => ({
                    orderId: order.id,
                    estimatedDate: order.createdAt, // Mocked
                    actualDate: order.updatedAt,
                    accuracy: this.calculateAccuracy(new Date(order.createdAt), new Date(order.updatedAt)),
                    shippingMethod: 'standard'
                }))
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching delivery history:', error);
            return { estimations: [], actualDeliveries: [] };
        }
    }
    calculateAccuracy(estimated, actual) {
        const diffTime = Math.abs(actual.getTime() - estimated.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, 100 - (diffDays * 10));
    }
    async getDeliveryAnalytics(userId) {
        try {
            // Mock logic as original was mostly mock/calc
            return {
                totalEstimations: 10,
                averageAccuracy: 95,
                mostUsedPincode: '600001',
                preferredShippingMethod: 'standard',
                seasonalTrends: []
            };
        }
        catch {
            return { totalEstimations: 0, averageAccuracy: 0, mostUsedPincode: '', preferredShippingMethod: '', seasonalTrends: [] };
        }
    }
}
exports.DeliveryEstimationService = DeliveryEstimationService;
exports.default = DeliveryEstimationService;
//# sourceMappingURL=deliveryEstimationService.js.map