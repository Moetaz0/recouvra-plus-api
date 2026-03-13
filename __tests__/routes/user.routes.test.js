import { jest } from '@jest/globals';
import User from "../../src/models/user.model.js";
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

const { default: userRoutes } = await import("../../src/routes/user.routes.js");

describe("User Routes Integration", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/users", userRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PUT /api/users/me - Update Current User", () => {
    it("should update current user profile", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .put("/api/users/me")
        .send({ name: "Jane Doe" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Profile updated successfully");
    });

    it("should return 409 if email is already in use", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);
      jest.spyOn(User, "findOne").mockResolvedValue({ _id: "other123" });

      const response = await request(app)
        .put("/api/users/me")
        .send({ email: "taken@example.com" });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Email already in use");
    });
  });

  describe("GET /api/users - List Users", () => {
    it("should return list of users", async () => {
      const mockUsers = [
        { _id: "1", name: "User 1", email: "user1@example.com", role: "agent" },
        { _id: "2", name: "User 2", email: "user2@example.com", role: "manager" },
      ];

      jest.spyOn(User, "find").mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
    });

    it("should exclude password from response", async () => {
      jest.spyOn(User, "find").mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await request(app).get("/api/users");

      expect(User.find().select).toHaveBeenCalledWith("-password");
    });
  });

  describe("GET /api/users/:id - Get User", () => {
    it("should return a specific user", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
      };

      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await request(app).get("/api/users/user123");

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    it("should return 404 if user not found", async () => {
      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).get("/api/users/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("PUT /api/users/:id/role - Update User Role", () => {
    it("should update user role", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "agent",
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);

      const response = await request(app)
        .put("/api/users/user123/role")
        .send({ role: "manager" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User role updated successfully");
    });

    it("should return 400 for invalid role", async () => {
      const response = await request(app)
        .put("/api/users/user123/role")
        .send({ role: "superadmin" });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing role", async () => {
      const response = await request(app)
        .put("/api/users/user123/role")
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 404 if user not found", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(null);

      const response = await request(app)
        .put("/api/users/user123/role")
        .send({ role: "admin" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should accept all valid roles", async () => {
      const validRoles = ["agent", "manager", "admin"];

      for (const role of validRoles) {
        const mockUser = {
          _id: "user123",
          role: "agent",
          save: jest.fn().mockResolvedValue(true),
        };

        jest.spyOn(User, "findById").mockResolvedValue(mockUser);

        const response = await request(app)
          .put("/api/users/user123/role")
          .send({ role });

        expect(response.status).toBe(200);
      }
    });
  });

  describe("DELETE /api/users/:id - Delete User", () => {
    it("should delete a user", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);

      const response = await request(app).delete("/api/users/user123");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User deleted successfully");
    });

    it("should return 404 if user not found", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(null);

      const response = await request(app).delete("/api/users/user123");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should call deleteOne on the user", async () => {
      const mockUser = {
        _id: "user123",
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);

      await request(app).delete("/api/users/user123");

      expect(mockUser.deleteOne).toHaveBeenCalled();
    });
  });
});
