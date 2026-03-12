import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  permanentlyDeleteClient,
  searchClients,
} from "../controllers/client.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jean Martin"
 *               email:
 *                 type: string
 *                 example: "jean@example.com"
 *               phone:
 *                 type: string
 *                 example: "+33612345678"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               notes:
 *                 type: string
 *               totalDebt:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Client already exists
 */
router.post(
  "/",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  createClient
);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients with pagination and filters
 *     tags: [Clients]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           description: Search by name, email, or phone
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *           description: Sort field with optional - prefix for descending
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", protect, authorizeRoles("agent", "manager", "admin"), getClients);

/**
 * @swagger
 * /api/clients/search/advanced:
 *   get:
 *     summary: Advanced search and filter clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *           description: Search in name, email, phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: minDebt
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDebt
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/search/advanced",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  searchClients
);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client details by ID
 *     tags: [Clients]
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
 *         description: Client details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 */
router.get(
  "/:id",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  getClientById
);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update client information
 *     tags: [Clients]
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               notes:
 *                 type: string
 *               totalDebt:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Client updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 *       409:
 *         description: Email or phone already in use
 */
router.put(
  "/:id",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  updateClient
);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Deactivate a client (soft delete)
 *     tags: [Clients]
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
 *         description: Client deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (manager, admin only)
 *       404:
 *         description: Client not found
 */
router.delete(
  "/:id",
  protect,
  authorizeRoles("manager", "admin"),
  deleteClient
);

/**
 * @swagger
 * /api/clients/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a client (hard delete)
 *     tags: [Clients]
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
 *         description: Client permanently deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Client not found
 */
router.delete(
  "/:id/permanent",
  protect,
  authorizeRoles("admin"),
  permanentlyDeleteClient
);

export default router;
