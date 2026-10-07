const neo4jConfig = require('../config/neo4j');

async function extractEntities(text) {
  const entities = [];

  const quoted = text.match(/"([^"]+)"/g);
  if (quoted) {
    for (const q of quoted) {
      entities.push(q.replace(/"/g, '').trim());
    }
  }

  const words = text.split(/\s+/);
  let currentProper = [];

  for (const word of words) {
    const cleaned = word.replace(/[^a-zA-Z']/g, '');
    if (!cleaned) {
      if (currentProper.length >= 2) {
        entities.push(currentProper.join(' '));
      }
      currentProper = [];
      continue;
    }

    if (cleaned[0] === cleaned[0].toUpperCase() && cleaned[0] !== cleaned[0].toLowerCase()) {
      currentProper.push(cleaned);
    } else {
      if (currentProper.length >= 2) {
        entities.push(currentProper.join(' '));
      }
      currentProper = [];
    }
  }

  if (currentProper.length >= 2) {
    entities.push(currentProper.join(' '));
  }

  const unique = [...new Set(entities.map((e) => e.trim()).filter((e) => e.length > 1))];
  return unique;
}

async function createMemoryNode(memoryId, userId, content, entities, tenantId) {
  const session = neo4jConfig.getSession();

  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (u:User {userId: $userId, tenantId: $tenantId})
         ON CREATE SET u.createdAt = datetime()
         RETURN u`,
        { userId, tenantId }
      );

      await tx.run(
        `CREATE (m:Memory {
          memoryId: $memoryId,
          userId: $userId,
          tenantId: $tenantId,
          content: $content,
          createdAt: datetime()
        })
        WITH m
        MATCH (u:User {userId: $userId, tenantId: $tenantId})
        MERGE (u)-[:HAS_MEMORY]->(m)`,
        { memoryId, userId, tenantId, content: content.substring(0, 500) }
      );

      for (const entity of entities) {
        await tx.run(
          `MATCH (m:Memory {memoryId: $memoryId})
           MERGE (e:Entity {name: $entity, tenantId: $tenantId})
           ON CREATE SET e.createdAt = datetime()
           MERGE (m)-[:MENTIONS]->(e)`,
          { memoryId, entity, tenantId }
        );
      }
    });
  } catch (err) {
    console.error('Neo4j createMemoryNode error (non-fatal):', err.message);
  } finally {
    await session.close();
  }
}

async function searchByEntity(queryText, userId, tenantId, limit = 20) {
  const session = neo4jConfig.getSession();

  try {
    const entities = await extractEntities(queryText);

    if (entities.length === 0) {
      const words = queryText
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5);

      if (words.length === 0) {
        return [];
      }

      const result = await session.executeRead(async (tx) => {
        return tx.run(
          `MATCH (m:Memory {tenantId: $tenantId, userId: $userId})
           WHERE any(word IN $words WHERE toLower(m.content) CONTAINS toLower(word))
           RETURN m.memoryId AS memoryId
           LIMIT $limit`,
          { tenantId, userId, words, limit: neo4jInt(limit) }
        );
      });

      return result.records.map((r) => r.get('memoryId'));
    }

    const result = await session.executeRead(async (tx) => {
      return tx.run(
        `UNWIND $entities AS entityName
         MATCH (e:Entity {tenantId: $tenantId})
         WHERE toLower(e.name) CONTAINS toLower(entityName)
         MATCH (m:Memory {tenantId: $tenantId, userId: $userId})-[:MENTIONS]->(e)
         RETURN DISTINCT m.memoryId AS memoryId
         LIMIT $limit`,
        { entities, tenantId, userId, limit: neo4jInt(limit) }
      );
    });

    const memoryIds = result.records.map((r) => r.get('memoryId'));

    if (memoryIds.length > 0) {
      const relatedResult = await session.executeRead(async (tx) => {
        return tx.run(
          `MATCH (m:Memory {tenantId: $tenantId, userId: $userId})-[:MENTIONS]->(e:Entity)<-[:MENTIONS]-(related:Memory {tenantId: $tenantId, userId: $userId})
           WHERE m.memoryId IN $memoryIds AND NOT related.memoryId IN $memoryIds
           RETURN DISTINCT related.memoryId AS memoryId
           LIMIT $relatedLimit`,
          { tenantId, userId, memoryIds, relatedLimit: neo4jInt(Math.floor(limit / 2)) }
        );
      });

      const relatedIds = relatedResult.records.map((r) => r.get('memoryId'));
      return [...new Set([...memoryIds, ...relatedIds])];
    }

    return memoryIds;
  } catch (err) {
    console.error('Neo4j search error (non-fatal):', err.message);
    return [];
  } finally {
    await session.close();
  }
}

async function deleteMemoryNode(memoryId) {
  const session = neo4jConfig.getSession();

  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MATCH (m:Memory {memoryId: $memoryId})
         DETACH DELETE m`,
        { memoryId }
      );
    });
  } catch (err) {
    console.error('Neo4j deleteMemoryNode error (non-fatal):', err.message);
  } finally {
    await session.close();
  }
}

async function deleteUserNodes(userId, tenantId) {
  const session = neo4jConfig.getSession();

  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MATCH (u:User {userId: $userId, tenantId: $tenantId})-[:HAS_MEMORY]->(m:Memory)
         DETACH DELETE m`,
        { userId, tenantId }
      );
    });
  } catch (err) {
    console.error('Neo4j deleteUserNodes error (non-fatal):', err.message);
  } finally {
    await session.close();
  }
}

async function getEntityGraph(userId, tenantId) {
  const session = neo4jConfig.getSession();

  try {
    const result = await session.executeRead(async (tx) => {
      return tx.run(
        `MATCH (u:User {userId: $userId, tenantId: $tenantId})-[:HAS_MEMORY]->(m:Memory)-[:MENTIONS]->(e:Entity)
         RETURN m.memoryId AS memoryId, m.content AS content, 
                collect(e.name) AS entities`,
        { userId, tenantId }
      );
    });

    const nodes = [];
    const edges = [];
    const entitySet = new Set();

    for (const record of result.records) {
      const memoryId = record.get('memoryId');
      const content = record.get('content');
      const entities = record.get('entities');

      nodes.push({ id: memoryId, type: 'memory', label: content?.substring(0, 100) });

      for (const entity of entities) {
        if (!entitySet.has(entity)) {
          entitySet.add(entity);
          nodes.push({ id: `entity:${entity}`, type: 'entity', label: entity });
        }
        edges.push({ from: memoryId, to: `entity:${entity}`, relationship: 'MENTIONS' });
      }
    }

    return { nodes, edges };
  } catch (err) {
    console.error('Neo4j getEntityGraph error (non-fatal):', err.message);
    return { nodes: [], edges: [] };
  } finally {
    await session.close();
  }
}

function neo4jInt(value) {
  const neo4j = require('neo4j-driver');
  return neo4j.int(value);
}

module.exports = {
  extractEntities,
  createMemoryNode,
  searchByEntity,
  deleteMemoryNode,
  deleteUserNodes,
  getEntityGraph,
};
