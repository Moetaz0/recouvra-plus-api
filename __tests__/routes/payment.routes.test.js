import { jest } from '@jest/globals';
import Payment from "../../src/models/payment.model.js";
import Invoice from "../../src/models/invoice.model.js";
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

const { default: paymentRoutes } = await import("../../src/routes/payment.routes.js");

describe("Payment Routes Integration", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/payments", paymentRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/payments - Create Payment", () => {
    it("should create a new payment", async () => {
      const mockInvoiceId = "invoice123";
      const mockPayment = {
        _id: "payment123",
        invoiceId: mockInvoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "bank_transfer",
        referenceNumber: "PAY-2025-001",
        populate: jest.fn().mockResolvedValue({
          _id: "payment123",
          invoiceId: mockInvoiceId,
          amount: 500,
          paymentDate: new Date("2025-03-10"),
          method: "bank_transfer",
        }),
      };

      jest.spyOn(Invoice, 'findById').mockResolvedValue({ 
        _id: mockInvoiceId,
        montant: 1000,
        statut: "impayée"
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue(null);
      jest.spyOn(Payment, 'create').mockResolvedValue(mockPayment);
      jest.spyOn(Payment, 'aggregate').mockResolvedValue([{ total: 500 }]);
      jest.spyOn(Invoice, 'findByIdAndUpdate').mockResolvedValue({ _id: mockInvoiceId });

      const response = await request(app)
        .post("/api/payments")
        .send({
          invoiceId: mockInvoiceId,
          amount: 500,
          paymentDate: "2025-03-10",
          method: "bank_transfer",
          referenceNumber: "PAY-2025-001",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Payment recorded successfully");
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/payments")
        .send({
          amount: 500,
        });

      expect(response.status).toBe(400);
    });

    it("should return 404 if invoice not found", async () => {
      jest.spyOn(Invoice, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .post("/api/payments")
        .send({
          invoiceId: "nonexistent",
          amount: 500,
          paymentDate: "2025-03-10",
          method: "cash",
        });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/payments - Get All Payments", () => {
    it("should get all payments with pagination", async () => {
      const mockPayments = [
        {
          _id: "payment123",
          amount: 500,
          method: "cash",
          invoiceId: "invoice123",
        },
      ];

      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPayments),
      });

      const response = await request(app).get("/api/payments").query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("payments");
      expect(response.body).toHaveProperty("pagination");
    });

    it("should filter payments by method", async () => {
      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app)
        .get("/api/payments")
        .query({ method: "bank_transfer" });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/payments/stats - Get Payment Statistics", () => {
    it("should get payment statistics by method", async () => {
      const mockStats = [
        { _id: "cash", totalAmount: 1000, count: 5 },
        { _id: "bank_transfer", totalAmount: 2000, count: 3 },
      ];

      const mockOverallStats = [
        { _id: null, totalPayments: 3000, averagePayment: 600, countPayments: 8 },
      ];

      jest.spyOn(Payment, 'aggregate')
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockOverallStats);

      const response = await request(app).get("/api/payments/stats");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("byMethod");
      expect(response.body).toHaveProperty("overall");
    });
  });

  describe("GET /api/payments/invoice/:invoiceId - Get Payments by Invoice", () => {
    it("should get all payments for a specific invoice", async () => {
      const mockInvoiceId = "invoice123";
      const mockPayments = [
        {
          _id: "payment123",
          amount: 500,
          invoiceId: mockInvoiceId,
        },
      ];

      jest.spyOn(Invoice, 'findById').mockResolvedValue({ _id: mockInvoiceId });
      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPayments),
      });

      const response = await request(app)
        .get(`/api/payments/invoice/${mockInvoiceId}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("payments");
    });

    it("should return 404 if invoice not found", async () => {
      jest.spyOn(Invoice, 'findById').mockResolvedValue(null);

      const response = await request(app).get("/api/payments/invoice/nonexistent");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/payments/:id - Get Payment by ID", () => {
    it("should get a payment by ID", async () => {
      const mockPayment = {
        _id: "payment123",
        amount: 500,
        method: "cash",
      };

      jest.spyOn(Payment, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockPayment),
      });

      const response = await request(app).get("/api/payments/payment123");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("payment");
    });

    it("should return 404 if payment not found", async () => {
      jest.spyOn(Payment, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).get("/api/payments/nonexistent");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/payments/:id - Update Payment", () => {
    it("should update a payment", async () => {
      const mockPayment = {
        _id: "payment123",
        amount: 500,
        method: "cash",
        invoiceId: "invoice123",
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: "payment123",
          amount: 600,
          method: "check",
        }),
      };

      jest.spyOn(Payment, 'findById').mockResolvedValue(mockPayment);
      jest.spyOn(Invoice, 'findById').mockResolvedValue({ montant: 1000 });
      jest.spyOn(Payment, 'aggregate').mockResolvedValue([{ total: 600 }]);
      jest.spyOn(Invoice, 'findByIdAndUpdate').mockResolvedValue({ _id: "invoice123" });

      const response = await request(app)
        .put("/api/payments/payment123")
        .send({
          amount: 600,
          method: "check",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Payment updated successfully");
    });

    it("should return 404 if payment not found", async () => {
      jest.spyOn(Payment, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .put("/api/payments/nonexistent")
        .send({
          amount: 600,
        });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/payments/:id - Delete Payment", () => {
    it("should delete a payment", async () => {
      const mockPayment = {
        _id: "payment123",
        invoiceId: "invoice123",
      };

      jest.spyOn(Payment, 'findByIdAndDelete').mockResolvedValue(mockPayment);
      jest.spyOn(Invoice, 'findById').mockResolvedValue({ montant: 1000 });
      jest.spyOn(Payment, 'aggregate').mockResolvedValue([{ total: 0 }]);
      jest.spyOn(Invoice, 'findByIdAndUpdate').mockResolvedValue({ _id: "invoice123" });

      const response = await request(app).delete("/api/payments/payment123");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Payment deleted successfully");
    });

    it("should return 404 if payment not found", async () => {
      jest.spyOn(Payment, 'findByIdAndDelete').mockResolvedValue(null);

      const response = await request(app).delete("/api/payments/nonexistent");

      expect(response.status).toBe(404);
    });
  });
});
