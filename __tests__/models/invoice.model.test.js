import mongoose from "mongoose";
import Invoice from "../../src/models/invoice.model.js";

describe("Invoice Model", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || "mongodb://localhost/recouvra-plus-test");
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Invoice.deleteMany({});
  });

  describe("Invoice Creation", () => {
    it("should create an invoice with valid data", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      
      const invoiceData = {
        client: clientId,
        montant: 1500.50,
        dateEcheance: new Date("2025-04-30"),
        statut: "impayée",
        description: "Invoice for services rendered",
        referenceFacture: "INV-2025-001",
        notes: "Payment terms: Net 30",
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice).toBeDefined();
      expect(invoice.montant).toBe(1500.50);
      expect(invoice.statut).toBe("impayée");
      expect(invoice.referenceFacture).toBe("INV-2025-001");
      expect(invoice.montantPayé).toBe(0);
    });

    it("should require client, montant, and dateEcheance fields", async () => {
      const invalidData = {
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Invoice.create(invalidData)).rejects.toThrow();
    });

    it("should enforce unique referenceFacture", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const reference = "INV-2025-001";

      const invoiceData = {
        client: clientId,
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
        referenceFacture: reference,
        createdBy: userId,
      };

      await Invoice.create(invoiceData);

      const duplicateData = {
        client: clientId,
        montant: 2000,
        dateEcheance: new Date("2025-05-30"),
        referenceFacture: reference,
        createdBy: userId,
      };

      await expect(Invoice.create(duplicateData)).rejects.toThrow();
    });

    it("should set default status to impayée", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invoiceData = {
        client: clientId,
        montant: 1000,
        dateEcheance: new Date("2025-04-30"),
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.statut).toBe("impayée");
    });

    it("should set default montantPayé to 0", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invoiceData = {
        client: clientId,
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.montantPayé).toBe(0);
    });

    it("should have valid statut enum values", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const validStatuts = ["impayée", "payée", "en retard", "partiellement payée", "annulée"];

      for (const statut of validStatuts) {
        const invoice = await Invoice.create({
          client: clientId,
          montant: 1000,
          dateEcheance: new Date("2025-04-30"),
          statut,
          createdBy: userId,
        });

        expect(invoice.statut).toBe(statut);
      }
    });

    it("should enforce minimum montant value of 0", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invalidData = {
        client: clientId,
        montant: -100,
        dateEcheance: new Date("2025-04-30"),
        createdBy: userId,
      };

      await expect(Invoice.create(invalidData)).rejects.toThrow();
    });

    it("should trim whitespace from text fields", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invoiceData = {
        client: clientId,
        montant: 1000,
        dateEcheance: new Date("2025-04-30"),
        description: "  Invoice Description  ",
        referenceFacture: "  INV-2025-001  ",
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.description).toBe("Invoice Description");
      expect(invoice.referenceFacture).toBe("INV-2025-001");
    });
  });

  describe("Invoice Validations", () => {
    it("should accept valid date for dateEcheance", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const invoiceData = {
        client: clientId,
        montant: 1000,
        dateEcheance: futureDate,
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.dateEcheance).toEqual(futureDate);
    });

    it("should handle optional dateReglement field", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const paymentDate = new Date();

      const invoiceData = {
        client: clientId,
        montant: 1000,
        dateEcheance: new Date("2025-04-30"),
        dateReglement: paymentDate,
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.dateReglement).toEqual(paymentDate);
    });

    it("should have timestamps (createdAt, updatedAt)", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invoiceData = {
        client: clientId,
        montant: 1000,
        dateEcheance: new Date("2025-04-30"),
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.createdAt).toBeDefined();
      expect(invoice.updatedAt).toBeDefined();
    });
  });

  describe("Invoice References", () => {
    it("should reference Client model correctly", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invoiceData = {
        client: clientId,
        montant: 1000,
        dateEcheance: new Date("2025-04-30"),
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.client).toEqual(clientId);
    });

    it("should reference User model for createdBy", async () => {
      const clientId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invoiceData = {
        client: clientId,
        montant: 1000,
        dateEcheance: new Date("2025-04-30"),
        createdBy: userId,
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice.createdBy).toEqual(userId);
    });
  });
});
