const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { rateLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const schemas = require('../models/schemas');

router.post(
  '/register',
  validate(schemas.registerSchema),
  authController.register
);

router.post(
  '/keys',
  authMiddleware,
  rateLimiter(),
  validate(schemas.createApiKeySchema),
  authController.createKey
);

router.get(
  '/keys',
  authMiddleware,
  rateLimiter(),
  authController.listKeys
);

router.delete(
  '/keys/:id',
  authMiddleware,
  rateLimiter(),
  authController.revokeKey
);

module.exports = router;
