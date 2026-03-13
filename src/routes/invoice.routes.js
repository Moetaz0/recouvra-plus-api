import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoicesByClient,
} from "../controllers/invoice.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client
 *               - montant
 *               - dateEcheance
 *             properties:
 *               client:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               montant:
 *                 type: number
 *                 example: 1500.50
 *               dateEcheance:
 *                 type: string
 *                 format: date
 *                 example: "2025-04-30"
 *               statut:
 *                 type: string
 *                 enum: ["impayée", "payée", "en retard", "partiellement payée", "annulée"]
 *                 example: "impayée"
 *               description:
 *                 type: string
 *                 example: "Invoice for services rendered"
 *               referenceFacture:
 *                 type: string
 *                 example: "FAC-2025-001"
 *               notes:
 *                 type: string
 *                 example: "Payment terms: Net 30"
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Client not found
 *       409:
 *         description: Invoice with this reference already exists
 *   get:
 *     summary: Get all invoices with pagination and filters
 *     tags: [Invoices]
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
 *         name: statut
 *         schema:
 *           type: string
 *           enum: ["impayée", "payée", "en retard", "partiellement payée", "annulée"]
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.post("/", protect, authorizeRoles("agent", "manager", "admin"), createInvoice);
router.get("/", protect, authorizeRoles("agent", "manager", "admin"), getInvoices);

/**
 * @swagger
 * /api/invoices/client/{clientId}:
 *   get:
 *     summary: Get all invoices for a specific client
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
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
 *         description: List of invoices for the client
 *       404:
 *         description: Client not found
 */
router.get(
  "/client/:clientId",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  getInvoicesByClient
);

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get a specific invoice by ID
 *     tags: [Invoices]
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
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 *   put:
 *     summary: Update an invoice
 *     tags: [Invoices]
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
 *               montant:
 *                 type: number
 *               dateEcheance:
 *                 type: string
 *                 format: date
 *               statut:
 *                 type: string
 *                 enum: ["impayée", "payée", "en retard", "partiellement payée", "annulée"]
 *               dateReglement:
 *                 type: string
 *                 format: date
 *               montantPayé:
 *                 type: number
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       404:
 *         description: Invoice not found
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
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
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 */
router.get("/:id", protect, authorizeRoles("agent", "manager", "admin"), getInvoiceById);
router.put("/:id", protect, authorizeRoles("agent", "manager", "admin"), updateInvoice);
router.delete("/:id", protect, authorizeRoles("agent", "manager", "admin"), deleteInvoice);

export default router;
