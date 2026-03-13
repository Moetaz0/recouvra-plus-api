import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validateBody, validateQuery, validateParams } from "../middlewares/validate.middleware.js";
import actionSchemas from "../validations/action.validation.js";
import {
  createAction,
  getActions,
  getActionById,
  updateAction,
  deleteAction,
  getActionsByClient,
  getActionsByInvoice,
  getActionsByAgent,
  getActionsByType,
} from "../controllers/action.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/actions:
 *   post:
 *     summary: Create a new recovery action
 *     tags: [Recovery Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateActionInput'
 *     responses:
 *       201:
 *         description: Action created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  validateBody(actionSchemas.createAction),
  createAction
);

/**
 * @swagger
 * /api/actions:
 *   get:
 *     summary: Get all recovery actions
 *     tags: [Recovery Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: agent
 *         schema:
 *           type: string
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of actions
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  validateQuery(actionSchemas.queryActions),
  getActions
);

/**
 * @swagger
 * /api/actions/client/{clientId}:
 *   get:
 *     summary: Get actions for a specific client
 *     tags: [Recovery Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of client actions
 *       404:
 *         description: Client not found
 */
router.get(
  "/client/:clientId",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  getActionsByClient
);

/**
 * @swagger
 * /api/actions/invoice/{invoiceId}:
 *   get:
 *     summary: Get actions for a specific invoice
 *     tags: [Recovery Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of invoice actions
 */
router.get(
  "/invoice/:invoiceId",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  getActionsByInvoice
);

/**
 * @swagger
 * /api/actions/agent/{agentId}:
 *   get:
 *     summary: Get actions for a specific agent
 *     tags: [Recovery Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of agent actions
 */
router.get(
  "/agent/:agentId",
  protect,
  authorizeRoles("manager", "admin"),
  getActionsByAgent
);

/**
 * @swagger
 * /api/actions/type/{type}:
 *   get:
 *     summary: Get actions by type
 *     tags: [Recovery Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of actions by type
 */
router.get(
  "/type/:type",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  getActionsByType
);

/**
 * @swagger
 * /api/actions/{id}:
 *   get:
 *     summary: Get action details
 *     tags: [Recovery Actions]
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
 *         description: Action details
 *       404:
 *         description: Action not found
 */
router.get("/:id", protect, authorizeRoles("agent", "manager", "admin"), getActionById);

/**
 * @swagger
 * /api/actions/{id}:
 *   put:
 *     summary: Update an action
 *     tags: [Recovery Actions]
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
 *             $ref: '#/components/schemas/UpdateActionInput'
 *     responses:
 *       200:
 *         description: Action updated successfully
 *       404:
 *         description: Action not found
 */
router.put(
  "/:id",
  protect,
  authorizeRoles("agent", "manager", "admin"),
  validateParams(actionSchemas.validateActionId),
  validateParams(actionSchemas.validateActionId),
  validateBody(actionSchemas.updateAction),
  updateAction
);

/**
 * @swagger
 * /api/actions/{id}:
 *   delete:
 *     summary: Delete an action
 *     tags: [Recovery Actions]
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
 *         description: Action deleted successfully
 *       404:
 *         description: Action not found
 */
router.delete(
  "/:id",
  protect,
  authorizeRoles("manager", "admin"),
  validateParams(actionSchemas.validateActionId),
  deleteAction
);

export default router;
