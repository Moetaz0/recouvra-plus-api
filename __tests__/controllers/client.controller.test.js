import { jest } from '@jest/globals';
import Client from "../../src/models/client.model.js";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  permanentlyDeleteClient,
  searchClients,
} from "../../src/controllers/client.controller.js";

describe("Client Controller", () => {
  let req, res, next;
  const userId = "user123";
  const clientId = "client123";

  beforeEach(() => {
    req = {
      user: { _id: userId },
      params: {},
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("createClient", () => {
    it("should create a client with valid data", async () => {
      const clientData = {
        name: "Jean Martin",
        email: "jean@example.com",
        phone: "+33612345678",
      };

      req.body = clientData;

      const mockClient = {
        ...clientData,
        _id: clientId,
        createdBy: userId,
        populate: jest
          .fn()
          .mockResolvedValue({
            ...clientData,
            _id: clientId,
            createdBy: { _id: userId, name: "User", email: "user@example.com", role: "admin" },
          }),
      };

      jest.spyOn(Client, 'findOne').mockResolvedValue(null);
      jest.spyOn(Client, 'create').mockResolvedValue(mockClient);

      await createClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Client created successfully" })
      );
    });

    it("should return validation error if required fields are missing", async () => {
      req.body = { name: "Jean Martin" };

      await createClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return error if email already exists", async () => {
      req.body = {
        name: "Jean Martin",
        email: "jean@example.com",
        phone: "+33612345678",
      };

      jest.spyOn(Client, 'findOne').mockResolvedValue({ _id: clientId });

      await createClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should handle errors", async () => {
      req.body = {
        name: "Jean Martin",
        email: "jean@example.com",
        phone: "+33612345678",
      };

      const error = new Error("Database error");
      jest.spyOn(Client, 'findOne').mockRejectedValue(error);

      await createClient(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getClients", () => {
    it("should get all clients with pagination", async () => {
      req.query = { page: 1, limit: 10 };

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

      await getClients(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ clients: mockClients })
      );
    });

    it("should filter clients by status", async () => {
      req.query = { status: "active", page: 1, limit: 10 };

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

      await getClients(req, res, next);

      const findCall = Client.find.mock.calls[0][0];
      expect(findCall.status).toBe("active");
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      jest.spyOn(Client, 'countDocuments').mockRejectedValue(error);

      await getClients(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getClientById", () => {
    it("should get a client by ID", async () => {
      req.params.id = clientId;

      const mockClient = {
        _id: clientId,
        name: "Jean Martin",
        email: "jean@example.com",
      };

      jest.spyOn(Client, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockClient),
          }),
        }),
      });

      await getClientById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ client: mockClient });
    });

    it("should return 404 if client not found", async () => {
      req.params.id = "nonexistent";

      jest.spyOn(Client, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await getClientById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle errors", async () => {
      req.params.id = clientId;
      const error = new Error("Database error");

      jest.spyOn(Client, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(error),
          }),
        }),
      });

      await getClientById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("updateClient", () => {
    it("should update a client", async () => {
      req.params.id = clientId;
      req.body = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const mockClient = {
        _id: clientId,
        name: "Old Name",
        email: "old@example.com",
        phone: "+33612345678",
        address: {},
        save: jest.fn().mockResolvedValue(true),
        populate: jest
          .fn()
          .mockReturnValue({
            populate: jest.fn().mockResolvedValue({
              _id: clientId,
              name: "Updated Name",
            }),
          }),
      };

      jest.spyOn(Client, 'findById').mockResolvedValue(mockClient);
      jest.spyOn(Client, 'findOne').mockResolvedValue(null);

      await updateClient(req, res, next);

      expect(mockClient.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if client not found", async () => {
      req.params.id = "nonexistent";
      req.body = { name: "Updated Name" };

      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      await updateClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle errors", async () => {
      req.params.id = clientId;
      req.body = { name: "Updated Name" };
      const error = new Error("Database error");

      jest.spyOn(Client, 'findById').mockRejectedValue(error);

      await updateClient(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteClient", () => {
    it("should deactivate a client", async () => {
      req.params.id = clientId;

      const mockClient = {
        _id: clientId,
        status: "active",
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Client, 'findById').mockResolvedValue(mockClient);

      await deleteClient(req, res, next);

      expect(mockClient.status).toBe("inactive");
      expect(mockClient.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if client not found", async () => {
      req.params.id = "nonexistent";

      jest.spyOn(Client, 'findById').mockResolvedValue(null);

      await deleteClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle errors", async () => {
      req.params.id = clientId;
      const error = new Error("Database error");

      jest.spyOn(Client, 'findById').mockRejectedValue(error);

      await deleteClient(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("permanentlyDeleteClient", () => {
    it("should permanently delete a client", async () => {
      req.params.id = clientId;

      jest.spyOn(Client, 'findByIdAndDelete').mockResolvedValue({ _id: clientId });

      await permanentlyDeleteClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if client not found", async () => {
      req.params.id = "nonexistent";

      jest.spyOn(Client, 'findByIdAndDelete').mockResolvedValue(null);

      await permanentlyDeleteClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle errors", async () => {
      req.params.id = clientId;
      const error = new Error("Database error");

      jest.spyOn(Client, 'findByIdAndDelete').mockRejectedValue(error);

      await permanentlyDeleteClient(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("searchClients", () => {
    it("should search clients with query", async () => {
      req.query = { query: "Jean" };

      jest.spyOn(Client, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await searchClients(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should search with debt range filter", async () => {
      req.query = { minDebt: "100", maxDebt: "5000" };

      jest.spyOn(Client, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await searchClients(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      jest.spyOn(Client, 'find').mockImplementation(() => {
        throw error;
      });

      await searchClients(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
