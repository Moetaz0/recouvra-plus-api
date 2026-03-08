import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  getUsers,
  getUserById,
  updateCurrentUser,
  updateUserRole,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/me", protect, updateCurrentUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin and manager)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin, manager roles required)
 */
router.get("/", protect, authorizeRoles("admin", "manager"), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get one user by id (admin and manager)
 *     tags: [Users]
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
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin, manager roles required)
 *       404:
 *         description: User not found
 */
router.get("/:id", protect, authorizeRoles("admin", "manager"), getUserById);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role (admin and manager)
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/UpdateRoleInput'
 *     responses:
 *       200:
 *         description: User role updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin, manager roles required)
 *       404:
 *         description: User not found
 */
router.put("/:id/role", protect, authorizeRoles("admin", "manager"), updateUserRole);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
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
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

export default router;