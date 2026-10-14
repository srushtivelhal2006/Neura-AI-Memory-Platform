const { redis } = require('../config/redis');

const DEFAULT_TTL = 60;

async function get(key) {
  try {
    const value = await redis.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (err) {
    console.error('Cache get error (non-fatal):', err.message);
    return null;
  }
}

async function set(key, value, ttlSeconds = DEFAULT_TTL) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.error('Cache set error (non-fatal):', err.message);
  }
}

async function del(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Cache del error (non-fatal):', err.message);
  }
}

async function delPattern(pattern) {
  try {
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    const pipeline = redis.pipeline();
    let count = 0;

    for await (const keys of stream) {
      for (const key of keys) {
        pipeline.del(key);
        count++;
      }
    }

    if (count > 0) {
      await pipeline.exec();
    }

    return count;
  } catch (err) {
    console.error('Cache delPattern error (non-fatal):', err.message);
    return 0;
  }
}

function buildKey(tenantId, userId, operation, extra = '') {
  let key = `neura:${tenantId}:${userId}:${operation}`;
  if (extra) {
    key += `:${extra}`;
  }
  return key;
}

async function invalidateUserCache(tenantId, userId) {
  const pattern = `neura:${tenantId}:${userId}:*`;
  return delPattern(pattern);
}

module.exports = { get, set, del, delPattern, buildKey, invalidateUserCache };
