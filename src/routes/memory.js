const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { rateLimiter } = require('../middleware/rateLimiter');
const memoryController = require('../controllers/memoryController');
const searchController = require('../controllers/searchController');
const exportController = require('../controllers/exportController');
const schemas = require('../models/schemas');

router.use(authMiddleware);
router.use(rateLimiter());

router.post(
  '/',
  validate(schemas.createMemorySchema),
  memoryController.createMemory
);

router.get(
  '/list',
  validate(schemas.listMemoriesQuerySchema, 'query'),
  memoryController.listMemories
);

router.get(
  '/search',
  validate(schemas.searchQuerySchema, 'query'),
  searchController.searchMemories
);

router.post(
  '/export',
  validate(schemas.exportSchema),
  exportController.exportMemories
);

router.post(
  '/import',
  validate(schemas.importSchema),
  exportController.importMemories
);

router.get(
  '/history/:id',
  memoryController.getMemoryHistory
);

router.get(
  '/:id',
  memoryController.getMemory
);

router.patch(
  '/:id',
  validate(schemas.updateMemorySchema),
  memoryController.updateMemory
);

router.delete(
  '/:id',
  memoryController.deleteMemory
);

router.delete(
  '/user/:user_id',
  memoryController.deleteUserMemories
);

module.exports = router;
