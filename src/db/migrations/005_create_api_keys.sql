-- 005_create_api_keys.sql
-- Additional indexes and constraints for API key performance

-- Ensure key_prefix is always indexed for fast lookup during auth
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix_lookup ON api_keys(key_prefix) WHERE revoked_at IS NULL;

-- Track usage patterns
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at);

-- Migration tracking table to prevent re-running migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
