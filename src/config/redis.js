const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 10) {
      console.error('❌ Redis: max retries reached, giving up');
      return null;
    }
    const delay = Math.min(times * 200, 5000);
    console.log(`🔄 Redis: reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redis.on('close', () => {
  if (env.isDev) {
    console.log('Redis connection closed');
  }
});

async function testConnection() {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (err) {
    console.error('❌ Redis connection test failed:', err.message);
    return false;
  }
}

async function close() {
  await redis.quit();
  console.log('Redis connection closed');
}

module.exports = { redis, testConnection, close };
