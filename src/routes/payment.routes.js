import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validateBody, validateQuery, validateParams } from "../middlewares/validate.middleware.js";
import paymentSchemas from "../validations/payment.validation.js";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentsByInvoice,
  getPaymentStats,
} from "../controllers/payment.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *               - paymentDate
 *               - method
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-03-10T10:30:00Z"
 *               method:
 *                 type: string
 *                 enum: ["cash", "bank_transfer", "check", "credit_card", "online", "other"]
 *                 example: "bank_transfer"
 *               referenceNumber:
 *                 type: string
 *                 example: "PAY-2025-001"
 *               notes:
 *                 type: string
 *                 example: "Payment received"
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       400:
 *         description: Missing required fields or amount exceeds invoice amount
 *       404:
 *         description: Invoice not found
 *       409:
 *         description: Payment with this reference number already exists
 *   get:
 *     summary: Get all payments with pagination and filters
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: ["cash", "bank_transfer", "check", "credit_card", "online", "other"]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "-paymentDate"
 *     responses:
 *       200:
 *         description: List of payments
 */
router.post("/", protect, authorizeRoles("agent", "manager", "admin"), validateBody(paymentSchemas.createPayment), createPayment);
router.get("/", protect, authorizeRoles("agent", "manager", "admin"), validateQuery(paymentSchemas.queryPayments), getPayments);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Get payment statistics by method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics
 */
router.get("/stats", protect, authorizeRoles("agent", "manager", "admin"), getPaymentStats);

/**
 * @swagger
 * /api/payments/invoice/{invoiceId}:
 *   get:
 *     summary: Get all payments for a specific invoice
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of payments for the invoice
 *       404:
 *         description: Invoice not found
 */
router.get(
  "/invoice/:invoiceId",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  validateQuery(paymentSchemas.queryInvoicePayments),
  getPaymentsByInvoice
);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get a specific payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 *   put:
 *     summary: Update a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               method:
 *                 type: string
 *                 enum: ["cash", "bank_transfer", "check", "credit_card", "online", "other"]
 *               referenceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 *       409:
 *         description: Reference number already exists
 *   delete:
 *     summary: Delete a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 */
router.get("/:id", protect, authorizeRoles("agent", "manager", "admin"), getPaymentById);
router.put("/:id", protect, authorizeRoles("agent", "manager", "admin"), validateBody(paymentSchemas.updatePayment), updatePayment);
router.delete("/:id", protect, authorizeRoles("agent", "manager", "admin"), deletePayment);

export default router;
