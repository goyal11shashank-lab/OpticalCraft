/**
 * OptiCraft Eyewear - Lightweight Server-Side Rate Limiter Middleware
 * Protects login, signup, password resets, payment creation, webhooks, and admin routes
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: Map<string, RateLimitStore> = new Map();

/**
 * Creates an Express rate limit middleware
 * @param windowMs Time window in milliseconds
 * @param maxMax Maximum allowed requests within window
 * @param bucketName Identifier for the endpoint bucket
 */
export function createRateLimiter(windowMs: number, maxMax: number, bucketName: string) {
  if (!stores.has(bucketName)) {
    stores.set(bucketName, {});
  }
  const store = stores.get(bucketName)!;

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP address
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const record = store[ip];

    if (!record || now > record.resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    record.count += 1;

    if (record.count > maxMax) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

// Preset Rate Limiters
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 20, 'auth'); // 20 requests per 15 min
export const paymentRateLimiter = createRateLimiter(5 * 60 * 1000, 30, 'payment'); // 30 requests per 5 min
export const webhookRateLimiter = createRateLimiter(1 * 60 * 1000, 120, 'webhook'); // 120 requests per 1 min
export const generalApiLimiter = createRateLimiter(1 * 60 * 1000, 200, 'api'); // 200 requests per 1 min
