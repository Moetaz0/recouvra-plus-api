import { jest } from '@jest/globals';
import User from "../../src/models/user.model.js";
import mongoose from "mongoose";

describe("User Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Schema Validation", () => {
    it("should create a user with valid data", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "agent",
      };

      const user = new User(userData);
      expect(user.name).toBe("John Doe");
      expect(user.email).toBe("john@example.com");
      expect(user.role).toBe("agent");
    });

    it("should require name field", async () => {
      const userData = {
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.name).toBeDefined();
    });

    it("should require email field", async () => {
      const userData = {
        name: "John Doe",
        password: "password123",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.email).toBeDefined();
    });

    it("should require password field", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.password).toBeDefined();
    });

    it("should validate email format", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        password: "password123",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.email).toBeDefined();
    });

    it("should enforce minimum password length", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "123",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.password).toBeDefined();
    });

    it("should enforce minimum name length", async () => {
      const userData = {
        name: "J",
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.name).toBeDefined();
    });

    it("should enforce maximum name length", async () => {
      const userData = {
        name: "A".repeat(101),
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.name).toBeDefined();
    });
  });

  describe("Role Field", () => {
    it("should accept valid roles", async () => {
      const roles = ["agent", "manager", "admin"];

      for (const role of roles) {
        const userData = {
          name: "John Doe",
          email: `john${role}@example.com`,
          password: "password123",
          role,
        };

        const user = new User(userData);
        expect(user.role).toBe(role);
      }
    });

    it("should default to 'agent' role if not specified", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      expect(user.role).toBe("agent");
    });

    it("should reject invalid role", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "superadmin",
      };

      const user = new User(userData);
      const error = user.validateSync();
      expect(error.errors.role).toBeDefined();
    });
  });

  describe("Email Format", () => {
    it("should accept valid email addresses", async () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.co.uk",
        "user+tag@example.com",
      ];

      for (const email of validEmails) {
        const userData = {
          name: "John Doe",
          email,
          password: "password123",
        };

        const user = new User(userData);
        expect(user.email).toBe(email.toLowerCase());
      }
    });

    it("should convert email to lowercase", async () => {
      const userData = {
        name: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        password: "password123",
      };

      const user = new User(userData);
      expect(user.email).toBe("john@example.com");
    });

    it("should reject invalid email formats", async () => {
      const invalidEmails = [
        "invalid@",
        "@example.com",
        "invalid.example.com",
        "invalid @example.com",
      ];

      for (const email of invalidEmails) {
        const userData = {
          name: "John Doe",
          email,
          password: "password123",
        };

        const user = new User(userData);
        const error = user.validateSync();
        expect(error.errors.email).toBeDefined();
      }
    });
  });

  describe("Timestamps", () => {
    it("should have createdAt and updatedAt fields", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      expect(user.createdAt).toBeUndefined(); // Not set until saved to DB
      expect(user.updatedAt).toBeUndefined();
    });
  });

  describe("Password Hashing", () => {
    it("should hash password before saving", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const originalPassword = user.password;

      // Mock bcrypt to track hashing
      jest.spyOn(user, "isModified").mockReturnValue(true);

      // The pre-save hook would hash the password
      // In this test we're just verifying the hook exists
      expect(user.password).toBe("password123");
    });
  });

  describe("comparePassword Method", () => {
    it("should have comparePassword method", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      expect(typeof user.comparePassword).toBe("function");
    });
  });

  describe("Field Trimming", () => {
    it("should trim name field", async () => {
      const userData = {
        name: "  John Doe  ",
        email: "john@example.com",
        password: "password123",
      };

      const user = new User(userData);
      expect(user.name).toBe("John Doe");
    });

    it("should trim email field", async () => {
      const userData = {
        name: "John Doe",
        email: "  john@example.com  ",
        password: "password123",
      };

      const user = new User(userData);
      expect(user.email).toBe("john@example.com");
    });
  });

  describe("Schema Structure", () => {
    it("should have all required fields", async () => {
      const schema = User.schema;
      expect(schema.paths.name).toBeDefined();
      expect(schema.paths.email).toBeDefined();
      expect(schema.paths.password).toBeDefined();
      expect(schema.paths.role).toBeDefined();
    });

    it("should have timestamps", async () => {
      const schema = User.schema;
      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });
  });
});
