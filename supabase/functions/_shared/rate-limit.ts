import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@1.0.1"
import { Redis } from "https://esm.sh/@upstash/redis@1.28.2"

// Initialize Redis client (singleton)
let redis: Redis | null = null
let rateLimiters: ReturnType<typeof createRateLimiters> | null = null

function getRedis(): Redis {
  if (!redis) {
    const url = Deno.env.get('UPSTASH_REDIS_REST_URL')
    const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')
    
    if (!url || !token) {
      throw new Error('Redis credentials not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
    }
    
    redis = new Redis({ url, token })
  }
  return redis
}

function createRateLimiters(redis: Redis) {
  return {
    // High-cost functions (expensive API calls: LLM, TTS)
    highCost: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "rl:high",
    }),
    
    // Medium-cost functions (document/feed processing)
    mediumCost: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 h"),
      analytics: true,
      prefix: "rl:med",
    }),
    
    // Low-cost functions (CRUD operations)
    lowCost: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 h"),
      analytics: true,
      prefix: "rl:low",
    }),
    
    // Callbacks (trusted webhook sources)
    callback: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, "1 h"),
      analytics: true,
      prefix: "rl:cb",
    }),
  }
}

function getRateLimiters() {
  if (!rateLimiters) {
    rateLimiters = createRateLimiters(getRedis())
  }
  return rateLimiters
}

export type RateLimitTier = 'highCost' | 'mediumCost' | 'lowCost' | 'callback'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending?: Promise<unknown>
}

/**
 * Check rate limit for a request
 * @param req - The request object
 * @param tier - Rate limit tier to apply
 * @param userId - User ID (preferred) or falls back to IP
 * @param bypass - Set to true to bypass rate limiting (for admin/premium users)
 * @returns Response object if rate limit exceeded, null if allowed
 */
export async function checkRateLimit(
  req: Request,
  tier: RateLimitTier,
  userId?: string,
  bypass = false
): Promise<Response | null> {
  // Allow bypass for admin/premium users
  if (bypass) {
    console.log('Rate limit bypassed for:', userId || 'system')
    return null
  }

  try {
    const limiters = getRateLimiters()
    const limiter = limiters[tier]
    
    // Use user ID if available, otherwise fall back to IP
    const identifier = userId || getClientIp(req)
    
    // Use identifier directly - prefix handles tier categorization
    const result = await limiter.limit(identifier)
    
    // Log rate limit check for monitoring
    console.log('Rate limit check:', {
      tier,
      identifier: userId ? `user:${userId}` : `ip:${identifier}`,
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
    })
    
    if (!result.success) {
      // Log warning for monitoring/alerting
      console.warn('⚠️ Rate limit exceeded:', {
        tier,
        identifier: userId ? `user:${userId}` : `ip:${identifier}`,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset).toISOString(),
      })
      
      return createRateLimitExceededResponse(result, req.headers.get('origin'))
    }
    
    return null // Allowed
    
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open: allow request if rate limiting fails
    // This prevents Redis outages from blocking legitimate users
    return null
  }
}

/**
 * Extract client IP from request headers
 */
function getClientIp(req: Request): string {
  // Check common headers (in order of preference)
  const headers = [
    'x-forwarded-for',
    'x-real-ip', 
    'cf-connecting-ip',
    'x-client-ip',
  ]
  
  for (const header of headers) {
    const value = req.headers.get(header)
    if (value) {
      // x-forwarded-for can be comma-separated, take first IP
      const ip = value.split(',')[0].trim()
      return ip
    }
  }
  
  // Fallback: use 'unknown' - for <50 users this is acceptable
  // Most users will be authenticated anyway
  return 'unknown'
}

/**
 * Create rate limit exceeded response with proper headers
 */
function createRateLimitExceededResponse(
  result: RateLimitResult,
  origin: string | null
): Response {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    'Retry-After': String(retryAfter),
  }
  
  // Add CORS headers if origin present
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  
  const body = {
    error: 'Rate limit exceeded',
    message: `Too many requests. Please try again in ${retryAfter} seconds.`,
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset).toISOString(),
    retryAfter,
  }
  
  return new Response(JSON.stringify(body), {
    status: 429,
    headers,
  })
}

/**
 * Helper to get rate limit tier recommendations
 */
export const RATE_LIMIT_TIERS = {
  HIGH_COST: 'highCost' as RateLimitTier,      // 20 req/hour - LLM, TTS APIs
  MEDIUM_COST: 'mediumCost' as RateLimitTier,  // 50 req/hour - Document processing
  LOW_COST: 'lowCost' as RateLimitTier,        // 100 req/hour - CRUD operations
  CALLBACK: 'callback' as RateLimitTier,       // 500 req/hour - Trusted webhooks
}

