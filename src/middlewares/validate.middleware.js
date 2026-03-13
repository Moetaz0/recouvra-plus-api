/**
 * Validation Middleware
 * Provides middleware functions to validate request data using Joi schemas
 * Handles: body validation, query validation, parameter validation
 * Returns structured error responses for invalid data
 */

/**
 * Middleware factory for request body validation
 * Validates req.body against provided Joi schema
 *
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown properties
      messages: {
        "any.required": "'{#label}' is required",
        "string.empty": "'{#label}' cannot be empty",
        "number.base": "'{#label}' must be a number",
        "date.base": "'{#label}' must be a valid date",
      },
    });

    if (error) {
      const errors = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    // Replace request body with validated and cleaned data
    req.body = value;
    next();
  };
};

/**
 * Middleware factory for query parameters validation
 * Validates req.query against provided Joi schema
 *
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: "Invalid query parameters",
        errors,
      });
    }

    // Update query properties in-place (req.query is read-only)
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, value);
    next();
  };
};

/**
 * Middleware factory for URL parameters validation
 * Validates req.params against provided Joi schema
 *
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: "Invalid URL parameters",
        errors,
      });
    }

    // Update params properties in-place (req.params is read-only)
    Object.keys(req.params).forEach((key) => delete req.params[key]);
    Object.assign(req.params, value);
    next();
  };
};

/**
 * Middleware factory for comprehensive request validation
 * Validates body, query, and params against provided schemas
 *
 * @param {Object} schemas - Object containing body, query, params Joi schemas
 * @returns {Function} Express middleware function
 */
export const validate = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body if schema provided
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((err) => ({
            location: "body",
            field: err.path.join("."),
            message: err.message,
          }))
        );
      } else {
        req.body = value;
      }
    }

    // Validate query if schema provided
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((err) => ({
            location: "query",
            field: err.path.join("."),
            message: err.message,
          }))
        );
      } else {
        // Update query properties in-place (req.query is read-only)
        Object.keys(req.query).forEach((key) => delete req.query[key]);
        Object.assign(req.query, value);
      }
    }

    // Validate params if schema provided
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((err) => ({
            location: "params",
            field: err.path.join("."),
            message: err.message,
          }))
        );
      } else {
        // Update params properties in-place (req.params is read-only)
        Object.keys(req.params).forEach((key) => delete req.params[key]);
        Object.assign(req.params, value);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validate,
};
