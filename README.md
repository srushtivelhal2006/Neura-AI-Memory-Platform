# Neura — AI Memory & Context Platform (v2.0)

> **Production-ready B2B memory-as-a-service & AI Context Management Platform** that provides persistent, cross-platform, behavioral memory for AI agents, LLM applications, and developer teams. Features hybrid multi-strategy retrieval (semantic vectors, keyword full-text, and knowledge graph), unified AI Provider management, interactive Memory Chat, agent integrations, and dual-mode deployment.

---

## 🌟 What's New in v2.0

- 🤖 **AI Providers Hub**: Unified configuration for Anthropic (Claude 3.7 / 3.5), OpenAI (GPT-4o, o3-mini), Google Gemini, Ollama (local weights), and GitHub Copilot.
- 💬 **Interactive Memory Chat**: Multi-turn chat grounded in persistent user memories with verifiable context citations.
- 🔌 **Agent & Tool Integrations**: Out-of-the-box templates and SDK code for LangChain, LlamaIndex, AutoGPT, CrewAI, and Model Context Protocol (MCP).
- 🌓 **Dynamic Theme System**: Sleek macOS-inspired glassmorphic Dark and Light mode dashboard.
- ⚡ **Zero-Dependency Instant Server (`NeuraServer.js`)**: Launch the complete backend and web dashboard instantly in Node.js without needing external Docker, Postgres, or Neo4j containers!
- 🛡️ **Strict Multi-Layer Auth Validation**: Enhanced registration and API key security.

---

## Table of Contents

