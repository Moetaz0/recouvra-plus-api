import mongoose from "mongoose";
import Payment from "../../src/models/payment.model.js";

describe("Payment Model", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || "mongodb://localhost/recouvra-plus-test");
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Payment.deleteMany({});
  });

  describe("Payment Creation", () => {
    it("should create a payment with valid data", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const paymentData = {
        invoiceId,
        amount: 500.00,
        paymentDate: new Date("2025-03-10"),
        method: "bank_transfer",
        recordedBy: userId,
        referenceNumber: "PAY-2025-001",
        notes: "Payment received",
      };

      const payment = await Payment.create(paymentData);

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(500.00);
      expect(payment.method).toBe("bank_transfer");
      expect(payment.referenceNumber).toBe("PAY-2025-001");
    });

    it("should require invoiceId, amount, paymentDate, and method fields", async () => {
      const invalidData = {
        recordedBy: new mongoose.Types.ObjectId(),
      };

      await expect(Payment.create(invalidData)).rejects.toThrow();
    });

    it("should enforce unique referenceNumber", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const reference = "PAY-2025-001";

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "bank_transfer",
        recordedBy: userId,
        referenceNumber: reference,
      };

      await Payment.create(paymentData);

      const duplicateData = {
        invoiceId: new mongoose.Types.ObjectId(),
        amount: 1000,
        paymentDate: new Date("2025-03-11"),
        method: "check",
        recordedBy: userId,
        referenceNumber: reference,
      };

      await expect(Payment.create(duplicateData)).rejects.toThrow();
    });

    it("should have valid payment methods", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const validMethods = ["cash", "bank_transfer", "check", "credit_card", "online", "other"];

      for (const method of validMethods) {
        const payment = await Payment.create({
          invoiceId,
          amount: 100,
          paymentDate: new Date("2025-03-10"),
          method,
          recordedBy: userId,
        });

        expect(payment.method).toBe(method);
      }
    });

    it("should enforce minimum amount value of 0", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const invalidData = {
        invoiceId,
        amount: -50,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        recordedBy: userId,
      };

      await expect(Payment.create(invalidData)).rejects.toThrow();
    });

    it("should set default timestamps", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        recordedBy: userId,
      };

      const payment = await Payment.create(paymentData);

      expect(payment.createdAt).toBeDefined();
      expect(payment.updatedAt).toBeDefined();
    });

    it("should trim whitespace from text fields", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        recordedBy: userId,
        referenceNumber: "  PAY-2025-001  ",
        notes: "  Payment received  ",
      };

      const payment = await Payment.create(paymentData);

      expect(payment.referenceNumber).toBe("PAY-2025-001");
      expect(payment.notes).toBe("Payment received");
    });

    it("should make notes field optional", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        recordedBy: userId,
      };

      const payment = await Payment.create(paymentData);

      expect(payment.notes).toBeUndefined();
    });
  });

  describe("Payment References", () => {
    it("should reference Invoice model correctly", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        recordedBy: userId,
      };

      const payment = await Payment.create(paymentData);

      expect(payment.invoiceId).toEqual(invoiceId);
    });

    it("should reference User model for recordedBy", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        recordedBy: userId,
      };

      const payment = await Payment.create(paymentData);

      expect(payment.recordedBy).toEqual(userId);
    });

    it("should handle optional updatedBy reference", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate: new Date("2025-03-10"),
        method: "cash",
        recordedBy: userId,
      };

      const payment = await Payment.create(paymentData);

      expect(payment.updatedBy).toBeUndefined();
    });
  });

  describe("Payment Validations", () => {
    it("should accept valid paymentDate", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const paymentDate = new Date();

      const paymentData = {
        invoiceId,
        amount: 500,
        paymentDate,
        method: "cash",
        recordedBy: userId,
      };

      const payment = await Payment.create(paymentData);

      expect(payment.paymentDate).toEqual(paymentDate);
    });

    it("should accept different amount values", async () => {
      const invoiceId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();

      const amounts = [0, 50.50, 100, 1000.99, 999999.99];

      for (const amount of amounts) {
        const payment = await Payment.create({
          invoiceId,
          amount,
          paymentDate: new Date("2025-03-10"),
          method: "cash",
          recordedBy: userId,
        });

        expect(payment.amount).toBe(amount);
      }
    });
  });
});
