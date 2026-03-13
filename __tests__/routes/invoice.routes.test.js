import { jest } from '@jest/globals';
import Invoice from "../../src/models/invoice.model.js";
import Client from "../../src/models/client.model.js";
import express from "express";
import request from "supertest";

// Mock auth middleware for ES modules
jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
  protect: (req, res, next) => {
    req.user = {
      _id: "user123",
      role: "admin",
      name: "Admin",
      email: "admin@example.com",
    };
    next();
  },
}));

jest.unstable_mockModule("../../src/middlewares/role.middleware.js", () => ({
  authorizeRoles: (...roles) => (req, res, next) => next(),
}));

const { default: invoiceRoutes } = await import("../../src/routes/invoice.routes.js");

describe("Invoice Routes Integration", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/invoices", invoiceRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/invoices - Create Invoice", () => {
    it("should create a new invoice", async () => {
      const mockClientId = "client123";
      const mockInvoice = {
        _id: "invoice123",
        client: mockClientId,
        montant: 1500.50,
        dateEcheance: new Date("2025-04-30"),
        statut: "impayée",
        description: "Invoice for services",
        referenceFacture: "INV-2025-001",
        populate: jest.fn().mockResolvedValue({
          _id: "invoice123",
          client: mockClientId,
          montant: 1500.50,
          dateEcheance: new Date("2025-04-30"),
          statut: "impayée",
        }),
      };

      jest.spyOn(Client, 'findById').mockResolvedValue({ _id: mockClientId });
      jest.spyOn(Invoice, 'findOne').mockResolvedValue(null);
      jest.spyOn(Invoice, 'create').mockResolvedValue(mockInvoice);
      jest.spyOn(Client, 'findByIdAndUpdate').mockResolvedValue({ _id: mockClientId });

      const response = await request(app)
        .post("/api/invoices")
        .send({
          client: mockClientId,
          montant: 1500.50,
          dateEcheance: "2025-04-30",
          description: "Invoice for services",
          referenceFacture: "INV-2025-001",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Invoice created successfully");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/invoices")
        .send({
          client: "client123",
        });

      expect(response.status).toBe(400);
    });

    it("should return 404 if client not found", async () => {
      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .post("/api/invoices")
        .send({
          client: "nonexistent",
          montant: 1500,
          dateEcheance: "2025-04-30",
        });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/invoices - Get All Invoices", () => {
    it("should get all invoices with pagination", async () => {
      const mockInvoices = [
        {
          _id: "invoice123",
          montant: 1500,
          statut: "impayée",
          client: "client123",
        },
      ];

      jest.spyOn(Invoice, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvoices),
      });

      const response = await request(app).get("/api/invoices").query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoices");
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter invoices by status", async () => {
      const mockInvoices = [];

      jest.spyOn(Invoice, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvoices),
      });

      const response = await request(app)
        .get("/api/invoices")
        .query({ statut: "payée" });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/invoices/:id - Get Invoice by ID", () => {
    it("should get an invoice by ID", async () => {
      const mockInvoice = {
        _id: "invoice123",
        montant: 1500,
        statut: "impayée",
        client: "client123",
      };

      jest.spyOn(Invoice, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockInvoice),
      });

      const response = await request(app).get("/api/invoices/invoice123");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoice");
    });

    it("should return 404 if invoice not found", async () => {
      jest.spyOn(Invoice, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).get("/api/invoices/nonexistent");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/invoices/:id - Update Invoice", () => {
    it("should update an invoice", async () => {
      const mockInvoice = {
        _id: "invoice123",
        montant: 1500,
        statut: "impayée",
        montantPayé: 0,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: "invoice123",
          montant: 2000,
          statut: "payée",
        }),
      };

      jest.spyOn(Invoice, 'findById').mockResolvedValue(mockInvoice);

      const response = await request(app)
        .put("/api/invoices/invoice123")
        .send({
          montant: 2000,
          statut: "payée",
          montantPayé: 2000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Invoice updated successfully");
    });

    it("should return 404 if invoice not found", async () => {
      jest.spyOn(Invoice, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .put("/api/invoices/nonexistent")
        .send({
          montant: 2000,
        });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/invoices/:id - Delete Invoice", () => {
    it("should delete an invoice", async () => {
      const mockInvoice = {
        _id: "invoice123",
        client: "client123",
      };

      jest.spyOn(Invoice, 'findByIdAndDelete').mockResolvedValue(mockInvoice);
      jest.spyOn(Client, 'findByIdAndUpdate').mockResolvedValue({ _id: "client123" });

      const response = await request(app).delete("/api/invoices/invoice123");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Invoice deleted successfully");
    });

    it("should return 404 if invoice not found", async () => {
      jest.spyOn(Invoice, 'findByIdAndDelete').mockResolvedValue(null);

      const response = await request(app).delete("/api/invoices/nonexistent");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/invoices/client/:clientId - Get Invoices by Client", () => {
    it("should get all invoices for a specific client", async () => {
      const mockClientId = "client123";
      const mockInvoices = [
        {
          _id: "invoice123",
          montant: 1500,
          client: mockClientId,
        },
      ];

      jest.spyOn(Client, 'findById').mockResolvedValue({ _id: mockClientId });
      jest.spyOn(Invoice, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvoices),
      });

      const response = await request(app)
        .get(`/api/invoices/client/${mockClientId}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoices");
    });

    it("should return 404 if client not found", async () => {
      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      const response = await request(app).get("/api/invoices/client/nonexistent");

      expect(response.status).toBe(404);
    });
  });
});
