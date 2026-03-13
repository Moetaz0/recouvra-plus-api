import Joi from "joi";

/**
 * Invoice Validation Schemas
 * Validates all user inputs for invoice operations
 * Ensures: consistency, security, and data integrity
 */

const invoiceSchemas = {
  /**
   * Create Invoice Validation
   * Validates required fields for new invoices
   */
  createInvoice: Joi.object({
    client: Joi.string()
      .required()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Client ID must be a valid MongoDB ObjectId",
        "any.required": "Client ID is required",
      }),

    montant: Joi.number()
      .required()
      .min(0.01)
      .max(999999999.99)
      .precision(2)
      .messages({
        "number.min": "Invoice amount must be greater than 0",
        "number.max": "Invoice amount is too large",
        "any.required": "Invoice amount (montant) is required",
        "number.base": "Invoice amount must be a number",
      }),

    dateEcheance: Joi.date()
      .required()
      .messages({
        "any.required": "Due date (dateEcheance) is required",
        "date.base": "Due date must be a valid date",
      })
      .custom((value, helpers) => {
        if (value < new Date()) {
          return helpers.error("date.min");
        }
        return value;
      })
      .messages({
        "date.min": "Due date (dateEcheance) must be today or in the future",
      }),

    statut: Joi.string()
      .valid("impayée", "payée", "en retard", "partiellement payée", "annulée")
      .default("impayée")
      .messages({
        "any.only":
          "Invoice status must be one of: impayée, payée, en retard, partiellement payée, annulée",
      }),

    referenceFacture: Joi.string()
      .required()
      .trim()
      .regex(/^[A-Z0-9-]{3,}$/)
      .messages({
        "string.pattern.base":
          "Invoice reference must contain 3+ uppercase letters, numbers, or hyphens",
        "any.required": "Invoice reference (referenceFacture) is required",
      }),

    description: Joi.string()
      .trim()
      .max(500)
      .messages({
        "string.max": "Description cannot exceed 500 characters",
      }),

    notes: Joi.string()
      .trim()
      .max(500)
      .messages({
        "string.max": "Notes cannot exceed 500 characters",
      }),
  }).unknown(false),

  /**
   * Update Invoice Validation
   * Validates optional fields for invoice updates
   */
  updateInvoice: Joi.object({
    montant: Joi.number()
      .min(0.01)
      .max(999999999.99)
      .precision(2)
      .messages({
        "number.min": "Invoice amount must be greater than 0",
        "number.max": "Invoice amount is too large",
      }),

    dateEcheance: Joi.date()
      .min("now")
      .messages({
        "date.min": "Due date must be today or in the future",
      }),

    statut: Joi.string()
      .valid("impayée", "payée", "en retard", "partiellement payée", "annulée")
      .messages({
        "any.only":
          "Invoice status must be one of: impayée, payée, en retard, partiellement payée, annulée",
      }),

    referenceFacture: Joi.string()
      .trim()
      .regex(/^[A-Z0-9-]{3,}$/)
      .messages({
        "string.pattern.base":
          "Invoice reference must contain 3+ uppercase letters, numbers, or hyphens",
      }),

    description: Joi.string()
      .trim()
      .max(500)
      .messages({
        "string.max": "Description cannot exceed 500 characters",
      }),

    notes: Joi.string()
      .trim()
      .max(500)
      .messages({
        "string.max": "Notes cannot exceed 500 characters",
      }),
  })
    .min(1)
    .unknown(false)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),

  /**
   * Query Invoices Validation
   * Validates pagination and filter parameters
   */
  queryInvoices: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        "number.min": "Page must be at least 1",
        "number.base": "Page must be a number",
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        "number.min": "Limit must be at least 1",
        "number.max": "Limit cannot exceed 100",
      }),

    statut: Joi.string()
      .valid("impayée", "payée", "en retard", "partiellement payée", "annulée")
      .messages({
        "any.only":
          "Status filter must be one of: impayée, payée, en retard, partiellement payée, annulée",
      }),

    client: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Client ID must be a valid MongoDB ObjectId",
      }),

    search: Joi.string()
      .trim()
      .max(100)
      .messages({
        "string.max": "Search query cannot exceed 100 characters",
      }),

    sortBy: Joi.string()
      .valid(
        "createdAt",
        "-createdAt",
        "montant",
        "-montant",
        "dateEcheance",
        "-dateEcheance"
      )
      .default("-createdAt")
      .messages({
        "any.only": "Invalid sort field",
      }),
  })
    .unknown(false),
};

export default invoiceSchemas;
