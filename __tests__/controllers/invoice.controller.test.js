import { jest } from '@jest/globals';
import Invoice from "../../src/models/invoice.model.js";
import Client from "../../src/models/client.model.js";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoicesByClient,
} from "../../src/controllers/invoice.controller.js";

describe("Invoice Controller", () => {
  let req, res, next;
  const userId = "user123";
  const clientId = "client123";
  const invoiceId = "invoice123";

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

  describe("createInvoice", () => {
    it("should create an invoice with valid data", async () => {
      const invoiceData = {
        client: clientId,
        montant: 1500.50,
        dateEcheance: new Date("2025-04-30"),
        description: "Invoice for services",
        referenceFacture: "INV-2025-001",
      };

      req.body = invoiceData;

      const mockInvoice = {
        ...invoiceData,
        _id: invoiceId,
        statut: "impayée",
        montantPayé: 0,
        createdBy: userId,
        populate: jest
          .fn()
          .mockResolvedValue({
            ...invoiceData,
            _id: invoiceId,
            createdBy: { _id: userId, name: "User", email: "user@example.com", role: "admin" },
          }),
      };

      jest.spyOn(Client, 'findById').mockResolvedValue({ _id: clientId });
      jest.spyOn(Invoice, 'findOne').mockResolvedValue(null);
      jest.spyOn(Invoice, 'create').mockResolvedValue(mockInvoice);
      jest.spyOn(Client, 'findByIdAndUpdate').mockResolvedValue({ _id: clientId });

      await createInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invoice created successfully" })
      );
    });

    it("should return validation error if required fields are missing", async () => {
      req.body = { montant: 1000 };

      await createInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("required") })
      );
    });

    it("should return error if client does not exist", async () => {
      req.body = {
        client: clientId,
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
      };

      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      await createInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client not found" })
      );
    });

    it("should return error if referenceFacture already exists", async () => {
      const reference = "INV-2025-001";
      req.body = {
        client: clientId,
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
        referenceFacture: reference,
      };

      jest.spyOn(Client, 'findById').mockResolvedValue({ _id: clientId });
      jest.spyOn(Invoice, 'findOne').mockResolvedValue({ _id: "existing" });

      await createInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should handle errors", async () => {
      req.body = {
        client: clientId,
        montant: 1500,
        dateEcheance: new Date("2025-04-30"),
      };

      const error = new Error("Database error");
      jest.spyOn(Client, 'findById').mockRejectedValue(error);

      await createInvoice(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getInvoices", () => {
    it("should get all invoices with pagination", async () => {
      req.query = { page: 1, limit: 10 };

      const mockInvoices = [
        {
          _id: invoiceId,
          montant: 1500,
          statut: "impayée",
          client: clientId,
        },
      ];

      jest.spyOn(Invoice, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvoices),
      });

      await getInvoices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ invoices: mockInvoices })
      );
    });

    it("should filter invoices by status", async () => {
      req.query = { statut: "payée" };

      const mockInvoices = [];

      jest.spyOn(Invoice, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvoices),
      });

      await getInvoices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should filter invoices by client", async () => {
      req.query = { client: clientId };

      jest.spyOn(Invoice, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await getInvoices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getInvoiceById", () => {
    it("should get an invoice by ID", async () => {
      req.params = { id: invoiceId };

      const mockInvoice = {
        _id: invoiceId,
        montant: 1500,
        statut: "impayée",
      };

      jest.spyOn(Invoice, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockInvoice),
      });

      jest.spyOn(Invoice, 'findById').mockResolvedValue(mockInvoice);

      await getInvoiceById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ invoice: mockInvoice })
      );
    });

    it("should return 404 if invoice not found", async () => {
      req.params = { id: invoiceId };

      jest.spyOn(Invoice, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(null),
      });

      jest.spyOn(Invoice, 'findById').mockResolvedValue(null);

      await getInvoiceById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateInvoice", () => {
    it("should update an invoice", async () => {
      req.params = { id: invoiceId };
      req.body = {
        montant: 2000,
        statut: "payée",
        montantPayé: 2000,
      };

      const mockInvoice = {
        _id: invoiceId,
        montant: 1500,
        statut: "impayée",
        montantPayé: 0,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: invoiceId,
          montant: 2000,
          statut: "payée",
        }),
      };

      jest.spyOn(Invoice, 'findById').mockResolvedValue(mockInvoice);

      await updateInvoice(req, res, next);

      expect(mockInvoice.montant).toBe(2000);
      expect(mockInvoice.statut).toBe("payée");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if invoice not found", async () => {
      req.params = { id: invoiceId };
      req.body = { montant: 2000 };

      jest.spyOn(Invoice, 'findById').mockResolvedValue(null);

      await updateInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteInvoice", () => {
    it("should delete an invoice", async () => {
      req.params = { id: invoiceId };

      const mockInvoice = {
        _id: invoiceId,
        client: clientId,
      };

      jest.spyOn(Invoice, 'findByIdAndDelete').mockResolvedValue(mockInvoice);
      jest.spyOn(Client, 'findByIdAndUpdate').mockResolvedValue({ _id: clientId });

      await deleteInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invoice deleted successfully" })
      );
    });

    it("should return 404 if invoice not found", async () => {
      req.params = { id: invoiceId };

      jest.spyOn(Invoice, 'findByIdAndDelete').mockResolvedValue(null);

      await deleteInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getInvoicesByClient", () => {
    it("should get all invoices for a specific client", async () => {
      req.params = { clientId };
      req.query = { page: 1, limit: 10 };

      const mockInvoices = [
        {
          _id: invoiceId,
          montant: 1500,
          client: clientId,
        },
      ];

      jest.spyOn(Client, 'findById').mockResolvedValue({ _id: clientId });
      jest.spyOn(Invoice, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Invoice, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvoices),
      });

      await getInvoicesByClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ invoices: mockInvoices })
      );
    });

    it("should return 404 if client not found", async () => {
      req.params = { clientId };

      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      await getInvoicesByClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client not found" })
      );
    });
  });
});
