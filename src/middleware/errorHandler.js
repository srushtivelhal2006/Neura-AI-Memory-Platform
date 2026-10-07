const env = require('../config/env');

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  const response = {
    error: getErrorType(statusCode),
    message: statusCode === 500 && !env.isDev
      ? 'An unexpected error occurred'
      : err.message || 'Unknown error',
    code: errorCode,
    timestamp: new Date().toISOString(),
  };

  if (err.details) {
    response.details = err.details;
  }

  if (env.isDev && statusCode === 500) {
    response.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${statusCode}:`, err.message);
    if (env.isDev) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json(response);
}

function getErrorType(statusCode) {
  const types = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return types[statusCode] || 'Error';
}

function createError(statusCode, message, code, details) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (details) {
    err.details = details;
  }
  return err;
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { errorHandler, createError, notFoundHandler };
