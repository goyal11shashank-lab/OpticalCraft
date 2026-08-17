import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './src/server/routes/api.js';
import { db } from './src/server/db.js';
import { logger } from './src/server/logger.js';
import { errorMonitor } from './src/server/errorMonitoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // CORS Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    if (origin && (origin === appUrl || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token, X-Session-Id');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // JSON Body Parser with rawBody preservation for Webhook HMAC verification
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // SEO: Dynamic Robots.txt Endpoint
  app.get('/robots.txt', (_req, res) => {
    const baseUrl = process.env.APP_URL || 'https://opticraft.in';
    const robotsTxt = `User-agent: *
Allow: /
Allow: /catalog
Allow: /product/
Allow: /eyeglasses
Allow: /sunglasses
Allow: /legal/
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /admin
Disallow: /api
Disallow: /private

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // SEO: Dynamic Sitemap.xml Endpoint
  app.get('/sitemap.xml', (_req, res) => {
    const baseUrl = process.env.APP_URL || 'https://opticraft.in';
    const products = Array.from(db.products.values()).filter((p) => p.active);

    const staticPages = [
      '',
      '/catalog',
      '/eyeglasses',
      '/sunglasses',
      '/legal/privacy',
      '/legal/terms',
      '/legal/shipping',
      '/legal/returns',
      '/legal/contact',
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticPages.forEach((page) => {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>${page === '' || page === '/catalog' ? 'daily' : 'weekly'}</changefreq>\n    <priority>${page === '' ? '1.0' : page === '/catalog' ? '0.9' : '0.5'}</priority>\n  </url>\n`;
    });

    products.forEach((p) => {
      xml += `  <url>\n    <loc>${baseUrl}/product/${p.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  });

  // API Routes First
  app.use('/api', apiRoutes);

  // Global Centralized Express Error Handler
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('[SERVER UNHANDLED ERROR]', { path: req.path, message: err.message, stack: err.stack });
    errorMonitor.captureException(err, { endpoint: req.path }, 'HIGH');

    const isProd = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
      success: false,
      error: isProd ? 'Internal Server Error. Please try again.' : err.message || 'Something went wrong.',
    });
  });

  // Vite Middleware for Development / Static Serve for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`OptiCraft Eyewear Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
