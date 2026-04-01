import { Router } from 'express';

const router = Router();

router.post('/live-visitors', async (req, res) => {
    try {
        const { propertyId, clientEmail, privateKey } = req.body;

        if (!propertyId || !clientEmail || !privateKey) {
            return res.json({ count: Math.floor(Math.random() * 50) + 20, demo: true });
        }

        try {
            const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
            
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
        } catch (gaError) {
            console.error('GA4 API Error:', gaError);
            return res.json({ count: Math.floor(Math.random() * 50) + 20, demo: true, error: 'Using demo data' });
        }
    } catch (error) {
        console.error('Live visitors error:', error);
        return res.json({ count: Math.floor(Math.random() * 50) + 20, demo: true });
    }
});

export default router;
