"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/live-visitors', async (req, res) => {
    try {
        const { propertyId, clientEmail, privateKey } = req.body;
        if (!propertyId || !clientEmail || !privateKey) {
            return res.json({ count: Math.floor(Math.random() * 50) + 20, demo: true });
        }
        try {
            const { BetaAnalyticsDataClient } = await Promise.resolve().then(() => __importStar(require('@google-analytics/data')));
            const analyticsDataClient = new BetaAnalyticsDataClient({
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                },
            });
            const [response] = await analyticsDataClient.runRealtimeReport({
                property: `properties/${propertyId}`,
                dimensions: [
                    {
                        name: 'unifiedScreenName',
                    },
                ],
                metrics: [
                    {
                        name: 'activeUsers',
                    },
                ],
            });
            let totalVisitors = 0;
            if (response.rows) {
                totalVisitors = response.rows.reduce((sum, row) => {
                    const metricValue = row.metricValues?.[0]?.value;
                    return sum + (metricValue ? parseInt(metricValue) : 0);
                }, 0);
            }
            return res.json({ count: totalVisitors, demo: false });
        }
        catch (gaError) {
            console.error('GA4 API Error:', gaError);
            return res.json({ count: Math.floor(Math.random() * 50) + 20, demo: true, error: 'Using demo data' });
        }
    }
    catch (error) {
        console.error('Live visitors error:', error);
        return res.json({ count: Math.floor(Math.random() * 50) + 20, demo: true });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map