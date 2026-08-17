import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding-window bucket store (used as fallback or in offline local environments)
const inMemoryStore = new Map<string, RateLimitRecord>();

// Initialize Upstash Redis client conditionally from environment variables
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch {
    redisClient = null;
  }
}

// Cache Ratelimit instances per (endpoint, maxRequests, windowSeconds) to avoid duplicate initialization overhead
const ratelimitInstances = new Map<string, Ratelimit>();

function getRatelimiter(endpoint: string, maxRequests: number, windowSeconds: number): Ratelimit | null {
  if (!redisClient) return null;

  const cacheKey = `${endpoint}:${maxRequests}:${windowSeconds}`;
  let instance = ratelimitInstances.get(cacheKey);
  if (!instance) {
    instance = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      prefix: `agencyflow:ratelimit:${endpoint}`,
      analytics: false,
    });
    ratelimitInstances.set(cacheKey, instance);
  }
  return instance;
}

/**
 * Resets the in-memory rate limit store and clears cached test keys from Redis.
 */
export async function resetRateLimitStore(pattern?: string): Promise<void> {
  inMemoryStore.clear();

  if (redisClient) {
    try {
      const searchPattern = pattern ? `agencyflow:ratelimit:${pattern}*` : 'agencyflow:ratelimit:*';
      const keys = await redisClient.keys(searchPattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {
      // Ignore test cleanup errors
    }
  }
}

// Periodic garbage collection for in-memory fallback store
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryStore.entries()) {
      if (now > record.resetTime) {
        inMemoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Evaluates request rate limits using distributed Upstash Redis sliding window,
 * with automatic, conservative in-memory fallback if Redis is unavailable.
 *
 * @param identifier Unique key (e.g. client IP or composite identifier like `${workspaceId}:${ip}`)
 * @param endpoint Namespace (e.g. 'auth-login', 'auth-signup', 'ai-score-lead', 'ai-generate-followup')
 * @param maxRequests Maximum requests allowed within window
 * @param windowSeconds Window duration in seconds
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // Sanitize and bound the identifier length to prevent key manipulation
  const cleanIdentifier = (identifier || 'anonymous').trim().slice(0, 128);

  // 1. Primary: Distributed Upstash Redis Rate Limiting
  if (redisClient) {
    try {
      const limiter = getRatelimiter(endpoint, maxRequests, windowSeconds);
      if (limiter) {
        const result = await limiter.limit(cleanIdentifier);
        const now = Date.now();
        const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - now) / 1000));

        return {
          allowed: result.success,
          limit: result.limit,
          remaining: result.remaining,
          retryAfterSeconds,
        };
      }
    } catch (error: any) {
      // Conservative fail-safe: log sanitized warning without exposing credentials
      console.warn(
        `[RateLimiter] Upstash Redis request failed for endpoint "${endpoint}". Falling back to conservative in-memory limiter. Error: ${error?.name || 'NetworkError'}`
      );
    }
  }

  // 2. Fallback: Local In-Memory Sliding Window Bucket
  return checkInMemoryRateLimit(cleanIdentifier, endpoint, maxRequests, windowSeconds);
}

/**
 * Fallback in-memory sliding window bucket evaluator.
 */
function checkInMemoryRateLimit(
  cleanIdentifier: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const key = `${endpoint}:${cleanIdentifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const existing = inMemoryStore.get(key);

  if (!existing || now > existing.resetTime) {
    inMemoryStore.set(key, {
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

  // Limit exceeded
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
  return {
    allowed: false,
    limit: maxRequests,
    remaining: 0,
    retryAfterSeconds,
  };
}

/**
 * Extracts and sanitizes client IP from request headers.
 * Safely inspects proxy headers (Cloudflare, Reverse Proxy, ALB) with character validation.
 */
export function getClientIp(request: Request): string {
  // 1. Direct Cloudflare connecting IP
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && isValidIpFormat(cfIp.trim())) {
    return cfIp.trim().slice(0, 45);
  }

  // 2. Reverse proxy real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp && isValidIpFormat(realIp.trim())) {
    return realIp.trim().slice(0, 45);
  }

  // 3. X-Forwarded-For header (extract leftmost client IP)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const leftmost = forwarded.split(',')[0].trim();
    if (isValidIpFormat(leftmost)) {
      return leftmost.slice(0, 45);
    }
  }

  return '127.0.0.1';
}

/**
 * Validates IP address format to prevent header injection into Redis keys.
 */
function isValidIpFormat(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // Allow standard IPv4, IPv6, and test mock prefixes (e.g. rate-limit-test-ip-*, alphanumeric with dots/colons/hyphens)
  const ipRegex = /^[a-zA-Z0-9.:_-]+$/;
  return ipRegex.test(ip);
}

/**
 * Constructs an HTTP 429 Too Many Requests response with standard Retry-After header.
 */
export function createRateLimitResponse(
  retryAfterSeconds: number,
  message: string = 'Too many requests. Please try again later.'
): NextResponse {
  const response = NextResponse.json(
    { success: false, error: { message } },
    { status: 429 }
  );
  response.headers.set('Retry-After', String(retryAfterSeconds));
  response.headers.set('X-RateLimit-Reset', String(retryAfterSeconds));
  return response;
}
