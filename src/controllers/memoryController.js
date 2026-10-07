const { query } = require('../config/database');
const ingestionService = require('../services/ingestionService');
const { generateEmbedding } = require('../services/embeddingService');
const graphService = require('../services/graphService');
const cacheService = require('../services/cacheService');

async function createMemory(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { user_id, app_id, org_id, session_id, content, memory_type, tags, metadata, valid_until } = req.validatedBody;

    const result = await ingestionService.ingest({
      tenantId: tenant_id,
      userId: user_id,
      appId: app_id,
      orgId: org_id,
      sessionId: session_id,
      content,
      memoryType: memory_type,
      tags,
      metadata,
    });

    if (valid_until) {
      await query(
        'UPDATE memories SET valid_until = $1 WHERE id = $2 AND tenant_id = $3',
        [valid_until, result.memory.id, tenant_id]
      );
      result.memory.valid_until = valid_until;
    }

    res.status(201).json({
      id: result.memory.id,
      content: result.memory.content,
      memory_type: result.memory.memory_type,
      confidence: result.memory.confidence,
      tags: result.memory.tags,
      metadata: result.memory.metadata,
      valid_from: result.memory.valid_from,
      valid_until: result.memory.valid_until,
      created_at: result.memory.created_at,
      derived_memories: result.derived_memories.map((d) => ({
        id: d.id,
        content: d.content,
        memory_type: d.memory_type,
        confidence: d.confidence,
      })),
      superseded_id: result.superseded_id,
    });
  } catch (err) {
    next(err);
  }
}

async function listMemories(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { user_id, app_id, memory_type, page, limit, include_inactive } = req.validatedQuery;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT id, user_id, app_id, org_id, session_id, content, memory_type,
             tags, metadata, confidence, valid_from, valid_until,
             superseded_by, is_active, created_at, updated_at
      FROM memories
      WHERE tenant_id = $1 AND user_id = $2
    `;
    let countSql = `SELECT COUNT(*) AS total FROM memories WHERE tenant_id = $1 AND user_id = $2`;

    const params = [tenant_id, user_id];
    const countParams = [tenant_id, user_id];
    let paramIndex = 3;

    if (!include_inactive) {
      sql += ' AND is_active = true';
      countSql += ' AND is_active = true';
    }

    if (app_id) {
      sql += ` AND app_id = $${paramIndex}`;
      countSql += ` AND app_id = $${paramIndex}`;
      params.push(app_id);
      countParams.push(app_id);
      paramIndex++;
    }

    if (memory_type) {
      sql += ` AND memory_type = $${paramIndex}`;
      countSql += ` AND memory_type = $${paramIndex}`;
      params.push(memory_type);
      countParams.push(memory_type);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [memoriesResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams),
    ]);

    res.json({
      memories: memoriesResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
}

async function getMemory(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { id } = req.params;

    const result = await query(
      `SELECT id, user_id, app_id, org_id, session_id, content, memory_type,
              tags, metadata, confidence, valid_from, valid_until,
              superseded_by, is_active, created_at, updated_at
       FROM memories
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Memory not found',
        code: 'MEMORY_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateMemory(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { id } = req.params;
    const updates = req.validatedBody;

    const existing = await query(
      'SELECT id, content, memory_type, tags, metadata, confidence, user_id FROM memories WHERE id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Memory not found',
        code: 'MEMORY_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    const prev = existing.rows[0];
    const setClauses = [];
    const params = [id, tenant_id];
    let paramIndex = 3;

    if (updates.content !== undefined) {
      const embedding = await generateEmbedding(updates.content);
      const embeddingStr = `[${embedding.join(',')}]`;

      setClauses.push(`content = $${paramIndex}`);
      params.push(updates.content);
      paramIndex++;

      setClauses.push(`embedding = $${paramIndex}::vector`);
      params.push(embeddingStr);
      paramIndex++;
    }

    if (updates.memory_type !== undefined) {
      setClauses.push(`memory_type = $${paramIndex}`);
      params.push(updates.memory_type);
      paramIndex++;
    }

    if (updates.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex}`);
      params.push(JSON.stringify(updates.tags));
      paramIndex++;
    }

    if (updates.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex}`);
      params.push(JSON.stringify(updates.metadata));
      paramIndex++;
    }

    if (updates.valid_until !== undefined) {
      setClauses.push(`valid_until = $${paramIndex}`);
      params.push(updates.valid_until);
      paramIndex++;
    }

    if (updates.confidence !== undefined) {
      setClauses.push(`confidence = $${paramIndex}`);
      params.push(updates.confidence);
      paramIndex++;
    }

    setClauses.push('updated_at = NOW()');

    const result = await query(
      `UPDATE memories SET ${setClauses.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING id, user_id, app_id, org_id, session_id, content, memory_type,
                 tags, metadata, confidence, valid_from, valid_until,
                 superseded_by, is_active, created_at, updated_at`,
      params
    );

    await query(
      `INSERT INTO memory_history (memory_id, previous_content, new_content, change_type, changed_by, metadata)
       VALUES ($1, $2, $3, 'updated', $4, $5)`,
      [
        id,
        prev.content,
        updates.content || prev.content,
        prev.user_id,
        JSON.stringify({ updated_fields: Object.keys(updates) }),
      ]
    );

    await cacheService.invalidateUserCache(tenant_id, prev.user_id);

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteMemory(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { id } = req.params;

    const existing = await query(
      'SELECT id, content, user_id FROM memories WHERE id = $1 AND tenant_id = $2 AND is_active = true',
      [id, tenant_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Memory not found or already deleted',
        code: 'MEMORY_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    const memory = existing.rows[0];

    await query(
      'UPDATE memories SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    await query(
      `INSERT INTO memory_history (memory_id, previous_content, change_type, changed_by)
       VALUES ($1, $2, 'deleted', $3)`,
      [id, memory.content, memory.user_id]
    );

    await graphService.deleteMemoryNode(id);
    await cacheService.invalidateUserCache(tenant_id, memory.user_id);

    res.json({
      id,
      deleted: true,
      message: 'Memory deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUserMemories(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { user_id } = req.params;

    const countResult = await query(
      'SELECT COUNT(*) AS total FROM memories WHERE tenant_id = $1 AND user_id = $2 AND is_active = true',
      [tenant_id, user_id]
    );

    const total = parseInt(countResult.rows[0].total, 10);

    if (total === 0) {
      return res.json({ deleted_count: 0, message: 'No active memories found for this user' });
    }

    await query(
      'UPDATE memories SET is_active = false, updated_at = NOW() WHERE tenant_id = $1 AND user_id = $2 AND is_active = true',
      [tenant_id, user_id]
    );

    await graphService.deleteUserNodes(user_id, tenant_id);
    await cacheService.invalidateUserCache(tenant_id, user_id);

    res.json({
      deleted_count: total,
      user_id,
      message: `Deleted ${total} memories for user`,
    });
  } catch (err) {
    next(err);
  }
}

async function getMemoryHistory(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { id } = req.params;

    const memoryCheck = await query(
      'SELECT id FROM memories WHERE id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (memoryCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Memory not found',
        code: 'MEMORY_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await query(
      `SELECT id, memory_id, previous_content, new_content, change_type, changed_by, changed_at, metadata
       FROM memory_history
       WHERE memory_id = $1
       ORDER BY changed_at ASC`,
      [id]
    );

    res.json({
      memory_id: id,
      history: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createMemory,
  listMemories,
  getMemory,
  updateMemory,
  deleteMemory,
  deleteUserMemories,
  getMemoryHistory,
};
