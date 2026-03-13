import { jest } from '@jest/globals';
import User from "../../src/models/user.model.js";
import {
  getUsers,
  getUserById,
  updateCurrentUser,
  updateUserRole,
  deleteUser,
} from "../../src/controllers/user.controller.js";

describe("User Controller", () => {
  let req, res, next;
  const userId = "user123";

  beforeEach(() => {
    req = {
      user: { _id: userId },
      params: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should return all users without passwords", async () => {
      const mockUsers = [
        { _id: "1", name: "User 1", email: "user1@example.com", role: "agent" },
        { _id: "2", name: "User 2", email: "user2@example.com", role: "admin" },
      ];

      jest.spyOn(User, "find").mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      await getUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ users: mockUsers });
    });

    it("should call next with error on database failure", async () => {
      const error = new Error("Database error");
      jest.spyOn(User, "find").mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await getUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should exclude password field from results", async () => {
      jest.spyOn(User, "find").mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await getUsers(req, res, next);

      expect(User.find().select).toHaveBeenCalledWith("-password");
    });
  });

  describe("getUserById", () => {
    it("should return user by id without password", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
      };

      req.params.id = "user123";

      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it("should return 404 if user not found", async () => {
      req.params.id = "nonexistent";

      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should call next with error on database failure", async () => {
      req.params.id = "user123";
      const error = new Error("Database error");

      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await getUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateCurrentUser", () => {
    it("should update current user profile", async () => {
      const mockUser = {
        _id: userId,
        name: "John Doe",
        email: "john@example.com",
        role: "agent",
        save: jest.fn().mockResolvedValue(true),
      };

      req.body = { name: "Jane Doe" };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      await updateCurrentUser(req, res, next);

      expect(mockUser.name).toBe("Jane Doe");
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update email if it's not in use", async () => {
      const mockUser = {
        _id: userId,
        name: "John Doe",
        email: "john@example.com",
        role: "agent",
        save: jest.fn().mockResolvedValue(true),
      };

      req.body = { email: "jane@example.com" };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      await updateCurrentUser(req, res, next);

      expect(mockUser.email).toBe("jane@example.com");
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should return 409 if email is already in use", async () => {
      const mockUser = {
        _id: userId,
        name: "John Doe",
        email: "john@example.com",
        role: "agent",
      };

      const existingUser = {
        _id: "other123",
        email: "jane@example.com",
      };

      req.body = { email: "jane@example.com" };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);
      jest.spyOn(User, "findOne").mockResolvedValue(existingUser);

      await updateCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: "Email already in use" });
    });

    it("should return 404 if user not found", async () => {
      req.body = { name: "Jane Doe" };

      jest.spyOn(User, "findById").mockResolvedValue(null);

      await updateCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      req.body = { name: "Jane Doe" };

      jest.spyOn(User, "findById").mockRejectedValue(error);

      await updateCurrentUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateUserRole", () => {
    it("should update user role", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "agent",
        save: jest.fn().mockResolvedValue(true),
      };

      req.params.id = "user123";
      req.body = { role: "manager" };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);

      await updateUserRole(req, res, next);

      expect(mockUser.role).toBe("manager");
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for missing role", async () => {
      req.params.id = "user123";
      req.body = {};

      await updateUserRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 400 for invalid role", async () => {
      req.params.id = "user123";
      req.body = { role: "superadmin" };

      await updateUserRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if user not found", async () => {
      req.params.id = "nonexistent";
      req.body = { role: "admin" };

      jest.spyOn(User, "findById").mockResolvedValue(null);

      await updateUserRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should accept all valid roles", async () => {
      const validRoles = ["agent", "manager", "admin"];

      for (const role of validRoles) {
        const mockUser = {
          _id: "user123",
          role: "agent",
          save: jest.fn().mockResolvedValue(true),
        };

        req.params.id = "user123";
        req.body = { role };

        jest.spyOn(User, "findById").mockResolvedValue(mockUser);

        await updateUserRole(req, res, next);

        expect(mockUser.role).toBe(role);
      }
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const mockUser = {
        _id: "user123",
        name: "John Doe",
        deleteOne: jest.fn().mockResolvedValue(true),
      };

      req.params.id = "user123";

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);

      await deleteUser(req, res, next);

      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });

    it("should return 404 if user not found", async () => {
      req.params.id = "nonexistent";

      jest.spyOn(User, "findById").mockResolvedValue(null);

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      req.params.id = "user123";

      jest.spyOn(User, "findById").mockRejectedValue(error);

      await deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should call deleteOne on the user", async () => {
      const mockUser = {
        _id: "user123",
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      req.params.id = "user123";

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);

      await deleteUser(req, res, next);

      expect(mockUser.deleteOne).toHaveBeenCalled();
    });
  });
});
