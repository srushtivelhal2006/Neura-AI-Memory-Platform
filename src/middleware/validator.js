function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const data = source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
        type: d.type,
      }));

      return res.status(422).json({
        error: 'Unprocessable Entity',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
        timestamp: new Date().toISOString(),
      });
    }

    if (source === 'query') {
      req.validatedQuery = value;
    } else {
      req.validatedBody = value;
    }

    next();
  };
}

module.exports = { validate };
