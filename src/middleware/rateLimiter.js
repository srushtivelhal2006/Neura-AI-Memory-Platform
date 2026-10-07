const { redis } = require('../config/redis');
const env = require('../config/env');

const RATE_LIMIT_PREFIX = 'pragma:ratelimit:';

function rateLimiter() {
  return async function rateLimitMiddleware(req, res, next) {
    if (!req.tenant) {
      return next();
    }

    const { tenant_id, tier } = req.tenant;
    const windowMs = 60000;
    const maxRequests = env.rateLimits[tier] || env.rateLimits.free;

    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `${RATE_LIMIT_PREFIX}${tenant_id}`;

    try {
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
      pipeline.zcard(key);
      pipeline.expire(key, 120);

      const results = await pipeline.exec();
      const requestCount = results[2][1];

      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - requestCount),
        'X-RateLimit-Reset': Math.ceil((now + windowMs) / 1000),
      });

      if (requestCount > maxRequests) {
        const retryAfter = Math.ceil(windowMs / 1000);
        res.set('Retry-After', retryAfter);

        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. ${tier} tier allows ${maxRequests} requests per minute.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retry_after: retryAfter,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (err) {
      console.error('Rate limiter error:', err.message);
      next();
    }
  };
}

module.exports = { rateLimiter };
