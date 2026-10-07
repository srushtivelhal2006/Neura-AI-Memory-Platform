-- 001_create_extensions.sql
-- Enable pgvector for embedding storage and uuid generation

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
