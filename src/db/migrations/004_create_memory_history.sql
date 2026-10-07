-- 004_create_memory_history.sql
-- Full audit trail for every memory change

CREATE TABLE IF NOT EXISTS memory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    previous_content TEXT,
    new_content TEXT,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN (
        'created', 'updated', 'superseded', 'deleted'
    )),
    changed_by VARCHAR(255),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_memory_history_memory ON memory_history(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_history_time ON memory_history(changed_at);
