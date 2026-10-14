const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const env = require('./config/env');
const db = require('./config/database');
const redisConfig = require('./config/redis');
const neo4jConfig = require('./config/neo4j');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const memoryRoutes = require('./routes/memory');
const authRoutes = require('./routes/auth');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: env.isDev ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/health', async (req, res) => {
  const checks = {};

  try {
    await db.query('SELECT 1');
    checks.postgres = 'healthy';
  } catch {
    checks.postgres = 'unhealthy';
  }

  try {
    const pong = await redisConfig.redis.ping();
    checks.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';
  } catch {
    checks.redis = 'unhealthy';
  }

  try {
    const session = neo4jConfig.getSession();
    await session.run('RETURN 1');
    await session.close();
    checks.neo4j = 'healthy';
  } catch {
    checks.neo4j = 'unhealthy';
  }

  const allHealthy = Object.values(checks).every((v) => v === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: checks,
  });
});

app.use('/v1/memory', memoryRoutes);
app.use('/v1/auth', authRoutes);

const dashboardPath = path.join(__dirname, '..', 'dashboard', 'dist');
app.use(express.static(dashboardPath));
app.get('/dashboard*', (req, res) => {
  const indexPath = path.join(dashboardPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ message: 'Dashboard not built. Run: cd dashboard && npm run build' });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  console.log('\n🚀 Starting Neura Memory API...\n');

  const pgConnected = await db.testConnection();
  if (!pgConnected) {
    console.error('❌ Cannot start without PostgreSQL. Exiting.');
    process.exit(1);
  }

  const redisConnected = await redisConfig.testConnection();
  if (!redisConnected) {
    console.warn('⚠️  Redis not available — caching and rate limiting will be degraded.');
  }

  const neo4jConnected = await neo4jConfig.testConnection();
  if (!neo4jConnected) {
    console.warn('⚠️  Neo4j not available — graph search will be unavailable.');
  }

  console.log('\n🧠 Pre-loading embedding model (first request will be faster)...');
  const { preloadModel } = require('./services/embeddingService');
  preloadModel().then((loaded) => {
    if (loaded) {
      console.log('✅ Embedding model ready');
    } else {
      console.warn('⚠️  Embedding model will load on first request');
    }
  });

  const server = app.listen(env.port, () => {
    console.log(`\n✅ Neura API running on http://localhost:${env.port}`);
    console.log(`   Health check: http://localhost:${env.port}/health`);
    console.log(`   Environment: ${env.nodeEnv}\n`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      try {
        await db.close();
        await redisConfig.close();
        await neo4jConfig.close();
        console.log('✅ All connections closed. Goodbye.\n');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err.message);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

startServer();

module.exports = app;
