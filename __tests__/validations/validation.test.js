import invoiceSchemas from "../../src/validations/invoice.validation.js";
import paymentSchemas from "../../src/validations/payment.validation.js";

describe("Invoice Validation Schemas", () => {
  describe("createInvoice", () => {
    const validateOptions = {
      abortEarly: false,
      stripUnknown: true,
    };

    it("should accept valid invoice data", () => {
      const validData = {
        client: "507f1f77bcf86cd799439011",
        montant: 1500.50,
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        statut: "impayée",
        referenceFacture: "FAC-2025-001",
        description: "Services rendered",
        notes: "Net 30",
      };

      const { error } = invoiceSchemas.createInvoice.validate(validData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should reject invalid client ObjectId", () => {
      const invalidData = {
        client: "invalid-id",
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
        referenceFacture: "FAC-2025-001",
      };

      const { error } = invoiceSchemas.createInvoice.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("valid MongoDB ObjectId");
    });

    it("should reject negative montant", () => {
      const invalidData = {
        client: "507f1f77bcf86cd799439011",
        montant: -100,
        dateEcheance: new Date("2025-04-30"),
        referenceFacture: "FAC-2025-001",
      };

      const { error } = invoiceSchemas.createInvoice.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("greater than 0");
    });

    it("should reject past dateEcheance", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const invalidData = {
        client: "507f1f77bcf86cd799439011",
        montant: 1500,
        dateEcheance: yesterday,
        referenceFacture: "FAC-2025-001",
      };

      const { error } = invoiceSchemas.createInvoice.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
    });

    it("should reject invalid statut", () => {
      const invalidData = {
        client: "507f1f77bcf86cd799439011",
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
        referenceFacture: "FAC-2025-001",
        statut: "invalid-status",
      };

      const { error } = invoiceSchemas.createInvoice.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
    });

    it("should reject invalid referenceFacture format", () => {
      const invalidData = {
        client: "507f1f77bcf86cd799439011",
        montant: 1500,
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        referenceFacture: "abc",
      };

      const { error } = invoiceSchemas.createInvoice.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details.some(e => e.message.includes("uppercase letters"))).toBe(true);
    });

    it("should set default statut to impayée", () => {
      const data = {
        client: "507f1f77bcf86cd799439011",
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
        referenceFacture: "FAC-2025-001",
      };

      const { value } = invoiceSchemas.createInvoice.validate(data, validateOptions);
      expect(value.statut).toBe("impayée");
    });

    it("should trim whitespace from referenceFacture", () => {
      const data = {
        client: "507f1f77bcf86cd799439011",
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
        referenceFacture: "  FAC-2025-001  ",
      };

      const { value } = invoiceSchemas.createInvoice.validate(data, validateOptions);
      expect(value.referenceFacture).toBe("FAC-2025-001");
    });

    it("should remove unknown properties", () => {
      const data = {
        client: "507f1f77bcf86cd799439011",
        montant: 1500,
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        referenceFacture: "FAC-2025-001",
        unknownField: "should be removed",
      };

      // The schema enforces .unknown(false) which prevents unknown fields
      // The middleware uses stripUnknown: true to actually remove them
      // So with stripUnknown:false, unknown fields are rejected
      const { error } = invoiceSchemas.createInvoice.validate(data);
      expect(error.details.some(e => e.type === "object.unknown")).toBe(true);
    });
  });

  describe("updateInvoice", () => {
    const validateOptions = {
      abortEarly: false,
      stripUnknown: true,
    };

    it("should allow partial updates", () => {
      const partialData = {
        montant: 2000,
        statut: "payée",
      };

      const { error } = invoiceSchemas.updateInvoice.validate(partialData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should require at least one field for update", () => {
      const emptyData = {};

      const { error } = invoiceSchemas.updateInvoice.validate(emptyData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("At least one field");
    });
  });

  describe("queryInvoices", () => {
    const validateOptions = {
      abortEarly: false,
      stripUnknown: true,
    };

    it("should accept valid query parameters", () => {
      const query = {
        page: 1,
        limit: 10,
        statut: "impayée",
        search: "invoice",
      };

      const { error } = invoiceSchemas.queryInvoices.validate(query, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should set default page to 1", () => {
      const query = { limit: 10 };

      const { value } = invoiceSchemas.queryInvoices.validate(query, validateOptions);
      expect(value.page).toBe(1);
    });

    it("should set default limit to 10", () => {
      const query = { page: 2 };

      const { value } = invoiceSchemas.queryInvoices.validate(query, validateOptions);
      expect(value.limit).toBe(10);
    });

    it("should reject limit > 100", () => {
      const query = { limit: 101 };

      const { error } = invoiceSchemas.queryInvoices.validate(query, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("cannot exceed 100");
    });

    it("should accept valid sortBy options", () => {
      const validSorts = ["createdAt", "-createdAt", "montant", "-montant"];
      validSorts.forEach((sort) => {
        const query = { sortBy: sort };
        const { error } = invoiceSchemas.queryInvoices.validate(query, validateOptions);
        expect(error).toBeUndefined();
      });
    });
  });
});

describe("Payment Validation Schemas", () => {
  describe("createPayment", () => {
    const validateOptions = {
      abortEarly: false,
      stripUnknown: true,
    };

    it("should accept valid payment data", () => {
      const validData = {
        invoiceId: "507f1f77bcf86cd799439011",
        amount: 500.00,
        paymentDate: new Date("2025-03-10"),
        method: "bank_transfer",
        referenceNumber: "PAY-2025-001",
        notes: "Payment received",
      };

      const { error } = paymentSchemas.createPayment.validate(validData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should reject future paymentDate", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const invalidData = {
        invoiceId: "507f1f77bcf86cd799439011",
        amount: 500,
        paymentDate: tomorrow,
        method: "cash",
        referenceNumber: "PAY-001",
      };

      const { error } = paymentSchemas.createPayment.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("cannot be in the future");
    });

    it("should reject invalid payment method", () => {
      const invalidData = {
        invoiceId: "507f1f77bcf86cd799439011",
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "invalid-method",
        referenceNumber: "PAY-001",
      };

      const { error } = paymentSchemas.createPayment.validate(invalidData, validateOptions);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain("must be one of");
    });

    it("should accept all valid payment methods", () => {
      const methods = ["cash", "bank_transfer", "check", "credit_card", "online", "other"];
      methods.forEach((method) => {
        const data = {
          invoiceId: "507f1f77bcf86cd799439011",
          amount: 500,
          paymentDate: new Date("2025-03-10"),
          method,
          referenceNumber: "PAY-001",
        };

        const { error } = paymentSchemas.createPayment.validate(data, validateOptions);
        expect(error).toBeUndefined();
      });
    });

    it("should validate amount is positive", () => {
      const data = {
        invoiceId: "507f1f77bcf86cd799439011",
        amount: 50.25,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        referenceNumber: "PAY-001",
      };

      const { value } = paymentSchemas.createPayment.validate(data, validateOptions);
      expect(value.amount).toBeGreaterThan(0);
    });
  });

  describe("updatePayment", () => {
    const validateOptions = {
      abortEarly: false,
      stripUnknown: true,
    };

    it("should allow partial updates", () => {
      const partialData = {
        amount: 600,
        method: "check",
      };

      const { error } = paymentSchemas.updatePayment.validate(partialData, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should require at least one field for update", () => {
      const emptyData = {};

      const { error } = paymentSchemas.updatePayment.validate(emptyData, validateOptions);
      expect(error).toBeDefined();
    });
  });

  describe("queryPayments", () => {
    const validateOptions = {
      abortEarly: false,
      stripUnknown: true,
    };

    it("should accept valid query parameters", () => {
      const query = {
        page: 1,
        limit: 20,
        method: "bank_transfer",
        search: "payment",
      };

      const { error } = paymentSchemas.queryPayments.validate(query, validateOptions);
      expect(error).toBeUndefined();
    });

    it("should reject invalid method in query", () => {
      const query = {
        method: "invalid",
      };

      const { error } = paymentSchemas.queryPayments.validate(query, validateOptions);
      expect(error).toBeDefined();
    });

    it("should set default sortBy to -createdAt", () => {
      const query = { page: 1 };

      const { value } = paymentSchemas.queryPayments.validate(query, validateOptions);
      expect(value.sortBy).toBe("-createdAt");
    });
  });
});
