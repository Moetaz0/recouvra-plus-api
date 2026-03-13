import Joi from "joi";

/**
 * Action Validation Schemas
 * Validates all user inputs for action management operations
 */

const actionSchemas = {
  /**
   * Create Action Validation
   */
  createAction: Joi.object({
    type: Joi.string()
      .required()
      .valid("appel", "email", "lettre", "visite", "procedure", "negociation", "rappel")
      .lowercase()
      .messages({
        "any.only":
          "Type must be one of: appel, email, lettre, visite, procedure, negociation, rappel",
        "any.required": "Action type is required",
      }),

    dateAction: Joi.date()
      .optional()
      .default(() => new Date())
      .messages({
        "date.base": "Date action must be a valid date",
      }),

    description: Joi.string()
      .required()
      .trim()
      .min(5)
      .max(1000)
      .messages({
        "string.empty": "Description is required",
        "string.min": "Description must be at least 5 characters long",
        "string.max": "Description cannot exceed 1000 characters",
        "any.required": "Description is required",
      }),

    statut: Joi.string()
      .optional()
      .valid("planifiée", "en cours", "complétée", "échouée", "annulée")
      .lowercase()
      .default("complétée")
      .messages({
        "any.only":
          "Status must be one of: planifiée, en cours, complétée, échouée, annulée",
      }),

    client: Joi.string()
      .required()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Client ID must be a valid MongoDB ObjectId",
        "any.required": "Client is required",
      }),

    facture: Joi.string()
      .optional()
      .regex(/^[0-9a-fA-F]{24}$/)
      .allow(null)
      .messages({
        "string.pattern.base": "Invoice ID must be a valid MongoDB ObjectId",
      }),

    resultat: Joi.string()
      .optional()
      .valid("succès", "partiel", "échec", "report")
      .lowercase()
      .allow(null)
      .messages({
        "any.only": "Result must be one of: succès, partiel, échec, report",
      }),

    montantConvenu: Joi.number()
      .optional()
      .min(0)
      .allow(null)
      .messages({
        "number.min": "Agreed amount must be greater than or equal to 0",
        "number.base": "Agreed amount must be a number",
      }),

    dateProchainSuivi: Joi.date()
      .optional()
      .allow(null)
      .messages({
        "date.base": "Next follow-up date must be a valid date",
      }),

    referenceDocument: Joi.string()
      .optional()
      .trim()
      .max(200)
      .allow(null)
      .messages({
        "string.max": "Document reference cannot exceed 200 characters",
      }),
  }),

  /**
   * Update Action Validation
   */
  updateAction: Joi.object({
    description: Joi.string()
      .optional()
      .trim()
      .min(5)
      .max(1000)
      .messages({
        "string.min": "Description must be at least 5 characters long",
        "string.max": "Description cannot exceed 1000 characters",
      }),

    statut: Joi.string()
      .optional()
      .valid("planifiée", "en cours", "complétée", "échouée", "annulée")
      .lowercase()
      .messages({
        "any.only":
          "Status must be one of: planifiée, en cours, complétée, échouée, annulée",
      }),

    resultat: Joi.string()
      .optional()
      .valid("succès", "partiel", "échec", "report")
      .lowercase()
      .allow(null)
      .messages({
        "any.only": "Result must be one of: succès, partiel, échec, report",
      }),

    montantConvenu: Joi.number()
      .optional()
      .min(0)
      .allow(null)
      .messages({
        "number.min": "Agreed amount must be greater than or equal to 0",
        "number.base": "Agreed amount must be a number",
      }),

    dateProchainSuivi: Joi.date()
      .optional()
      .allow(null)
      .messages({
        "date.base": "Next follow-up date must be a valid date",
      }),

    referenceDocument: Joi.string()
      .optional()
      .trim()
      .max(200)
      .allow(null)
      .messages({
        "string.max": "Document reference cannot exceed 200 characters",
      }),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),

  /**
   * Query Actions Validation
   */
  queryActions: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        "number.base": "Page must be a number",
        "number.min": "Page must be at least 1",
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        "number.base": "Limit must be a number",
        "number.min": "Limit must be at least 1",
        "number.max": "Limit cannot exceed 100",
      }),

    type: Joi.string()
      .optional()
      .valid("appel", "email", "lettre", "visite", "procedure", "negociation", "rappel")
      .lowercase()
      .messages({
        "any.only":
          "Type must be one of: appel, email, lettre, visite, procedure, negociation, rappel",
      }),

    client: Joi.string()
      .optional()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Client ID must be a valid MongoDB ObjectId",
      }),

    agent: Joi.string()
      .optional()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Agent ID must be a valid MongoDB ObjectId",
      }),

    statut: Joi.string()
      .optional()
      .valid("planifiée", "en cours", "complétée", "échouée", "annulée")
      .lowercase()
      .messages({
        "any.only":
          "Status must be one of: planifiée, en cours, complétée, échouée, annulée",
      }),

    from: Joi.date()
      .optional()
      .messages({
        "date.base": "From date must be valid",
      }),

    to: Joi.date()
      .optional()
      .messages({
        "date.base": "To date must be valid",
      }),

    sortBy: Joi.string()
      .optional()
      .valid("dateAction", "createdAt", "type", "statut")
      .default("dateAction")
      .messages({
        "any.only": "Sort field must be one of: dateAction, createdAt, type, statut",
      }),

    order: Joi.string()
      .optional()
      .valid("asc", "desc")
      .default("desc")
      .messages({
        "any.only": "Order must be either 'asc' or 'desc'",
      }),
  }),

  /**
   * Validate Action ID
   */
  validateActionId: Joi.object({
    id: Joi.string()
      .required()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Action ID must be a valid MongoDB ObjectId",
        "any.required": "Action ID is required",
      }),
  }),
};

export default actionSchemas;
