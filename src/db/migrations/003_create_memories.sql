-- 003_create_memories.sql
-- Core memories table with pgvector embeddings and full-text search

CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    app_id VARCHAR(255) NOT NULL,
    org_id VARCHAR(255),
    session_id VARCHAR(255),
    content TEXT NOT NULL,
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN (
        'explicit_fact', 'behavioral_pattern', 'preference', 'entity', 'temporal_fact'
    )),
    tags JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    embedding vector(384),
    content_tsv tsvector,
    confidence FLOAT NOT NULL DEFAULT 1.0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    superseded_by UUID REFERENCES memories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for tenant-scoped user queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_memories_tenant_user ON memories(tenant_id, user_id);

-- App-level filtering
CREATE INDEX IF NOT EXISTS idx_memories_app ON memories(tenant_id, app_id);

-- Memory type filtering
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(tenant_id, memory_type);

-- Full-text search via GIN index on tsvector
CREATE INDEX IF NOT EXISTS idx_memories_tsv ON memories USING GIN(content_tsv);

-- HNSW index for fast approximate nearest-neighbor vector search
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING hnsw(embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- Temporal validity queries
CREATE INDEX IF NOT EXISTS idx_memories_temporal ON memories(valid_from, valid_until);

-- Active-only partial index for faster filtered queries
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(tenant_id, user_id, is_active) WHERE is_active = true;

-- Trigger to auto-update content_tsv on insert/update
CREATE OR REPLACE FUNCTION update_content_tsv() RETURNS trigger AS $$
BEGIN
    NEW.content_tsv := to_tsvector('english', NEW.content);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_content_tsv ON memories;
CREATE TRIGGER trg_update_content_tsv
    BEFORE INSERT OR UPDATE OF content ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_content_tsv();
