import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validateQuery } from "../middlewares/validate.middleware.js";
import statsSchemas from "../validations/stats.validation.js";
import { getGlobalStats } from "../controllers/stats.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get global financial and collection statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Optional period start date (must be used with endDate)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Optional period end date (must be used with startDate)
 *     responses:
 *       200:
 *         description: Statistics returned successfully
 *       400:
 *         description: Invalid query parameters
 *       403:
 *         description: Forbidden (Manager/Admin only)
 */
router.get(
  "/",
  protect,
  authorizeRoles("manager", "admin"),
  validateQuery(statsSchemas.queryGlobalStats),
  getGlobalStats
);

export default router;
