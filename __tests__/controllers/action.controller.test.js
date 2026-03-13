import { jest } from "@jest/globals";
import mongoose from "mongoose";
import Action from "../../src/models/action.model.js";
import Client from "../../src/models/client.model.js";
import Invoice from "../../src/models/invoice.model.js";
import User from "../../src/models/user.model.js";
import * as actionController from "../../src/controllers/action.controller.js";
import db from "../../src/config/db.js";

describe("Action Controller Tests", () => {
  let client;
  let agent;
  let manager;
  let invoice;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    // Create test data
    client = await Client.create({
      nomComplet: "Jean Dupont",
      email: "jean@example.com",
      telephone: "0612345678",
    });

    agent = await User.create({
      nom: "Agent Smith",
      prenom: "John",
      email: "agent@example.com",
      motDePasse: "password123",
      role: "agent",
    });

    manager = await User.create({
      nom: "Manager Doe",
      prenom: "Jane",
      email: "manager@example.com",
      motDePasse: "password123",
      role: "manager",
    });

    invoice = await Invoice.create({
      numero: "INV-001",
      dateEmission: new Date(),
      montant: 1000,
      client: client._id,
    });

    // Setup mock req, res, next
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { _id: agent._id, role: "agent" },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(async () => {
    await Action.deleteMany({});
  });

  describe("createAction", () => {
    test("should create an action successfully", async () => {
      mockReq.body = {
        type: "appel",
        dateAction: new Date(),
        description: "Contact client",
        client: client._id,
        agent: agent._id,
      };

      await actionController.createAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
      const call = mockRes.json.mock.calls[0][0];
      expect(call.type).toBe("appel");
      expect(call.client.toString()).toBe(client._id.toString());
    });

    test("should return 400 if required fields are missing", async () => {
      mockReq.body = {
        type: "appel",
        description: "Contact client",
        // Missing client and agent
      };

      await actionController.createAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should return 404 if client does not exist", async () => {
      mockReq.body = {
        type: "appel",
        dateAction: new Date(),
        description: "Contact client",
        client: new mongoose.Types.ObjectId(),
        agent: agent._id,
      };

      await actionController.createAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("should create action with invoice", async () => {
      mockReq.body = {
        type: "appel",
        dateAction: new Date(),
        description: "Contact for invoice",
        client: client._id,
        agent: agent._id,
        facture: invoice._id,
      };

      await actionController.createAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.facture.toString()).toBe(invoice._id.toString());
    });
  });

  describe("getActions", () => {
    test("should get all actions with pagination", async () => {
      // Create test actions
      for (let i = 0; i < 5; i++) {
        await Action.create({
          type: "appel",
          dateAction: new Date(),
          description: `Action ${i}`,
          client: client._id,
          agent: agent._id,
        });
      }

      mockReq.query = { page: 1, limit: 10 };

      await actionController.getActions(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(5);
      expect(call.totalPages).toBe(1);
    });

    test("should filter actions by type", async () => {
      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Call action",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "email",
        dateAction: new Date(),
        description: "Email action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.query = { type: "appel", page: 1, limit: 10 };

      await actionController.getActions(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(1);
      expect(call.actions[0].type).toBe("appel");
    });

    test("should filter actions by client", async () => {
      const client2 = await Client.create({
        nomComplet: "Marie Martin",
        email: "marie@example.com",
        telephone: "0687654321",
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for client 1",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for client 2",
        client: client2._id,
        agent: agent._id,
      });

      mockReq.query = { client: client._id.toString(), page: 1, limit: 10 };

      await actionController.getActions(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(1);
    });

    test("should handle pagination correctly", async () => {
      for (let i = 0; i < 15; i++) {
        await Action.create({
          type: "appel",
          dateAction: new Date(),
          description: `Action ${i}`,
          client: client._id,
          agent: agent._id,
        });
      }

      mockReq.query = { page: 2, limit: 5 };

      await actionController.getActions(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(5);
      expect(call.totalPages).toBe(3);
    });
  });

  describe("getActionById", () => {
    test("should get action by id", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { id: action._id };

      await actionController.getActionById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call._id.toString()).toBe(action._id.toString());
    });

    test("should return 404 if action not found", async () => {
      mockReq.params = { id: new mongoose.Types.ObjectId() };

      await actionController.getActionById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("should populate relationships", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
        createdBy: agent._id,
      });

      mockReq.params = { id: action._id };

      await actionController.getActionById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.client).toBeDefined();
      expect(call.client.nomComplet).toBe("Jean Dupont");
      expect(call.agent).toBeDefined();
      expect(call.agent.email).toBe("agent@example.com");
    });
  });

  describe("updateAction", () => {
    test("should update action by agent", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.body = { statut: "en cours" };
      mockReq.user = { _id: agent._id, role: "agent" };

      await actionController.updateAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.statut).toBe("en cours");
    });

    test("should prevent agent from updating another agent's action", async () => {
      const otherAgent = await User.create({
        nom: "Other Agent",
        prenom: "Test",
        email: "other@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: otherAgent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.body = { statut: "en cours" };
      mockReq.user = { _id: agent._id, role: "agent" };

      await actionController.updateAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test("should allow manager to update any action", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.body = { statut: "en cours" };
      mockReq.user = { _id: manager._id, role: "manager" };

      await actionController.updateAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should return 404 if action not found", async () => {
      mockReq.params = { id: new mongoose.Types.ObjectId() };
      mockReq.body = { statut: "en cours" };

      await actionController.updateAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("should return 400 if no fields provided for update", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.body = {};
      mockReq.user = { _id: agent._id, role: "agent" };

      await actionController.updateAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should track updatedBy field", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
        createdBy: agent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.body = { statut: "en cours" };
      mockReq.user = { _id: manager._id, role: "manager" };

      await actionController.updateAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.updatedBy.toString()).toBe(manager._id.toString());
    });
  });

  describe("deleteAction", () => {
    test("should delete action by manager", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.user = { _id: manager._id, role: "manager" };

      await actionController.deleteAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      const deletedAction = await Action.findById(action._id);
      expect(deletedAction).toBeNull();
    });

    test("should delete action by admin", async () => {
      const admin = await User.create({
        nom: "Admin",
        prenom: "Test",
        email: "admin@example.com",
        motDePasse: "password123",
        role: "admin",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.user = { _id: admin._id, role: "admin" };

      await actionController.deleteAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should prevent agent from deleting action", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { id: action._id };
      mockReq.user = { _id: agent._id, role: "agent" };

      await actionController.deleteAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test("should return 404 if action not found", async () => {
      mockReq.params = { id: new mongoose.Types.ObjectId() };
      mockReq.user = { _id: manager._id, role: "manager" };

      await actionController.deleteAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getActionsByClient", () => {
    test("should get actions for specific client", async () => {
      const client2 = await Client.create({
        nomComplet: "Marie Martin",
        email: "marie@example.com",
        telephone: "0687654321",
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for client 1",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for client 2",
        client: client2._id,
        agent: agent._id,
      });

      mockReq.params = { clientId: client._id };
      mockReq.query = { page: 1, limit: 10 };

      await actionController.getActionsByClient(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(1);
      expect(call.actions[0].client._id.toString()).toBe(client._id.toString());
    });

    test("should return 404 if client not found", async () => {
      mockReq.params = { clientId: new mongoose.Types.ObjectId() };
      mockReq.query = { page: 1, limit: 10 };

      await actionController.getActionsByClient(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getActionsByInvoice", () => {
    test("should get actions for specific invoice", async () => {
      const invoice2 = await Invoice.create({
        numero: "INV-002",
        dateEmission: new Date(),
        montant: 2000,
        client: client._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for invoice 1",
        client: client._id,
        agent: agent._id,
        facture: invoice._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for invoice 2",
        client: client._id,
        agent: agent._id,
        facture: invoice2._id,
      });

      mockReq.params = { invoiceId: invoice._id };
      mockReq.query = { page: 1, limit: 10 };

      await actionController.getActionsByInvoice(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(1);
    });
  });

  describe("getActionsByAgent", () => {
    test("should get actions for specific agent", async () => {
      const agent2 = await User.create({
        nom: "Agent Two",
        prenom: "Test",
        email: "agent2@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Agent 1 action",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Agent 2 action",
        client: client._id,
        agent: agent2._id,
      });

      mockReq.params = { agentId: agent._id };
      mockReq.query = { page: 1, limit: 10 };

      await actionController.getActionsByAgent(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(1);
      expect(call.actions[0].agent._id.toString()).toBe(agent._id.toString());
    });

    test("should filter by date range", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await Action.create({
        type: "appel",
        dateAction: yesterday,
        description: "Yesterday action",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "appel",
        dateAction: tomorrow,
        description: "Tomorrow action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { agentId: agent._id };
      mockReq.query = {
        from: yesterday,
        to: now,
        page: 1,
        limit: 10,
      };

      await actionController.getActionsByAgent(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(1);
      expect(call.actions[0].description).toBe("Yesterday action");
    });
  });

  describe("getActionsByType", () => {
    test("should get actions by type", async () => {
      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Call action",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "email",
        dateAction: new Date(),
        description: "Email action",
        client: client._id,
        agent: agent._id,
      });

      mockReq.params = { type: "appel" };
      mockReq.query = { page: 1, limit: 10 };

      await actionController.getActionsByType(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      expect(call.actions).toHaveLength(1);
      expect(call.actions[0].type).toBe("appel");
    });

    test("should return 400 for invalid type", async () => {
      mockReq.params = { type: "invalidType" };
      mockReq.query = { page: 1, limit: 10 };

      await actionController.getActionsByType(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      mockReq.body = {
        type: "appel",
        dateAction: new Date(),
        description: "Test",
        client: "invalid-id",
        agent: agent._id,
      };

      await actionController.createAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("should handle validation errors", async () => {
      mockReq.body = {
        type: "invalidType",
        dateAction: new Date(),
        description: "Test",
        client: client._id,
        agent: agent._id,
      };

      await actionController.createAction(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
