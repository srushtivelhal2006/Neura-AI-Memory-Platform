const searchService = require('../services/searchService');
const cacheService = require('../services/cacheService');
const env = require('../config/env');

async function searchMemories(req, res, next) {
  try {
    const { tenant_id } = req.tenant;
    const { q, user_id, app_id, top_k, before, after, as_of } = req.validatedQuery;

    const cacheKey = cacheService.buildKey(tenant_id, user_id, 'search', `${q}:${app_id || ''}:${top_k}`);
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const results = await searchService.search({
      queryText: q,
      userId: user_id,
      appId: app_id,
      tenantId: tenant_id,
      topK: top_k,
      before,
      after,
      asOf: as_of,
    });

    await cacheService.set(cacheKey, results, env.cache.ttlSearch);

    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchMemories };
