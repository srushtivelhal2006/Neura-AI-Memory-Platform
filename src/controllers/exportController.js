const { query } = require('../config/database');
const { generateEmbedding } = require('../services/embeddingService');
const graphService = require('../services/graphService');

async function exportMemories(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { user_id, app_id } = req.validatedBody;

    let sql = `
      SELECT id, user_id, app_id, org_id, session_id, content, memory_type,
             tags, metadata, confidence, valid_from, valid_until,
             created_at, updated_at
      FROM memories
      WHERE tenant_id = $1 AND user_id = $2 AND is_active = true
    `;
    const params = [tenant_id, user_id];

    if (app_id) {
      sql += ' AND app_id = $3';
      params.push(app_id);
    }

    sql += ' ORDER BY created_at ASC';

    const memoriesResult = await query(sql, params);
    const entityGraph = await graphService.getEntityGraph(user_id, tenant_id);

    const exportData = {
      schema_version: '1.0',
      exported_at: new Date().toISOString(),
      user_id,
      memories: memoriesResult.rows.map((m) => ({
        content: m.content,
        memory_type: m.memory_type,
        app_id: m.app_id,
        org_id: m.org_id,
        session_id: m.session_id,
        tags: m.tags,
        metadata: m.metadata,
        confidence: m.confidence,
        valid_from: m.valid_from,
        valid_until: m.valid_until,
        created_at: m.created_at,
      })),
      entity_graph: entityGraph,
      metadata: {
        source_platform: 'pragma',
        total_memories: memoriesResult.rows.length,
        export_version: '1.0',
      },
    };

    res.json(exportData);
  } catch (err) {
    next(err);
  }
}

async function importMemories(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const importData = req.validatedBody;

    if (importData.schema_version !== '1.0') {
      return res.status(422).json({
        error: 'Unprocessable Entity',
        message: `Unsupported schema version: ${importData.schema_version}. Supported: 1.0`,
        code: 'UNSUPPORTED_SCHEMA',
        timestamp: new Date().toISOString(),
      });
    }

    const userId = importData.user_id;
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < importData.memories.length; i++) {
      const mem = importData.memories[i];

      try {
        const embedding = await generateEmbedding(mem.content);
        const embeddingStr = `[${embedding.join(',')}]`;

        const importMetadata = {
          ...(mem.metadata || {}),
          imported: true,
          import_source: importData.metadata?.source_platform || 'unknown',
          imported_at: new Date().toISOString(),
          original_created_at: mem.created_at || null,
        };

        const result = await query(
          `INSERT INTO memories (tenant_id, user_id, app_id, org_id, session_id, content, memory_type, tags, metadata, embedding, confidence, valid_from, valid_until)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, $11, $12, $13)
           RETURNING id`,
          [
            tenant_id,
            userId,
            mem.app_id || 'imported',
            mem.org_id || null,
            mem.session_id || null,
            mem.content,
            mem.memory_type,
            JSON.stringify(mem.tags || []),
            JSON.stringify(importMetadata),
            embeddingStr,
            mem.confidence || 1.0,
            mem.valid_from || new Date().toISOString(),
            mem.valid_until || null,
          ]
        );

        const memoryId = result.rows[0].id;

        await query(
          `INSERT INTO memory_history (memory_id, new_content, change_type, changed_by, metadata)
           VALUES ($1, $2, 'created', $3, $4)`,
          [memoryId, mem.content, userId, JSON.stringify({ imported: true })]
        );

        const entities = await graphService.extractEntities(mem.content);
        await graphService.createMemoryNode(memoryId, userId, mem.content, entities, tenant_id);

        imported++;
      } catch (err) {
        errors.push({
          index: i,
          content: mem.content?.substring(0, 100),
          error: err.message,
        });
        skipped++;
      }
    }

    res.json({
      imported,
      skipped,
      total: importData.memories.length,
      errors,
      message: `Import complete: ${imported} imported, ${skipped} skipped`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { exportMemories, importMemories };
