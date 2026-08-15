import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding-window bucket store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection for expired rate limit records (runs every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Evaluates request rate limits against a sliding window.
 *
 * @param identifier Unique key (e.g. client IP or composite identifier)
 * @param endpoint Namespace (e.g. 'login', 'signup', 'ai')
 * @param maxRequests Maximum requests allowed within window
 * @param windowSeconds Window duration in seconds
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const key = `${endpoint}:${identifier || 'anonymous'}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      retryAfterSeconds: windowSeconds,
    };
  }

  if (existing.count < maxRequests) {
    existing.count += 1;
    const remaining = maxRequests - existing.count;
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
    return {
      allowed: true,
      limit: maxRequests,
      remaining,
      retryAfterSeconds,
    };
  }

  // Rate limit exceeded
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
  return {
    allowed: false,
    limit: maxRequests,
    remaining: 0,
    retryAfterSeconds,
  };
}

/**
 * Extracts client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Constructs an HTTP 429 Too Many Requests response with standard Retry-After header.
 */
export function createRateLimitResponse(retryAfterSeconds: number, message: string = 'Too many requests. Please try again later.'): NextResponse {
  const response = NextResponse.json(
    { success: false, error: { message } },
    { status: 429 }
  );
  response.headers.set('Retry-After', String(retryAfterSeconds));
  response.headers.set('X-RateLimit-Reset', String(retryAfterSeconds));
  return response;
}
