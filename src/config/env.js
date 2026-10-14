require('dotenv').config();

const env = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://neura:neura_dev@localhost:5432/neura_db',
    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'neura_dev_password',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  rateLimits: {
    free: parseInt(process.env.RATE_LIMIT_FREE, 10) || 100,
    pro: parseInt(process.env.RATE_LIMIT_PRO, 10) || 1000,
    enterprise: parseInt(process.env.RATE_LIMIT_ENTERPRISE, 10) || 5000,
  },

  embedding: {
    model: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS, 10) || 384,
  },

  cache: {
    ttlSearch: parseInt(process.env.CACHE_TTL_SEARCH, 10) || 60,
    ttlMemoryList: parseInt(process.env.CACHE_TTL_MEMORY_LIST, 10) || 30,
    ttlAuth: parseInt(process.env.CACHE_TTL_AUTH, 10) || 300,
  },
};

if (env.jwt.secret === 'change_this_in_production' && !env.isDev) {
  console.warn('⚠️  WARNING: Using default JWT_SECRET in non-development environment!');
}

module.exports = env;
