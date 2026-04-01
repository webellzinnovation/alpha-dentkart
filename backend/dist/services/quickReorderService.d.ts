export interface QuickReorderData {
    userId: string;
    orderId: string;
    notes?: string;
    modifyQuantities?: boolean;
    quantityModifications?: Array<{
        orderItemId: string;
        newQuantity: number;
    }>;
}
export interface QuickReorderResponse {
    success: boolean;
    reorder?: any;
    error?: string;
}
export declare class QuickReorderService {
    constructor();
    createQuickReorder(data: QuickReorderData): Promise<QuickReorderResponse>;
    getUserReorders(userId: string, filters?: {
        limit?: number;
        offset?: number;
        status?: string;
    }): Promise<{
        reorders: any[];
        total: number;
    }>;
    getReorderById(reorderId: string, userId: string): Promise<any | null>;
    cancelReorder(reorderId: string, userId: string, reason: string): Promise<QuickReorderResponse>;
    getReorderStats(userId: string): Promise<any>;
    getRecommendedReorders(userId: string, limit?: number): Promise<any[]>;
}
export default QuickReorderService;
//# sourceMappingURL=quickReorderService.d.ts.map