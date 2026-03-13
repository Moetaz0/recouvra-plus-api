import { jest } from "@jest/globals";
import Joi from "joi";
import actionSchemas from "../../src/validations/action.validation.js";

const {
  createAction: createActionSchema,
  updateAction: updateActionSchema,
  queryActions: queryActionsSchema,
  validateActionId,
} = actionSchemas;

describe("Action Validation Schemas", () => {
  describe("createActionSchema", () => {
    test("should validate valid action creation data", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Contact client for payment reminder",
        client: "507f1f77bcf86cd799439011",
      };

      const { error, value } = createActionSchema.validate(data, {
        stripUnknown: true,
      });

      expect(error).toBeUndefined();
      expect(value.type).toBe("appel");
      expect(value.description).toBe("Contact client for payment reminder");
    });

    test("should accept all valid action types", () => {
      const validTypes = [
        "appel",
        "email",
        "lettre",
        "visite",
        "procedure",
        "negociation",
        "rappel",
      ];

      validTypes.forEach((type) => {
        const data = {
          type,
          dateAction: new Date(),
          description: "Test action",
          client: "507f1f77bcf86cd799439011",
        };

        const { error } = createActionSchema.validate(data, {
          stripUnknown: true,
        });
        expect(error).toBeUndefined();
      });
    });

    test("should reject invalid action type", () => {
      const data = {
        type: "invalidType",
        dateAction: new Date(),
        description: "Test action",
        client: "507f1f77bcf86cd799439011",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should require type field", () => {
      const data = {
        dateAction: new Date(),
        description: "Test action",
        client: "507f1f77bcf86cd799439011",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should require description field", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        client: "507f1f77bcf86cd799439011",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should validate description minimum length", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "abc",
        client: "507f1f77bcf86cd799439011",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should require client ID", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should validate client ID format", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: "invalid-id",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should accept optional facture field", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: "507f1f77bcf86cd799439011",
        facture: "507f1f77bcf86cd799439013",
      };

      const { error, value } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeUndefined();
      expect(value.facture).toBe("507f1f77bcf86cd799439013");
    });

    test("should validate facture ID format if provided", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: "507f1f77bcf86cd799439011",
        facture: "invalid-id",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should accept valid statuses", () => {
      const validStatuses = [
        "planifiée",
        "en cours",
        "complétée",
        "échouée",
        "annulée",
      ];

      validStatuses.forEach((statut) => {
        const data = {
          type: "appel",
          dateAction: new Date(),
          description: "Test action",
          client: "507f1f77bcf86cd799439011",
          statut,
        };

        const { error } = createActionSchema.validate(data, {
          stripUnknown: true,
        });
        expect(error).toBeUndefined();
      });
    });

    test("should reject invalid status", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: "507f1f77bcf86cd799439011",
        statut: "invalide",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeDefined();
    });

    test("should accept valid results", () => {
      const validResults = ["succès", "partiel", "échec", "report"];

      validResults.forEach((resultat) => {
        const data = {
          type: "appel",
          dateAction: new Date(),
          description: "Test action",
          client: "507f1f77bcf86cd799439011",
          resultat,
        };

        const { error } = createActionSchema.validate(data, {
          stripUnknown: true,
        });
        expect(error).toBeUndefined();
      });
    });

    test("should accept optional montantConvenu field", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: "507f1f77bcf86cd799439011",
        montantConvenu: 500.5,
      };

      const { error, value } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeUndefined();
      expect(value.montantConvenu).toBe(500.5);
    });

    test("should accept optional dateProchainSuivi field", () => {
      const futureDate = new Date("2025-12-31");
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: "507f1f77bcf86cd799439011",
        dateProchainSuivi: futureDate,
      };

      const { error, value } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeUndefined();
      expect(value.dateProchainSuivi).toEqual(futureDate);
    });
  });

  describe("updateActionSchema", () => {
    test("should validate valid update data", () => {
      const data = {
        statut: "en cours",
        description: "Updated description",
      };

      const { error } = updateActionSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should require at least one field for update", () => {
      const data = {};

      const { error } = updateActionSchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should allow partial updates", () => {
      const testCases = [
        { statut: "complétée" },
        { description: "New description" },
        { resultat: "succès" },
        { montantConvenu: 1000 },
      ];

      testCases.forEach((updateData) => {
        const { error } = updateActionSchema.validate(updateData);
        expect(error).toBeUndefined();
      });
    });

    test("should validate status enum in updates", () => {
      const data = { statut: "invalidStatus" };
      const { error } = updateActionSchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should allow multiple fields in single update", () => {
      const data = {
        statut: "complétée",
        resultat: "succès",
        montantConvenu: 750,
      };

      const { error } = updateActionSchema.validate(data);
      expect(error).toBeUndefined();
    });
  });

  describe("queryActionsSchema", () => {
    test("should validate valid query parameters", () => {
      const data = {
        page: 1,
        limit: 10,
        type: "appel",
        client: "507f1f77bcf86cd799439011",
      };

      const { error } = queryActionsSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should validate type filter", () => {
      const data = { page: 1, limit: 10, type: "appel" };
      const { error } = queryActionsSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should validate status filter", () => {
      const data = { page: 1, limit: 10, statut: "complétée" };
      const { error } = queryActionsSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should validate date range parameters", () => {
      const data = {
        page: 1,
        limit: 10,
        from: new Date("2025-01-01"),
        to: new Date("2025-12-31"),
      };

      const { error } = queryActionsSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should handle pagination with various values", () => {
      const data = { page: 5, limit: 25 };
      const { error } = queryActionsSchema.validate(data);
      expect(error).toBeUndefined();
    });
  });

  describe("validateActionId", () => {
    test("should validate valid ObjectId", () => {
      const data = { id: "507f1f77bcf86cd799439011" };
      const { error } = validateActionId.validate(data);
      expect(error).toBeUndefined();
    });

    test("should reject invalid ObjectId format", () => {
      const data = { id: "invalid-id" };
      const { error } = validateActionId.validate(data);
      expect(error).toBeDefined();
    });

    test("should reject empty ID", () => {
      const data = { id: "" };
      const { error } = validateActionId.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe("Special Scenarios", () => {
    test("should handle long description text", () => {
      const longDescription = "A".repeat(500);
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: longDescription,
        client: "507f1f77bcf86cd799439011",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeUndefined();
    });

    test("should handle special characters in text", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Contact client: échéance le 31/12/2025 - Ré-négociation",
        client: "507f1f77bcf86cd799439011",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeUndefined();
    });

    test("should handle large monetary amounts", () => {
      const data = {
        type: "appel",
        dateAction: new Date(),
        description: "Large payment dispute",
        client: "507f1f77bcf86cd799439011",
        montantConvenu: 999999.99,
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeUndefined();
    });

    test("should validate all optional fields together", () => {
      const data = {
        type: "visite",
        dateAction: new Date(),
        description: "Full action with all optional fields",
        statut: "complétée",
        resultat: "succès",
        client: "507f1f77bcf86cd799439011",
        facture: "507f1f77bcf86cd799439013",
        montantConvenu: 2500,
        dateProchainSuivi: new Date("2025-06-30"),
        referenceDocument: "LETTRE-2025-001",
      };

      const { error } = createActionSchema.validate(data, {
        stripUnknown: true,
      });
      expect(error).toBeUndefined();
    });
  });
});
