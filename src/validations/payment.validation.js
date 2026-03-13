import Joi from "joi";

/**
 * Payment Validation Schemas
 * Validates all user inputs for payment operations
 * Ensures: consistency, security, and data integrity
 */

const paymentSchemas = {
  /**
   * Create Payment Validation
   * Validates required fields for new payments
   */
  createPayment: Joi.object({
    invoiceId: Joi.string()
      .required()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Invoice ID must be a valid MongoDB ObjectId",
        "any.required": "Invoice ID (invoiceId) is required",
      }),

    amount: Joi.number()
      .required()
      .min(0.01)
      .max(999999999.99)
      .precision(2)
      .messages({
        "number.min": "Payment amount must be greater than 0",
        "number.max": "Payment amount is too large",
        "any.required": "Payment amount is required",
        "number.base": "Payment amount must be a number",
      }),

    paymentDate: Joi.date()
      .required()
      .max("now")
      .messages({
        "date.max": "Payment date cannot be in the future",
        "any.required": "Payment date is required",
        "date.base": "Payment date must be a valid date",
      }),

    method: Joi.string()
      .required()
      .valid("cash", "bank_transfer", "check", "credit_card", "online", "other")
      .messages({
        "any.required": "Payment method is required",
        "any.only":
          "Payment method must be one of: cash, bank_transfer, check, credit_card, online, other",
      }),

    referenceNumber: Joi.string()
      .required()
      .trim()
      .regex(/^[A-Z0-9-]{3,}$/)
      .max(50)
      .messages({
        "string.pattern.base":
          "Reference number must contain 3+ uppercase letters, numbers, or hyphens",
        "any.required": "Reference number is required",
        "string.max": "Reference number cannot exceed 50 characters",
      }),

    notes: Joi.string()
      .trim()
      .max(500)
      .messages({
        "string.max": "Notes cannot exceed 500 characters",
      }),
  }).unknown(false),

  /**
   * Update Payment Validation
   * Validates optional fields for payment updates
   */
  updatePayment: Joi.object({
    amount: Joi.number()
      .min(0.01)
      .max(999999999.99)
      .precision(2)
      .messages({
        "number.min": "Payment amount must be greater than 0",
        "number.max": "Payment amount is too large",
      }),

    paymentDate: Joi.date()
      .max("now")
      .messages({
        "date.max": "Payment date cannot be in the future",
      }),

    method: Joi.string()
      .valid("cash", "bank_transfer", "check", "credit_card", "online", "other")
      .messages({
        "any.only":
          "Payment method must be one of: cash, bank_transfer, check, credit_card, online, other",
      }),

    referenceNumber: Joi.string()
      .trim()
      .regex(/^[A-Z0-9-]{3,}$/)
      .max(50)
      .messages({
        "string.pattern.base":
          "Reference number must contain 3+ uppercase letters, numbers, or hyphens",
        "string.max": "Reference number cannot exceed 50 characters",
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
   * Query Payments Validation
   * Validates pagination and filter parameters
   */
  queryPayments: Joi.object({
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

    invoiceId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Invoice ID must be a valid MongoDB ObjectId",
      }),

    method: Joi.string()
      .valid("cash", "bank_transfer", "check", "credit_card", "online", "other")
      .messages({
        "any.only":
          "Payment method must be one of: cash, bank_transfer, check, credit_card, online, other",
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
        "paymentDate",
        "-paymentDate",
        "amount",
        "-amount"
      )
      .default("-createdAt")
      .messages({
        "any.only": "Invalid sort field",
      }),
  })
    .unknown(false),

  /**
   * Query Invoice Payments Validation
   * Validates pagination parameters for invoice-specific payments
   */
  queryInvoicePayments: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        "number.min": "Page must be at least 1",
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
  })
    .unknown(false),
};

export default paymentSchemas;
