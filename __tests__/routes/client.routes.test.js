import { jest } from '@jest/globals';
import Client from "../../src/models/client.model.js";
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

const { default: clientRoutes } = await import("../../src/routes/client.routes.js");

describe("Client Routes Integration", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/clients", clientRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/clients - Create Client", () => {
    it("should create a new client", async () => {
      const mockClient = {
        _id: "client123",
        name: "Jean Martin",
        email: "jean@example.com",
        phone: "+33612345678",
        populate: jest.fn().mockResolvedValue({
          _id: "client123",
          name: "Jean Martin",
          email: "jean@example.com",
          phone: "+33612345678",
        }),
      };

      jest.spyOn(Client, 'findOne').mockResolvedValue(null);
      jest.spyOn(Client, 'create').mockResolvedValue(mockClient);

      const response = await request(app)
        .post("/api/clients")
        .send({
          name: "Jean Martin",
          email: "jean@example.com",
          phone: "+33612345678",
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Client created successfully");
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/clients")
        .send({ name: "Jean Martin" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/clients - List Clients", () => {
    it("should return list of clients with pagination", async () => {
      const mockClients = [
        { _id: "1", name: "Client 1", email: "client1@example.com" },
        { _id: "2", name: "Client 2", email: "client2@example.com" },
      ];

      jest.spyOn(Client, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(Client, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockClients),
              }),
            }),
          }),
        }),
      });

      const response = await request(app).get("/api/clients");

      expect(response.status).toBe(200);
      expect(response.body.clients).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it("should filter clients by status", async () => {
      jest.spyOn(Client, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Client, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .get("/api/clients")
        .query({ status: "active" });

      expect(response.status).toBe(200);
    });

    it("should search clients by name", async () => {
      jest.spyOn(Client, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(Client, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .get("/api/clients")
        .query({ search: "Jean" });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/clients/:id - Get Client", () => {
    it("should return a specific client", async () => {
      const mockClient = {
        _id: "client123",
        name: "Jean Martin",
        email: "jean@example.com",
        phone: "+33612345678",
      };

      jest.spyOn(Client, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockClient),
          }),
        }),
      });

      const response = await request(app).get("/api/clients/client123");

      expect(response.status).toBe(200);
      expect(response.body.client).toBeDefined();
    });

    it("should return 404 if client not found", async () => {
      jest.spyOn(Client, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const response = await request(app).get("/api/clients/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Client not found");
    });
  });

  describe("PUT /api/clients/:id - Update Client", () => {
    it("should update a client", async () => {
      const mockClient = {
        _id: "client123",
        email: "old@example.com",
        phone: "+33612345678",
        address: {},
        save: jest.fn().mockResolvedValue(true),
        populate: jest
          .fn()
          .mockReturnValue({
            populate: jest.fn().mockResolvedValue({}),
          }),
      };

      jest.spyOn(Client, 'findById').mockResolvedValue(mockClient);
      jest.spyOn(Client, 'findOne').mockResolvedValue(null);

      const response = await request(app)
        .put("/api/clients/client123")
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Client updated successfully");
    });

    it("should return 404 if client not found", async () => {
      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .put("/api/clients/nonexistent")
        .send({ name: "Updated" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/clients/:id - Deactivate Client", () => {
    it("should deactivate a client", async () => {
      const mockClient = {
        _id: "client123",
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Client, 'findById').mockResolvedValue(mockClient);

      const response = await request(app).delete("/api/clients/client123");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Client deactivated successfully");
      expect(mockClient.status).toBe("inactive");
    });

    it("should return 404 if client not found", async () => {
      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      const response = await request(app).delete("/api/clients/nonexistent");

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/clients/:id/permanent - Permanently Delete Client", () => {
    it("should permanently delete a client", async () => {
      jest.spyOn(Client, 'findByIdAndDelete').mockResolvedValue({ _id: "client123" });

      const response = await request(app).delete(
        "/api/clients/client123/permanent"
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Client permanently deleted");
    });

    it("should return 404 if client not found", async () => {
      jest.spyOn(Client, 'findByIdAndDelete').mockResolvedValue(null);

      const response = await request(app).delete(
        "/api/clients/nonexistent/permanent"
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/clients/search/advanced - Advanced Search", () => {
    it("should search with filters", async () => {
      jest.spyOn(Client, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const response = await request(app)
        .get("/api/clients/search/advanced")
        .query({ query: "Jean", minDebt: "0", maxDebt: "5000" });

      expect(response.status).toBe(200);
      expect(response.body.clients).toBeDefined();
    });
  });
});
