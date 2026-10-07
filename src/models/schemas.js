const Joi = require('joi');

const MEMORY_TYPES = ['explicit_fact', 'behavioral_pattern', 'preference', 'entity', 'temporal_fact'];

const createMemorySchema = Joi.object({
  user_id: Joi.string().max(255).required(),
  app_id: Joi.string().max(255).required(),
  org_id: Joi.string().max(255).optional().allow(null, ''),
  session_id: Joi.string().max(255).optional().allow(null, ''),
  content: Joi.string().min(1).max(50000).required(),
  memory_type: Joi.string().valid(...MEMORY_TYPES).required(),
  tags: Joi.array().items(Joi.string().max(100)).max(20).optional().default([]),
  metadata: Joi.object().optional().default({}),
  valid_until: Joi.date().iso().optional().allow(null),
});

const updateMemorySchema = Joi.object({
  content: Joi.string().min(1).max(50000).optional(),
  memory_type: Joi.string().valid(...MEMORY_TYPES).optional(),
  tags: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  metadata: Joi.object().optional(),
  valid_until: Joi.date().iso().optional().allow(null),
  confidence: Joi.number().min(0).max(1).optional(),
}).min(1);

const listMemoriesQuerySchema = Joi.object({
  user_id: Joi.string().max(255).required(),
  app_id: Joi.string().max(255).optional(),
  memory_type: Joi.string().valid(...MEMORY_TYPES).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  include_inactive: Joi.boolean().default(false),
});

const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).max(1000).required(),
  user_id: Joi.string().max(255).required(),
  app_id: Joi.string().max(255).optional(),
  top_k: Joi.number().integer().min(1).max(100).default(10),
  before: Joi.date().iso().optional(),
  after: Joi.date().iso().optional(),
  as_of: Joi.date().iso().optional(),
});

const exportSchema = Joi.object({
  user_id: Joi.string().max(255).required(),
  app_id: Joi.string().max(255).optional(),
});

const importSchema = Joi.object({
  schema_version: Joi.string().required(),
  exported_at: Joi.string().optional(),
  user_id: Joi.string().max(255).required(),
  memories: Joi.array().items(
    Joi.object({
      content: Joi.string().required(),
      memory_type: Joi.string().valid(...MEMORY_TYPES).required(),
      tags: Joi.array().items(Joi.string()).optional().default([]),
      metadata: Joi.object().optional().default({}),
      confidence: Joi.number().min(0).max(1).optional().default(1.0),
      valid_from: Joi.date().iso().optional(),
      valid_until: Joi.date().iso().optional().allow(null),
      app_id: Joi.string().max(255).optional(),
      org_id: Joi.string().max(255).optional().allow(null, ''),
      session_id: Joi.string().max(255).optional().allow(null, ''),
    })
  ).min(1).required(),
  entity_graph: Joi.object({
    nodes: Joi.array().optional().default([]),
    edges: Joi.array().optional().default([]),
  }).optional(),
  metadata: Joi.object().optional(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  org_id: Joi.string().max(255).optional().allow(null, ''),
  tier: Joi.string().valid('free', 'pro', 'enterprise').default('free'),
});

const createApiKeySchema = Joi.object({
  name: Joi.string().min(1).max(255).default('Default'),
  permissions: Joi.object({
    read: Joi.boolean().default(true),
    write: Joi.boolean().default(true),
    delete: Joi.boolean().default(true),
    admin: Joi.boolean().default(false),
  }).optional().default({ read: true, write: true, delete: true, admin: false }),
});

const deleteUserMemoriesSchema = Joi.object({
  app_id: Joi.string().max(255).optional(),
});

module.exports = {
  createMemorySchema,
  updateMemorySchema,
  listMemoriesQuerySchema,
  searchQuerySchema,
  exportSchema,
  importSchema,
  registerSchema,
  createApiKeySchema,
  deleteUserMemoriesSchema,
  MEMORY_TYPES,
};
