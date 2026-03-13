import Joi from "joi";

/**
 * User Validation Schemas
 * Validates all user inputs for user management operations
 * Ensures: consistency, security, and data integrity
 */

const userSchemas = {
  /**
   * Create User (Registration) Validation
   * Validates required fields for new user accounts
   */
  createUser: Joi.object({
    name: Joi.string()
      .required()
      .trim()
      .min(2)
      .max(100)
      .messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 100 characters",
        "any.required": "Name is required",
      }),

    email: Joi.string()
      .required()
      .trim()
      .lowercase()
      .email()
      .messages({
        "string.email": "Email must be a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
      }),

    password: Joi.string()
      .required()
      .min(6)
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters long",
        "any.required": "Password is required",
      }),

    role: Joi.string()
      .required()
      .valid("agent", "manager", "admin")
      .messages({
        "any.only": "Role must be one of: agent, manager, admin",
        "any.required": "Role is required",
      }),
  }),

  /**
   * Update User Role Validation
   * Validates role change operations (admin/manager only)
   */
  updateUserRole: Joi.object({
    role: Joi.string()
      .required()
      .valid("agent", "manager", "admin")
      .messages({
        "any.only": "Role must be one of: agent, manager, admin",
        "string.empty": "Role is required",
        "any.required": "Role is required",
      }),
  }),

  /**
   * Update User Profile Validation
   * Validates profile updates for current user
   * Allows partial updates (name and/or email)
   */
  updateUserProfile: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .messages({
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 100 characters",
      }),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .messages({
        "string.email": "Email must be a valid email address",
      }),
  })
    .min(1)
    .messages({
      "object.min": "At least one field (name or email) must be provided for update",
    }),

  /**
   * User ID Validation
   * Validates MongoDB ObjectId format
   */
  validateUserId: Joi.object({
    id: Joi.string()
      .required()
      .regex(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "User ID must be a valid MongoDB ObjectId",
        "any.required": "User ID is required",
      }),
  }),

  /**
   * User Query Validation
   * Validates query parameters for user listing
   */
  queryUsers: Joi.object({
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

    sortBy: Joi.string()
      .valid("createdAt", "updatedAt", "name", "email", "role")
      .default("createdAt")
      .messages({
        "any.only": "Sort field must be one of: createdAt, updatedAt, name, email, role",
      }),

    order: Joi.string()
      .valid("asc", "desc")
      .default("desc")
      .messages({
        "any.only": "Order must be either 'asc' or 'desc'",
      }),

    role: Joi.string()
      .valid("agent", "manager", "admin")
      .messages({
        "any.only": "Role filter must be one of: agent, manager, admin",
      }),

    search: Joi.string()
      .trim()
      .max(100)
      .messages({
        "string.max": "Search term cannot exceed 100 characters",
      }),
  }),
};

export default userSchemas;
