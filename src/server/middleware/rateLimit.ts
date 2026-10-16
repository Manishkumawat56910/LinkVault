import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter (no external dependencies).
 * Tracks request counts per IP within a sliding time window.
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now > entry.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      res.set('Retry-After', String(Math.ceil((entry.resetTime - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    entry.count++;
    next();
  };
}

// Presets
export const apiLimiter = rateLimit(100, 60 * 1000);     // 100 req/min
export const authLimiter = rateLimit(10, 60 * 1000);      // 10 req/min
export const clickLimiter = rateLimit(60, 60 * 1000);     // 60 req/min
