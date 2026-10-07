const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { redis } = require('../config/redis');
const env = require('../config/env');

const AUTH_CACHE_PREFIX = 'pragma:auth:';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected: Bearer <api_key>',
      code: 'AUTH_MISSING',
      timestamp: new Date().toISOString(),
    });
  }

  const apiKey = authHeader.slice(7).trim();

  if (!apiKey || !apiKey.startsWith('prg_live_')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key format. Keys must start with "prg_live_"',
      code: 'AUTH_INVALID_FORMAT',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const cached = await getCachedAuth(apiKey);
    if (cached) {
      req.tenant = cached;
      return next();
    }

    const keyPrefix = apiKey.substring(0, 16);

    const result = await query(
      `SELECT ak.id AS key_id, ak.key_hash, ak.permissions, ak.rate_limit, ak.revoked_at,
              t.id AS tenant_id, t.name AS tenant_name, t.org_id, t.tier, t.max_memories, t.max_apps
       FROM api_keys ak
       JOIN tenants t ON ak.tenant_id = t.id
       WHERE ak.key_prefix = $1`,
      [keyPrefix]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
        code: 'AUTH_INVALID_KEY',
        timestamp: new Date().toISOString(),
      });
    }

    let matchedRow = null;
    for (const row of result.rows) {
      const isMatch = await bcrypt.compare(apiKey, row.key_hash);
      if (isMatch) {
        matchedRow = row;
        break;
      }
    }

    if (!matchedRow) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
        code: 'AUTH_INVALID_KEY',
        timestamp: new Date().toISOString(),
      });
    }

    if (matchedRow.revoked_at) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This API key has been revoked',
        code: 'AUTH_KEY_REVOKED',
        timestamp: new Date().toISOString(),
      });
    }

    const tenantInfo = {
      tenant_id: matchedRow.tenant_id,
      tenant_name: matchedRow.tenant_name,
      org_id: matchedRow.org_id,
      tier: matchedRow.tier,
      permissions: matchedRow.permissions,
      rate_limit: matchedRow.rate_limit,
      max_memories: matchedRow.max_memories,
      max_apps: matchedRow.max_apps,
      key_id: matchedRow.key_id,
    };

    await cacheAuth(apiKey, tenantInfo);

    query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [matchedRow.key_id]
    ).catch(() => {});

    req.tenant = tenantInfo;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service unavailable',
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
}

async function getCachedAuth(apiKey) {
  try {
    const cacheKey = AUTH_CACHE_PREFIX + hashForCache(apiKey);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    // Cache miss is not an error
  }
  return null;
}

async function cacheAuth(apiKey, tenantInfo) {
  try {
    const cacheKey = AUTH_CACHE_PREFIX + hashForCache(apiKey);
    await redis.set(cacheKey, JSON.stringify(tenantInfo), 'EX', env.cache.ttlAuth);
  } catch (err) {
    // Cache write failure is non-critical
  }
}

function hashForCache(apiKey) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
}

async function invalidateAuthCache(apiKey) {
  try {
    const cacheKey = AUTH_CACHE_PREFIX + hashForCache(apiKey);
    await redis.del(cacheKey);
  } catch (err) {
    // Non-critical
  }
}

module.exports = { authMiddleware, invalidateAuthCache };
