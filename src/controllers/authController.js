const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const TIER_LIMITS = {
  free: { max_memories: 1000, max_apps: 1, rate_limit: 100 },
  pro: { max_memories: 50000, max_apps: 5, rate_limit: 1000 },
  enterprise: { max_memories: -1, max_apps: -1, rate_limit: 5000 },
};

async function register(req, res, next) {
  try {
    const { name, org_id, tier } = req.validatedBody;
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    const tenantResult = await query(
      `INSERT INTO tenants (name, org_id, tier, max_memories, max_apps)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, org_id, tier, max_memories, max_apps, created_at`,
      [name, org_id || null, tier, limits.max_memories, limits.max_apps]
    );

    const tenant = tenantResult.rows[0];

    const rawKey = `prg_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 16);
    const keyHash = await bcrypt.hash(rawKey, 12);

    await query(
      `INSERT INTO api_keys (tenant_id, key_hash, key_prefix, name, permissions, rate_limit)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tenant.id,
        keyHash,
        keyPrefix,
        'Default',
        JSON.stringify({ read: true, write: true, delete: true, admin: true }),
        limits.rate_limit,
      ]
    );

    res.status(201).json({
      tenant_id: tenant.id,
      name: tenant.name,
      org_id: tenant.org_id,
      tier: tenant.tier,
      api_key: rawKey,
      created_at: tenant.created_at,
      message: 'Store your API key securely — it will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
}

async function createKey(req, res, next) {
  try {
    const { tenant_id, tier } = req.tenant;
    const { name, permissions } = req.validatedBody;
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    const rawKey = `prg_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 16);
    const keyHash = await bcrypt.hash(rawKey, 12);

    const result = await query(
      `INSERT INTO api_keys (tenant_id, key_hash, key_prefix, name, permissions, rate_limit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, permissions, rate_limit, created_at`,
      [
        tenant_id,
        keyHash,
        keyPrefix,
        name,
        JSON.stringify(permissions),
        limits.rate_limit,
      ]
    );

    res.status(201).json({
      id: result.rows[0].id,
      api_key: rawKey,
      name: result.rows[0].name,
      permissions: result.rows[0].permissions,
      created_at: result.rows[0].created_at,
      message: 'Store your API key securely — it will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
}

async function listKeys(req, res, next) {
  try {
    const { tenant_id } = req.tenant;

    const result = await query(
      `SELECT id, key_prefix, name, permissions, rate_limit, last_used_at, created_at, revoked_at
       FROM api_keys
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenant_id]
    );

    const keys = result.rows.map((row) => ({
      id: row.id,
      key_preview: `${row.key_prefix}****`,
      name: row.name,
      permissions: row.permissions,
      rate_limit: row.rate_limit,
      last_used_at: row.last_used_at,
      created_at: row.created_at,
      revoked_at: row.revoked_at,
      is_active: !row.revoked_at,
    }));

    res.json({ keys, total: keys.length });
  } catch (err) {
    next(err);
  }
}

async function revokeKey(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { id } = req.params;

    const result = await query(
      `UPDATE api_keys
       SET revoked_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
       RETURNING id, name, revoked_at`,
      [id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API key not found or already revoked',
        code: 'KEY_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      revoked_at: result.rows[0].revoked_at,
      message: 'API key revoked successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, createKey, listKeys, revokeKey };
