const { query } = require('../config/database');
const { generateEmbedding } = require('./embeddingService');
const graphService = require('./graphService');
const cacheService = require('./cacheService');
const env = require('../config/env');

async function search({ queryText, userId, appId, tenantId, topK = 10, before, after, asOf }) {
  const startTime = Date.now();

  const [semanticResults, keywordResults, graphResults] = await Promise.all([
    semanticSearch({ queryText, userId, appId, tenantId, topK, before, after, asOf }),
    keywordSearch({ queryText, userId, appId, tenantId, topK, before, after, asOf }),
    graphSearch({ queryText, userId, tenantId, topK }),
  ]);

  const merged = mergeWithRRF(semanticResults, keywordResults, graphResults, topK);

  const queryTimeMs = Date.now() - startTime;

  return {
    results: merged,
    total: merged.length,
    query_time_ms: queryTimeMs,
  };
}

async function semanticSearch({ queryText, userId, appId, tenantId, topK, before, after, asOf }) {
  try {
    const embedding = await generateEmbedding(queryText);
    const embeddingStr = `[${embedding.join(',')}]`;

    let sql = `
      SELECT id, content, memory_type, tags, metadata, confidence,
             valid_from, valid_until, created_at, updated_at,
             1 - (embedding <=> $1::vector) AS similarity
      FROM memories
      WHERE tenant_id = $2
        AND user_id = $3
        AND is_active = true
        AND embedding IS NOT NULL
    `;

    const params = [embeddingStr, tenantId, userId];
    let paramIndex = 4;

    if (appId) {
      sql += ` AND app_id = $${paramIndex}`;
      params.push(appId);
      paramIndex++;
    }

    if (before) {
      sql += ` AND created_at < $${paramIndex}`;
      params.push(before);
      paramIndex++;
    }

    if (after) {
      sql += ` AND created_at > $${paramIndex}`;
      params.push(after);
      paramIndex++;
    }

    if (asOf) {
      sql += ` AND valid_from <= $${paramIndex} AND (valid_until IS NULL OR valid_until > $${paramIndex})`;
      params.push(asOf);
      paramIndex++;
    }

    sql += ` ORDER BY embedding <=> $1::vector LIMIT $${paramIndex}`;
    params.push(topK);

    const result = await query(sql, params);

    return result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      source: 'semantic',
      score: parseFloat(row.similarity) || 0,
    }));
  } catch (err) {
    console.error('Semantic search error:', err.message);
    return [];
  }
}

async function keywordSearch({ queryText, userId, appId, tenantId, topK, before, after, asOf }) {
  try {
    let sql = `
      SELECT id, content, memory_type, tags, metadata, confidence,
             valid_from, valid_until, created_at, updated_at,
             ts_rank_cd(content_tsv, plainto_tsquery('english', $1)) AS rank_score
      FROM memories
      WHERE tenant_id = $2
        AND user_id = $3
        AND is_active = true
        AND content_tsv @@ plainto_tsquery('english', $1)
    `;

    const params = [queryText, tenantId, userId];
    let paramIndex = 4;

    if (appId) {
      sql += ` AND app_id = $${paramIndex}`;
      params.push(appId);
      paramIndex++;
    }

    if (before) {
      sql += ` AND created_at < $${paramIndex}`;
      params.push(before);
      paramIndex++;
    }

    if (after) {
      sql += ` AND created_at > $${paramIndex}`;
      params.push(after);
      paramIndex++;
    }

    if (asOf) {
      sql += ` AND valid_from <= $${paramIndex} AND (valid_until IS NULL OR valid_until > $${paramIndex})`;
      params.push(asOf);
      paramIndex++;
    }

    sql += ` ORDER BY rank_score DESC LIMIT $${paramIndex}`;
    params.push(topK);

    const result = await query(sql, params);

    return result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      source: 'keyword',
      score: parseFloat(row.rank_score) || 0,
    }));
  } catch (err) {
    console.error('Keyword search error:', err.message);
    return [];
  }
}

async function graphSearch({ queryText, userId, tenantId, topK }) {
  try {
    const memoryIds = await graphService.searchByEntity(queryText, userId, tenantId, topK);

    if (memoryIds.length === 0) {
      return [];
    }

    const placeholders = memoryIds.map((_, i) => `$${i + 3}`).join(', ');
    const sql = `
      SELECT id, content, memory_type, tags, metadata, confidence,
             valid_from, valid_until, created_at, updated_at
      FROM memories
      WHERE tenant_id = $1
        AND user_id = $2
        AND is_active = true
        AND id IN (${placeholders})
    `;

    const params = [tenantId, userId, ...memoryIds];
    const result = await query(sql, params);

    return result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      source: 'graph',
      score: 1.0 / (index + 1),
    }));
  } catch (err) {
    console.error('Graph search error:', err.message);
    return [];
  }
}

function mergeWithRRF(semanticResults, keywordResults, graphResults, topK) {
  const k = 60;
  const scoreMap = new Map();

  function addScores(results, sourceName, weight = 1.0) {
    for (const result of results) {
      const id = result.id;
      if (!scoreMap.has(id)) {
        scoreMap.set(id, {
          memory: result,
          rrfScore: 0,
          sources: [],
        });
      }

      const entry = scoreMap.get(id);
      entry.rrfScore += weight * (1.0 / (k + result.rank));
      entry.sources.push(sourceName);

      if (!entry.memory.tags && result.tags) {
        entry.memory = result;
      }
    }
  }

  addScores(semanticResults, 'semantic', 1.0);
  addScores(keywordResults, 'keyword', 0.8);
  addScores(graphResults, 'graph', 0.6);

  const merged = Array.from(scoreMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK)
    .map((entry) => ({
      id: entry.memory.id,
      content: entry.memory.content,
      memory_type: entry.memory.memory_type,
      tags: entry.memory.tags,
      metadata: entry.memory.metadata,
      confidence: entry.memory.confidence,
      valid_from: entry.memory.valid_from,
      valid_until: entry.memory.valid_until,
      created_at: entry.memory.created_at,
      updated_at: entry.memory.updated_at,
      score: parseFloat(entry.rrfScore.toFixed(6)),
      sources: [...new Set(entry.sources)],
    }));

  return merged;
}

module.exports = { search };
