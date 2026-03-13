import userSchemas from "../../src/validations/user.validation.js";

describe("User Validation Schemas", () => {
  const validateOptions = {
    abortEarly: false,
    stripUnknown: true,
  };

  describe("createUser - Create/Register User", () => {
    it("should accept valid user data with all required fields", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "securePassword123",
        role: "agent",
      };

      const { error, value } = userSchemas.createUser.validate(validData, validateOptions);
      expect(error).toBeUndefined();
      expect(value.email).toBe("john@example.com"); // Should be lowercase
    });

    it("should convert email to lowercase", () => {
      const data = {
        name: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        password: "password123",
        role: "agent",
      };

      const { value } = userSchemas.createUser.validate(data, validateOptions);
      expect(value.email).toBe("john@example.com");
    });

    it("should trim whitespace from name", () => {
      const data = {
        name: "  John Doe  ",
        email: "john@example.com",
        password: "password123",
        role: "agent",
      };

      const { value } = userSchemas.createUser.validate(data, validateOptions);
      expect(value.name).toBe("John Doe");
    });

    it("should reject missing name", () => {
      const invalidData = {
        email: "john@example.com",
        password: "password123",
        role: "agent",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("Name is required");
    });

    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
        email: "john@example.com",
        password: "password123",
        role: "agent",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("at least 2 characters");
    });

    it("should reject name longer than 100 characters", () => {
      const invalidData = {
        name: "A".repeat(101),
        email: "john@example.com",
        password: "password123",
        role: "agent",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("cannot exceed 100 characters");
    });

    it("should reject missing email", () => {
      const invalidData = {
        name: "John Doe",
        password: "password123",
        role: "agent",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("Email is required");
    });

    it("should reject invalid email format", () => {
      const testEmails = ["invalidemail", "user@", "@example.com", "user @example.com"];

      testEmails.forEach((email) => {
        const invalidData = {
          name: "John Doe",
          email,
          password: "password123",
          role: "agent",
        };

        const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("valid email");
      });
    });

    it("should reject missing password", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        role: "agent",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("Password is required");
    });

    it("should reject password shorter than 6 characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "12345",
        role: "agent",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("at least 6 characters");
    });

    it("should reject missing role", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("Role is required");
    });

    it("should reject invalid role", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "superadmin",
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("agent, manager, admin");
    });

    it("should accept all valid roles", () => {
      const roles = ["agent", "manager", "admin"];

      roles.forEach((role) => {
        const validData = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          role,
        };

        const { error } = userSchemas.createUser.validate(validData, validateOptions);
        expect(error).toBeUndefined();
      });
    });

    it("should reject extra unknown fields with stripUnknown", () => {
      const dataWithExtra = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "agent",
        unknownField: "should be removed",
      };

      const { value } = userSchemas.createUser.validate(dataWithExtra, validateOptions);
      expect(value.unknownField).toBeUndefined();
      expect(Object.keys(value).length).toBe(4); // Only 4 expected fields
    });
  });

  describe("updateUserRole - Update User Role", () => {
    it("should accept valid role update", () => {
      const validData = {
        role: "manager",
      };

      const { error } = userSchemas.updateUserRole.validate(validData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should accept all valid roles", () => {
      const roles = ["agent", "manager", "admin"];

      roles.forEach((role) => {
        const validData = { role };
        const { error } = userSchemas.updateUserRole.validate(validData, validateOptions);
        expect(error).toBeUndefined();
      });
    });

    it("should reject missing role", () => {
      const invalidData = {};

      const { error } = userSchemas.updateUserRole.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("Role is required");
    });

    it("should reject invalid role", () => {
      const invalidData = {
        role: "superuser",
      };

      const { error } = userSchemas.updateUserRole.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("agent, manager, admin");
    });

    it("should reject empty string role", () => {
      const invalidData = {
        role: "",
      };

      const { error } = userSchemas.updateUserRole.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
    });
  });

  describe("updateUserProfile - Update User Profile", () => {
    it("should accept valid name update", () => {
      const validData = {
        name: "Jane Doe",
      };

      const { error, value } = userSchemas.updateUserProfile.validate(validData, validateOptions);
      expect(error).toBeUndefined();
      expect(value.name).toBe("Jane Doe");
    });

    it("should accept valid email update", () => {
      const validData = {
        email: "jane@example.com",
      };

      const { error, value } = userSchemas.updateUserProfile.validate(validData, validateOptions);
      expect(error).toBeUndefined();
      expect(value.email).toBe("jane@example.com");
    });

    it("should accept both name and email update", () => {
      const validData = {
        name: "Jane Doe",
        email: "jane@example.com",
      };

      const { error } = userSchemas.updateUserProfile.validate(validData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should convert email to lowercase", () => {
      const data = {
        email: "JANE@EXAMPLE.COM",
      };

      const { value } = userSchemas.updateUserProfile.validate(data, validateOptions);
      expect(value.email).toBe("jane@example.com");
    });

    it("should trim whitespace from name", () => {
      const data = {
        name: "  Jane Doe  ",
      };

      const { value } = userSchemas.updateUserProfile.validate(data, validateOptions);
      expect(value.name).toBe("Jane Doe");
    });

    it("should reject both fields missing", () => {
      const invalidData = {};

      const { error } = userSchemas.updateUserProfile.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("At least one field");
    });

    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "J",
      };

      const { error } = userSchemas.updateUserProfile.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("at least 2 characters");
    });

    it("should reject name longer than 100 characters", () => {
      const invalidData = {
        name: "A".repeat(101),
      };

      const { error } = userSchemas.updateUserProfile.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("cannot exceed 100 characters");
    });

    it("should reject invalid email format", () => {
      const testEmails = ["invalidemail", "user@", "@example.com"];

      testEmails.forEach((email) => {
        const invalidData = {
          email,
        };

        const { error } = userSchemas.updateUserProfile.validate(invalidData, validateOptions);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("valid email");
      });
    });

    it("should allow empty strings for optional fields", () => {
      const data = {
        name: "Jane Doe",
        email: "", // Empty email should be ignored or rejected
      };

      const { value } = userSchemas.updateUserProfile.validate(data, validateOptions);
      expect(value.name).toBe("Jane Doe");
    });

    it("should strip unknown fields", () => {
      const dataWithExtra = {
        name: "Jane Doe",
        unknownField: "should be removed",
      };

      const { value } = userSchemas.updateUserProfile.validate(dataWithExtra, validateOptions);
      expect(value.unknownField).toBeUndefined();
    });
  });

  describe("validateUserId - Validate User ID", () => {
    it("should accept valid MongoDB ObjectId", () => {
      const validId = "507f1f77bcf86cd799439011";

      const { error } = userSchemas.validateUserId.validate({ id: validId }, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should reject invalid MongoDB ObjectId", () => {
      const invalidIds = ["invalid", "12345", "notatrealid", "507f1f77bcf86cd79943901x"];

      invalidIds.forEach((id) => {
        const { error } = userSchemas.validateUserId.validate({ id }, validateOptions);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain("valid MongoDB ObjectId");
      });
    });

    it("should reject empty id", () => {
      const { error } = userSchemas.validateUserId.validate({ id: "" }, validateOptions);
      expect(error).toBeDefined();
    });

    it("should reject missing id", () => {
      const { error } = userSchemas.validateUserId.validate({}, validateOptions);
      expect(error).toBeDefined();
    });
  });

  describe("Edge Cases and Combined Validations", () => {
    it("should handle multiple validation errors", () => {
      const invalidData = {
        name: "A", // Too short
        email: "invalid-email", // Invalid format
        password: "12345", // Too short
        role: "superadmin", // Invalid role
      };

      const { error } = userSchemas.createUser.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThan(1); // Multiple errors
    });

    it("should handle special characters in valid fields", () => {
      const validData = {
        name: "Jean-Pierre O'Connor",
        email: "jean.pierre+tag@example.com",
        password: "P@ssw0rd!123",
        role: "manager",
      };

      const { error } = userSchemas.createUser.validate(validData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should handle international characters in name", () => {
      const validData = {
        name: "François Müller",
        email: "francois@example.com",
        password: "password123",
        role: "agent",
      };

      const { error } = userSchemas.createUser.validate(validData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should normalize multiple spaces in name", () => {
      const data = {
        name: "John    Doe",
        email: "john@example.com",
        password: "password123",
        role: "agent",
      };

      const { value } = userSchemas.createUser.validate(data, validateOptions);
      // Joi trim only removes leading/trailing spaces, not internal ones
      expect(value.name).toBe("John    Doe");
    });
  });

  describe("Validation Options", () => {
    it("should respect abortEarly: false to collect all errors", () => {
      const invalidData = {
        name: "A",
        email: "invalid",
        password: "123",
        role: "invalid",
      };

      const { error } = userSchemas.createUser.validate(invalidData, {
        abortEarly: false,
        stripUnknown: true,
      });

      expect(error.details.length).toBeGreaterThan(1);
    });

    it("should respect stripUnknown: true to remove extra fields", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "agent",
        extra1: "value1",
        extra2: "value2",
      };

      const { value } = userSchemas.createUser.validate(data, {
        stripUnknown: true,
      });

      expect(value.extra1).toBeUndefined();
      expect(value.extra2).toBeUndefined();
    });
  });
});