- [Instant Launch (Zero Dependencies)](#-instant-launch-recommended-for-quick-eval)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-full-production-mode)
- [Dashboard Setup](#dashboard-setup)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [End-to-End Testing Guide](#end-to-end-testing-guide)
- [Environment Variables](#environment-variables)
- [Search Strategy](#search-strategy)
- [Docker Services](#docker-services)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## ⚡ Instant Launch (Recommended for Quick Eval)

Run the entire platform (API engine + embedded React Dashboard) with **zero external database dependencies**:

```bash
# 1. Clone the repository
git clone https://github.com/srushtivelhal2006/Neura-AI-Memory-Platform.git
cd Neura-AI-Memory-Platform

# 2. Build the dashboard (if not already built)
npm run dashboard:build

# 3. Start the all-in-one Neura server
npm run server
```

Open **`http://localhost:3001`** in your browser!
- **Dashboard UI**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **API Base**: `http://localhost:3001/v1`

---

## Prerequisites (For Full Docker Mode)

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| **Docker** | 20.10+ | `docker --version` |
| **Docker Compose** | 2.0+ | `docker compose version` |
| **Node.js** (for local dev) | 20.0+ | `node --version` |
| **npm** (for local dev) | 9.0+ | `npm --version` |
| **Git** | 2.30+ | `git --version` |

---

## Quick Start (Full Production Mode)

### 1. Set up environment

```bash
cp .env.example .env
```

The defaults work out of the box for local development — no changes needed.

### 2. Start all services via Docker

```bash
docker-compose up -d
```

This starts 4 services:
- **PostgreSQL** (with pgvector) on port `5432`
- **Redis** on port `6379`
- **Neo4j** on port `7474` (browser) / `7687` (bolt)
- **Neura API** on port `3001`

### 4. Wait for services to be healthy

```bash
# Check that all containers are running and healthy
docker-compose ps
```

You should see all 4 services with status `Up (healthy)`. Neo4j can take 30-60 seconds to initialize on first run.

### 5. Run database migrations

```bash
docker-compose exec api node src/db/migrate.js
```

You should see:
```
🔄 Starting database migrations...
  🔧 Applying 001_create_extensions.sql...
  ✅ 001_create_extensions.sql — applied successfully
  🔧 Applying 002_create_tenants.sql...
  ✅ 002_create_tenants.sql — applied successfully
  ...
✅ Migrations complete. 5 new migration(s) applied.
```

### 6. Verify the API is running

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 42.5,
  "version": "1.0.0",
  "services": {
    "postgres": "healthy",
    "redis": "healthy",
    "neo4j": "healthy"
  }
}
```

### 7. Register your first tenant and get an API key

```bash
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company", "tier": "free"}'
```

**Save the `api_key` from the response** — it will not be shown again:
```json
{
  "tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "api_key": "prg_live_abc123...",
  "message": "Store your API key securely — it will not be shown again."
}
```

### 8. Create your first memory

```bash
export API_KEY="prg_live_<your_key_here>"

curl -X POST http://localhost:3001/v1/memory \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "app_id": "chatbot_v1",
    "content": "User prefers dark mode and concise responses",
    "memory_type": "preference",
    "tags": ["ui", "communication"]
  }'
```

### 9. Search for memories

```bash
curl "http://localhost:3001/v1/memory/search?q=dark+mode&user_id=user_123" \
  -H "Authorization: Bearer $API_KEY"
```

**🎉 You're up and running!**

---

## Running Without Docker

If you prefer to run the API server directly (with external database services):

```bash
# 1. Install dependencies
npm install

# 2. Make sure PostgreSQL, Redis, and Neo4j are running
#    and update .env with their connection URLs

# 3. Run migrations
npm run migrate

# 4. Start the API server (with auto-reload)
npm run dev

# Or for production:
npm start
```

---

## Dashboard Setup

Neura includes a React dashboard for managing memories via a web UI.

```bash
# 1. Navigate to the dashboard directory
cd dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The dashboard will be available at **http://localhost:5173** and automatically proxies API calls to `http://localhost:3001`.

### Dashboard Features

- **Login**: Enter your API key to authenticate
- **Dashboard**: Overview stats — total memories, memory types, recent activity
- **Memories**: Browse, filter by type, paginate, view history, delete individual or all
- **Search**: Multi-strategy search with confidence scores and source badges (semantic/keyword/graph)
- **API Keys**: Create new keys, view existing keys (masked), revoke keys

### Building for Production

```bash
cd dashboard
npm run build
```

The built files will be in `dashboard/dist/` and are automatically served by the API server at `/dashboard`.

---

## Project Structure

```
Neura/
├── docker-compose.yml          # 4 services: postgres, redis, neo4j, api
├── Dockerfile                  # Multi-stage Node.js 20 Alpine
├── package.json                # Backend dependencies
├── .env.example                # Environment variable template
├── README.md                   # This file
│
├── src/                        # Backend API
│   ├── index.js                # Express app entry point
│   ├── config/                 # Database/Redis/Neo4j connections
│   │   ├── env.js              # Environment variable parsing
│   │   ├── database.js         # PostgreSQL pool (pg)
│   │   ├── redis.js            # Redis client (ioredis)
│   │   └── neo4j.js            # Neo4j driver singleton
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # API key authentication
│   │   ├── rateLimiter.js      # Redis sliding window rate limiter
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validator.js        # Joi request validation
│   ├── services/               # Core business logic
│   │   ├── embeddingService.js # Local ML embeddings (MiniLM-L6-v2)
│   │   ├── searchService.js    # Multi-strategy search + RRF merge
│   │   ├── ingestionService.js # Memory processing pipeline
│   │   ├── patternService.js   # Behavioral pattern detection
│   │   ├── graphService.js     # Neo4j entity graph operations
│   │   └── cacheService.js     # Redis caching layer
│   ├── controllers/            # Request handlers
│   │   ├── memoryController.js # Memory CRUD
│   │   ├── searchController.js # Search endpoint
│   │   ├── exportController.js # Export/import (Memory Passport)
│   │   └── authController.js   # Tenant registration, API keys
│   ├── routes/                 # Express route definitions
│   │   ├── memory.js           # /v1/memory/* routes
│   │   └── auth.js             # /v1/auth/* routes
│   ├── models/
│   │   └── schemas.js          # Joi validation schemas
│   └── db/
│       ├── migrate.js          # Idempotent migration runner
│       └── migrations/         # SQL migration files
│           ├── 001_create_extensions.sql
│           ├── 002_create_tenants.sql
│           ├── 003_create_memories.sql
│           ├── 004_create_memory_history.sql
│           └── 005_create_api_keys.sql
│
├── dashboard/                  # React frontend (Vite)
│   ├── package.json
│   ├── vite.config.js          # Dev server + API proxy
│   ├── index.html
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Router + auth state
│       ├── index.css           # Design system (dark mode)
│       ├── api/client.js       # Axios API client
│       ├── components/         # Reusable components
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   └── SearchBar.jsx
│       └── pages/              # Page components
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Memories.jsx
│           ├── Search.jsx
│           └── ApiKeys.jsx
│
└── postman/
    └── Neura_API.postman_collection.json  # Full Postman collection
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Clients                         │
│   API Consumers  ←→  React Dashboard             │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│           Express API Gateway (:3001)            │
│  ┌────────┐ ┌────────────┐ ┌──────────────────┐ │
│  │  Auth  │ │ Rate Limit │ │   Validation     │ │
│  └────────┘ └────────────┘ └──────────────────┘ │
│  ┌──────────────────────────────────────────┐    │
│  │  Routes: /v1/memory, /v1/auth            │    │
│  └──────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│              Services                            │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Ingestion │ │  Search  │ │   Embedding    │  │
│  │ Pipeline  │ │  (RRF)   │ │ (MiniLM-L6)   │  │
│  └───────────┘ └──────────┘ └────────────────┘  │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Pattern  │ │  Graph   │ │     Cache      │  │
│  │ Detection │ │ Service  │ │   (Redis)      │  │
│  └───────────┘ └──────────┘ └────────────────┘  │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│           Data Stores                            │
│  ┌─────────────────┐ ┌───────┐ ┌────────────┐   │
│  │ PostgreSQL      │ │ Neo4j │ │   Redis    │   │
│  │ + pgvector      │ │ Graph │ │   Cache    │   │
│  │ + tsvector      │ │       │ │            │   │
│  └─────────────────┘ └───────┘ └────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## API Reference

**Base URL**: `http://localhost:3001`

All endpoints except `/health` and `/v1/auth/register` require authentication:
```
Authorization: Bearer prg_live_<your_api_key>
```

### Health Check

```bash
curl http://localhost:3001/health
```

---

### Authentication

#### Register Tenant
```bash
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company", "tier": "free"}'
```

Response:
```json
{
  "tenant_id": "uuid",
  "api_key": "prg_live_<64_hex_chars>",
  "message": "Store your API key securely — it will not be shown again."
}
```

#### Create Additional API Key
```bash
curl -X POST http://localhost:3001/v1/auth/keys \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production"}'
```

#### List API Keys
```bash
curl http://localhost:3001/v1/auth/keys \
  -H "Authorization: Bearer $API_KEY"
```

#### Revoke API Key
```bash
curl -X DELETE http://localhost:3001/v1/auth/keys/{key_id} \
  -H "Authorization: Bearer $API_KEY"
```

---

### Memory Ingestion

#### Create Memory
```bash
curl -X POST http://localhost:3001/v1/memory \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "app_id": "chatbot_v1",
    "content": "User prefers dark mode and concise responses",
    "memory_type": "preference",
    "session_id": "sess_abc",
    "tags": ["ui", "communication"]
  }'
```

Response:
```json
{
  "id": "uuid",
  "content": "User prefers dark mode and concise responses",
  "memory_type": "preference",
  "confidence": 1.0,
  "derived_memories": [],
  "superseded_id": null
}
```

**Memory Types**: `explicit_fact`, `behavioral_pattern`, `preference`, `entity`, `temporal_fact`

---

### Memory Retrieval

#### Search Memories
```bash
curl "http://localhost:3001/v1/memory/search?q=dark+mode&user_id=user_123&top_k=5" \
  -H "Authorization: Bearer $API_KEY"
```

Response:
```json
{
  "results": [
    {
      "id": "uuid",
      "content": "User prefers dark mode...",
      "memory_type": "preference",
      "score": 0.034,
      "sources": ["semantic", "keyword"],
      "confidence": 1.0
    }
  ],
  "total": 1,
  "query_time_ms": 45
}
```

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search query |
| `user_id` | string | yes | User to search |
| `app_id` | string | no | Filter by app |
| `top_k` | int | no | Max results (default: 10) |
| `before` | ISO date | no | Created before date |
| `after` | ISO date | no | Created after date |
| `as_of` | ISO date | no | Valid-at timestamp |

---

### Memory Management

#### List Memories
```bash
curl "http://localhost:3001/v1/memory/list?user_id=user_123&page=1&limit=20" \
  -H "Authorization: Bearer $API_KEY"
```

#### Get Single Memory
```bash
curl http://localhost:3001/v1/memory/{memory_id} \
  -H "Authorization: Bearer $API_KEY"
```

#### Update Memory
```bash
curl -X PATCH http://localhost:3001/v1/memory/{memory_id} \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated preference: user now prefers light mode"}'
```

#### Delete Memory
```bash
curl -X DELETE http://localhost:3001/v1/memory/{memory_id} \
  -H "Authorization: Bearer $API_KEY"
```

#### Delete All User Memories
```bash
curl -X DELETE http://localhost:3001/v1/memory/user/user_123 \
  -H "Authorization: Bearer $API_KEY"
```

#### Get Memory History
```bash
curl http://localhost:3001/v1/memory/history/{memory_id} \
  -H "Authorization: Bearer $API_KEY"
```

---

### Memory Passport (Export/Import)

#### Export All Memories for a User
```bash
curl -X POST http://localhost:3001/v1/memory/export \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123"}'
```

#### Import Memories
```bash
curl -X POST http://localhost:3001/v1/memory/import \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @exported_memories.json
```

---

## End-to-End Testing Guide

After starting the services, run through this complete flow to verify everything works:

```bash
# Set your base URL
BASE=http://localhost:3001

# ── Step 1: Register a tenant ──
RESPONSE=$(curl -s -X POST $BASE/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Corp", "tier": "free"}')
echo $RESPONSE

# Extract the API key (copy from the response above)
API_KEY="prg_live_<paste_your_key>"

# ── Step 2: Create several memories ──
curl -s -X POST $BASE/v1/memory \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"alice","app_id":"demo","content":"Alice is a senior engineer at Acme Corp","memory_type":"explicit_fact","tags":["identity"]}'

curl -s -X POST $BASE/v1/memory \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"alice","app_id":"demo","content":"Alice prefers Python over JavaScript and dark mode IDEs","memory_type":"preference","tags":["coding","ui"]}'

curl -s -X POST $BASE/v1/memory \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"alice","app_id":"demo","content":"Alice worked with Bob on Project Phoenix for the Machine Learning team","memory_type":"entity","tags":["people","projects"]}'

# ── Step 3: Search memories ──
curl -s "$BASE/v1/memory/search?q=coding+preferences&user_id=alice&top_k=5" \
  -H "Authorization: Bearer $API_KEY" | python3 -m json.tool

# ── Step 4: List all memories ──
curl -s "$BASE/v1/memory/list?user_id=alice" \
  -H "Authorization: Bearer $API_KEY" | python3 -m json.tool

# ── Step 5: Update a memory (use an ID from step 4) ──
MEMORY_ID="<paste_memory_id_here>"
curl -s -X PATCH "$BASE/v1/memory/$MEMORY_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"Alice is now a Staff Engineer at Acme Corp (promoted Jan 2025)"}'

# ── Step 6: View change history ──
curl -s "$BASE/v1/memory/history/$MEMORY_ID" \
  -H "Authorization: Bearer $API_KEY" | python3 -m json.tool

# ── Step 7: Export all memories ──
curl -s -X POST $BASE/v1/memory/export \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"alice"}' > alice_export.json

cat alice_export.json | python3 -m json.tool

# ── Step 8: Import memories (as a different user) ──
# Edit alice_export.json and change user_id to "alice_copy"
cat alice_export.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
data['user_id'] = 'alice_copy'
print(json.dumps(data))
" > alice_import.json

curl -s -X POST $BASE/v1/memory/import \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @alice_import.json | python3 -m json.tool

# ── Step 9: Verify multi-tenant isolation ──
# Register a second tenant
curl -s -X POST $BASE/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Other Corp", "tier": "free"}'
# Use the new API key — should NOT see Test Corp's memories
NEW_API_KEY="prg_live_<paste_second_key>"
curl -s "$BASE/v1/memory/list?user_id=alice" \
  -H "Authorization: Bearer $NEW_API_KEY" | python3 -m json.tool
# Result: total should be 0

# ── Step 10: Delete a memory ──
curl -s -X DELETE "$BASE/v1/memory/$MEMORY_ID" \
  -H "Authorization: Bearer $API_KEY"

# ── Step 11: Bulk delete all user memories ──
curl -s -X DELETE "$BASE/v1/memory/user/alice" \
  -H "Authorization: Bearer $API_KEY"
```

### Using Postman

Import the collection from `postman/Neura_API.postman_collection.json` into Postman. Run the requests in order — the collection auto-saves your API key and memory IDs between requests.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://neura:neura_dev@localhost:5432/neura_db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j Bolt protocol URI |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | `neura_dev_password` | Neo4j password |
| `JWT_SECRET` | `change_this_in_production` | Secret for JWT signing |
| `EMBEDDING_MODEL` | `Xenova/all-MiniLM-L6-v2` | HuggingFace embedding model |
| `EMBEDDING_DIMENSIONS` | `384` | Vector embedding dimensions |
| `RATE_LIMIT_FREE` | `100` | Requests/min for free tier |
| `RATE_LIMIT_PRO` | `1000` | Requests/min for pro tier |
| `RATE_LIMIT_ENTERPRISE` | `5000` | Requests/min for enterprise tier |
| `CACHE_TTL_SEARCH` | `60` | Search result cache TTL (seconds) |
| `CACHE_TTL_MEMORY_LIST` | `30` | Memory list cache TTL (seconds) |
| `CACHE_TTL_AUTH` | `300` | Auth cache TTL (seconds) |

---

## Search Strategy

Neura uses **Reciprocal Rank Fusion (RRF)** to merge results from three parallel search strategies:

1. **Semantic Search** — pgvector cosine similarity on 384-dim embeddings (MiniLM-L6-v2)
2. **Keyword Search** — PostgreSQL tsvector full-text search with ts_rank_cd
3. **Graph Search** — Neo4j entity relationship traversal (2-hop)

```
RRF_score = Σ (weight / (k + rank)) for each strategy
```

Weights: semantic=1.0, keyword=0.8, graph=0.6, k=60

---

## Docker Services

| Service | Image | Port(s) | Purpose |
|---------|-------|---------|---------|
| `postgres` | `pgvector/pgvector:pg16` | 5432 | Primary DB + vector embeddings |
| `redis` | `redis:7-alpine` | 6379 | Cache + rate limiting |
| `neo4j` | `neo4j:5-community` | 7474, 7687 | Entity relationship graph |
| `api` | Node.js 20 Alpine | 3001 | Neura API server |

### Useful Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Restart the API only
docker-compose restart api

# Stop all services (preserves data)
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Run migrations
docker-compose exec api node src/db/migrate.js

# Access PostgreSQL directly
docker-compose exec postgres psql -U neura -d neura_db

# Access Neo4j browser
open http://localhost:7474
# Login: neo4j / neura_dev_password
```

---

## Troubleshooting

### Neo4j takes too long to start
Neo4j can take 30-60 seconds on first boot. If the API container keeps restarting:
```bash
docker-compose logs neo4j     # Check Neo4j logs
docker-compose restart api    # Restart API after Neo4j is ready
```

### "Cannot connect to PostgreSQL"
```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify connection string in .env matches docker-compose
```

### First API request is slow
The embedding model (~30MB) downloads on first use and is cached. The first `POST /v1/memory` or `GET /v1/memory/search` will take 10-30 seconds. Subsequent requests are fast.

### Port conflicts
If ports 5432, 6379, 7474, 7687, or 3001 are already in use, edit the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use 5433 instead of 5432
```
And update your `.env` file accordingly.

### Resetting everything
```bash
docker-compose down -v    # Remove all containers and volumes
docker-compose up -d      # Fresh start
docker-compose exec api node src/db/migrate.js  # Re-run migrations
```

---

## License

MIT
