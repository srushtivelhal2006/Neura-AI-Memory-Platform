const { query } = require('../config/database');
const { generateEmbedding } = require('./embeddingService');
const { analyzePatterns } = require('./patternService');
const graphService = require('./graphService');
const cacheService = require('./cacheService');

async function ingest({ tenantId, userId, appId, orgId, sessionId, content, memoryType, tags, metadata }) {
  const embedding = await generateEmbedding(content);
  const embeddingStr = `[${embedding.join(',')}]`;

  const { derivedMemories, supersedes } = await analyzePatterns(
    { user_id: userId, app_id: appId, org_id: orgId, session_id: sessionId, content },
    tenantId
  );

  let supersededId = null;

  if (supersedes) {
    supersededId = supersedes.memory_id;

    await query(
      `UPDATE memories
       SET is_active = false, superseded_by = NULL, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [supersededId, tenantId]
    );

    await query(
      `INSERT INTO memory_history (memory_id, previous_content, new_content, change_type, changed_by, metadata)
       SELECT id, content, $3, 'superseded', $4, $5
       FROM memories WHERE id = $1 AND tenant_id = $2`,
      [
        supersededId,
        tenantId,
        content,
        userId,
        JSON.stringify({ superseded_by_content: content }),
      ]
    );
  }

  const memoryResult = await query(
    `INSERT INTO memories (tenant_id, user_id, app_id, org_id, session_id, content, memory_type, tags, metadata, embedding, confidence, valid_from)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, $11, NOW())
     RETURNING id, tenant_id, user_id, app_id, org_id, session_id, content, memory_type, tags, metadata, confidence, valid_from, valid_until, is_active, created_at, updated_at`,
    [
      tenantId,
      userId,
      appId,
      orgId || null,
      sessionId || null,
      content,
      memoryType,
      JSON.stringify(tags || []),
      JSON.stringify(metadata || {}),
      embeddingStr,
      supersedes?.confidence_drop ? 0.8 : 1.0,
    ]
  );

  const memory = memoryResult.rows[0];

  if (supersededId) {
    await query(
      `UPDATE memories SET superseded_by = $1 WHERE id = $2 AND tenant_id = $3`,
      [memory.id, supersededId, tenantId]
    );
  }

  await query(
    `INSERT INTO memory_history (memory_id, new_content, change_type, changed_by, metadata)
     VALUES ($1, $2, 'created', $3, $4)`,
    [
      memory.id,
      content,
      userId,
      JSON.stringify({ memory_type: memoryType, session_id: sessionId }),
    ]
  );

  const entities = await graphService.extractEntities(content);
  await graphService.createMemoryNode(memory.id, userId, content, entities, tenantId);

  await cacheService.invalidateUserCache(tenantId, userId);

  const storedDerived = [];
  for (const derived of derivedMemories) {
    try {
      const derivedResult = await ingestDerived({
        tenantId,
        userId: derived.user_id,
        appId: derived.app_id,
        orgId: derived.org_id,
        sessionId: derived.session_id,
        content: derived.content,
        memoryType: derived.memory_type,
        tags: derived.tags,
        metadata: derived.metadata,
        confidence: derived.confidence,
      });
      storedDerived.push(derivedResult);
    } catch (err) {
      console.error('Failed to store derived memory (non-fatal):', err.message);
    }
  }

  return {
    memory,
    derived_memories: storedDerived,
    superseded_id: supersededId,
  };
}

async function ingestDerived({ tenantId, userId, appId, orgId, sessionId, content, memoryType, tags, metadata, confidence }) {
  const embedding = await generateEmbedding(content);
  const embeddingStr = `[${embedding.join(',')}]`;

  const result = await query(
    `INSERT INTO memories (tenant_id, user_id, app_id, org_id, session_id, content, memory_type, tags, metadata, embedding, confidence, valid_from)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, $11, NOW())
     RETURNING id, content, memory_type, confidence, created_at`,
    [
      tenantId,
      userId,
      appId,
      orgId || null,
      sessionId || null,
      content,
      memoryType,
      JSON.stringify(tags || []),
      JSON.stringify(metadata || {}),
      embeddingStr,
      confidence || 0.7,
    ]
  );

  const derived = result.rows[0];

  await query(
    `INSERT INTO memory_history (memory_id, new_content, change_type, changed_by, metadata)
     VALUES ($1, $2, 'created', $3, $4)`,
    [derived.id, content, userId, JSON.stringify({ auto_generated: true })]
  );

  return derived;
}

module.exports = { ingest };
