import { jest } from '@jest/globals';
import Payment from "../../src/models/payment.model.js";
import Invoice from "../../src/models/invoice.model.js";

describe("Payment Controller", () => {
  let req, res, next;
  const userId = "user123";
  const invoiceId = "invoice123";
  const paymentId = "payment123";

  beforeEach(() => {
    req = {
      user: { _id: userId },
      params: {},
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("createPayment", () => {
    it("should create a payment with valid data", async () => {
      const { createPayment } = await import("../../src/controllers/payment.controller.js");

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "bank_transfer",
        referenceNumber: "PAY-2025-001",
      };

      req.body = paymentData;

      const mockPayment = {
        ...paymentData,
        _id: paymentId,
        recordedBy: userId,
        populate: jest
          .fn()
          .mockResolvedValue({
            ...paymentData,
            _id: paymentId,
            recordedBy: { _id: userId, name: "User", email: "user@example.com" },
          }),
      };

      jest.spyOn(Invoice, 'findById').mockResolvedValue({ 
        _id: invoiceId,
        montant: 1000,
        statut: "impayée"
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue(null);
      jest.spyOn(Payment, 'create').mockResolvedValue(mockPayment);
      jest.spyOn(Payment, 'aggregate').mockResolvedValue([{ total: 500 }]);
      jest.spyOn(Invoice, 'findByIdAndUpdate').mockResolvedValue({ _id: invoiceId });

      await createPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Payment recorded successfully" })
      );
    });

    it("should return validation error if required fields are missing", async () => {
      const { createPayment } = await import("../../src/controllers/payment.controller.js");

      req.body = { amount: 500 };

      await createPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("required") })
      );
    });

    it("should return error if invoice does not exist", async () => {
      const { createPayment } = await import("../../src/controllers/payment.controller.js");

      req.body = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
      };

      jest.spyOn(Invoice, 'findById').mockResolvedValue(null);

      await createPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invoice not found" })
      );
    });

    it("should return error if payment amount exceeds invoice amount", async () => {
      const { createPayment } = await import("../../src/controllers/payment.controller.js");

      req.body = {
        invoiceId,
        amount: 2000,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
      };

      jest.spyOn(Invoice, 'findById').mockResolvedValue({ 
        _id: invoiceId,
        montant: 1000,
        statut: "impayée"
      });

      await createPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("exceed") })
      );
    });

    it("should return error if referenceNumber already exists", async () => {
      const { createPayment } = await import("../../src/controllers/payment.controller.js");

      const reference = "PAY-2025-001";
      req.body = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        referenceNumber: reference,
      };

      jest.spyOn(Invoice, 'findById').mockResolvedValue({ 
        _id: invoiceId,
        montant: 1000,
      });
      jest.spyOn(Payment, 'findOne').mockResolvedValue({ _id: "existing" });

      await createPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("getPayments", () => {
    it("should get all payments with pagination", async () => {
      const { getPayments } = await import("../../src/controllers/payment.controller.js");

      req.query = { page: 1, limit: 10 };

      const mockPayments = [
        {
          _id: paymentId,
          amount: 500,
          method: "cash",
          invoiceId,
        },
      ];

      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPayments),
      });

      await getPayments(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ payments: mockPayments })
      );
    });

    it("should filter payments by method", async () => {
      const { getPayments } = await import("../../src/controllers/payment.controller.js");

      req.query = { method: "bank_transfer" };

      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await getPayments(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getPaymentById", () => {
    it("should get a payment by ID", async () => {
      const { getPaymentById } = await import("../../src/controllers/payment.controller.js");

      req.params = { id: paymentId };

      const mockPayment = {
        _id: paymentId,
        amount: 500,
        method: "cash",
      };

      jest.spyOn(Payment, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockPayment),
      });

      jest.spyOn(Payment, 'findById').mockResolvedValue(mockPayment);

      await getPaymentById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ payment: mockPayment })
      );
    });

    it("should return 404 if payment not found", async () => {
      const { getPaymentById } = await import("../../src/controllers/payment.controller.js");

      req.params = { id: paymentId };

      jest.spyOn(Payment, 'findById').mockResolvedValue(null);

      await getPaymentById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updatePayment", () => {
    it("should update a payment", async () => {
      const { updatePayment } = await import("../../src/controllers/payment.controller.js");

      req.params = { id: paymentId };
      req.body = {
        amount: 600,
        method: "check",
      };

      const mockPayment = {
        _id: paymentId,
        amount: 500,
        method: "cash",
        invoiceId,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: paymentId,
          amount: 600,
          method: "check",
        }),
      };

      jest.spyOn(Payment, 'findById').mockResolvedValue(mockPayment);
      jest.spyOn(Invoice, 'findById').mockResolvedValue({ montant: 1000 });
      jest.spyOn(Payment, 'aggregate').mockResolvedValue([{ total: 600 }]);
      jest.spyOn(Invoice, 'findByIdAndUpdate').mockResolvedValue({ _id: invoiceId });

      await updatePayment(req, res, next);

      expect(mockPayment.amount).toBe(600);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if payment not found", async () => {
      const { updatePayment } = await import("../../src/controllers/payment.controller.js");

      req.params = { id: paymentId };
      req.body = { amount: 600 };

      jest.spyOn(Payment, 'findById').mockResolvedValue(null);

      await updatePayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deletePayment", () => {
    it("should delete a payment", async () => {
      const { deletePayment } = await import("../../src/controllers/payment.controller.js");

      req.params = { id: paymentId };

      const mockPayment = {
        _id: paymentId,
        invoiceId,
      };

      jest.spyOn(Payment, 'findByIdAndDelete').mockResolvedValue(mockPayment);
      jest.spyOn(Invoice, 'findById').mockResolvedValue({ montant: 1000 });
      jest.spyOn(Payment, 'aggregate').mockResolvedValue([{ total: 0 }]);
      jest.spyOn(Invoice, 'findByIdAndUpdate').mockResolvedValue({ _id: invoiceId });

      await deletePayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Payment deleted successfully" })
      );
    });

    it("should return 404 if payment not found", async () => {
      const { deletePayment } = await import("../../src/controllers/payment.controller.js");

      req.params = { id: paymentId };

      jest.spyOn(Payment, 'findByIdAndDelete').mockResolvedValue(null);

      await deletePayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getPaymentsByInvoice", () => {
    it("should get all payments for a specific invoice", async () => {
      const { getPaymentsByInvoice } = await import("../../src/controllers/payment.controller.js");

      req.params = { invoiceId };
      req.query = { page: 1, limit: 10 };

      const mockPayments = [
        {
          _id: paymentId,
          amount: 500,
          invoiceId,
        },
      ];

      jest.spyOn(Invoice, 'findById').mockResolvedValue({ _id: invoiceId });
      jest.spyOn(Payment, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Payment, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPayments),
      });

      await getPaymentsByInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ payments: mockPayments })
      );
    });

    it("should return 404 if invoice not found", async () => {
      const { getPaymentsByInvoice } = await import("../../src/controllers/payment.controller.js");

      req.params = { invoiceId };

      jest.spyOn(Invoice, 'findById').mockResolvedValue(null);

      await getPaymentsByInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getPaymentStats", () => {
    it("should get payment statistics", async () => {
      const { getPaymentStats } = await import("../../src/controllers/payment.controller.js");

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

      await getPaymentStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          byMethod: expect.any(Array),
          overall: expect.any(Object),
        })
      );
    });
  });
});
