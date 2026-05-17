import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import logger from '../utils/logger';

const router = Router();

// Dynamic Sitemap Generation
router.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://alphadentkart-001.web.app';
        
        // Static pages
        const staticPages = [
            '',
            '/shop',
            '/categories',
            '/brands',
            '/wishlist',
            '/dashboard',
            '/login',
            '/register'
        ];

        // Fetch products for dynamic paths
        const productsSnapshot = await db.collection('products').get();
        const productPaths = productsSnapshot.docs.map(doc => `/product/${doc.id}`);

        // Fetch categories for dynamic paths
        const categoriesSnapshot = await db.collection('categories').get();
        const categoryPaths = categoriesSnapshot.docs.map(doc => `/category/${doc.data().slug || doc.id}`);

        const allPaths = [...staticPages, ...productPaths, ...categoryPaths];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${allPaths.map(path => `
    <url>
        <loc>${baseUrl}${path}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>${path.startsWith('/product/') ? 'weekly' : 'monthly'}</changefreq>
        <priority>${path === '' ? '1.0' : (path.startsWith('/product/') ? '0.8' : '0.5')}</priority>
    </url>`).join('')}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        logger.error('Sitemap generation error', { error });
        res.status(500).send('Error generating sitemap');
    }
});

// robots.txt
router.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = process.env.CLIENT_URL || 'https://alphadentkart-001.web.app';
    const robots = `User-agent: *
Allow: /
Disallow: /admin-dashboard
Disallow: /checkout
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.send(robots);
});

export default router;
