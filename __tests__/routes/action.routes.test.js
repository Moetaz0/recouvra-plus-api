import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import db from "../../src/config/db.js";
import app from "../../src/app.js";
import Action from "../../src/models/action.model.js";
import Client from "../../src/models/client.model.js";
import Invoice from "../../src/models/invoice.model.js";
import User from "../../src/models/user.model.js";
import { generateToken } from "../../src/utils/generateToken.js";

describe("Action Routes Tests", () => {
  let agentToken;
  let managerToken;
  let adminToken;
  let agent;
  let manager;
  let admin;
  let client;
  let invoice;

  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    // Create test users
    agent = await User.create({
      nom: "Agent",
      prenom: "Test",
      email: "agent@example.com",
      motDePasse: "password123",
      role: "agent",
    });

    manager = await User.create({
      nom: "Manager",
      prenom: "Test",
      email: "manager@example.com",
      motDePasse: "password123",
      role: "manager",
    });

    admin = await User.create({
      nom: "Admin",
      prenom: "Test",
      email: "admin@example.com",
      motDePasse: "password123",
      role: "admin",
    });

    // Create test client
    client = await Client.create({
      nomComplet: "Jean Dupont",
      email: "jean@example.com",
      telephone: "0612345678",
    });

    // Create test invoice
    invoice = await Invoice.create({
      numero: "INV-001",
      dateEmission: new Date(),
      montant: 1000,
      client: client._id,
    });

    // Generate tokens
    agentToken = generateToken(agent._id);
    managerToken = generateToken(manager._id);
    adminToken = generateToken(admin._id);
  });

  afterEach(async () => {
    await Action.deleteMany({});
    await User.deleteMany({});
    await Client.deleteMany({});
    await Invoice.deleteMany({});
  });

  describe("POST /api/actions", () => {
    test("should create action with valid data", async () => {
      const res = await request(app)
        .post("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .send({
          type: "appel",
          dateAction: new Date(),
          description: "Contact client for payment",
          client: client._id,
          agent: agent._id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.type).toBe("appel");
      expect(res.body.description).toBe("Contact client for payment");
    });

    test("should require authentication", async () => {
      const res = await request(app)
        .post("/api/actions")
        .send({
          type: "appel",
          dateAction: new Date(),
          description: "Contact client",
          client: client._id,
          agent: agent._id,
        });

      expect(res.statusCode).toBe(401);
    });

    test("should require agent role or higher", async () => {
      // Create a user with non-agent role
      const nonAgent = await User.create({
        nom: "User",
        prenom: "Test",
        email: "user@example.com",
        motDePasse: "password123",
        role: "user",
      });

      const token = generateToken(nonAgent._id);

      const res = await request(app)
        .post("/api/actions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "appel",
          dateAction: new Date(),
          description: "Contact client",
          client: client._id,
          agent: agent._id,
        });

      expect(res.statusCode).toBe(403);
    });

    test("should return 404 if client does not exist", async () => {
      const res = await request(app)
        .post("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .send({
          type: "appel",
          dateAction: new Date(),
          description: "Contact client",
          client: new mongoose.Types.ObjectId(),
          agent: agent._id,
        });

      expect(res.statusCode).toBe(404);
    });

    test("should return 400 for invalid type", async () => {
      const res = await request(app)
        .post("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .send({
          type: "invalidType",
          dateAction: new Date(),
          description: "Contact client",
          client: client._id,
          agent: agent._id,
        });

      expect(res.statusCode).toBe(400);
    });

    test("should create action with optional fields", async () => {
      const res = await request(app)
        .post("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .send({
          type: "appel",
          dateAction: new Date(),
          description: "Contact client with invoice",
          client: client._id,
          agent: agent._id,
          facture: invoice._id,
          resultat: "succès",
          montantConvenu: 500,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.facture).toBeDefined();
      expect(res.body.resultat).toBe("succès");
      expect(res.body.montantConvenu).toBe(500);
    });
  });

  describe("GET /api/actions", () => {
    beforeEach(async () => {
      // Create test actions
      for (let i = 0; i < 5; i++) {
        await Action.create({
          type: i % 2 === 0 ? "appel" : "email",
          dateAction: new Date(),
          description: `Action ${i}`,
          client: client._id,
          agent: agent._id,
        });
      }
    });

    test("should get all actions", async () => {
      const res = await request(app)
        .get("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions).toBeDefined();
      expect(res.body.actions).toHaveLength(5);
      expect(res.body.totalPages).toBe(1);
    });

    test("should handle pagination", async () => {
      const res = await request(app)
        .get("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions).toHaveLength(2);
      expect(res.body.totalPages).toBe(3);
    });

    test("should filter by type", async () => {
      const res = await request(app)
        .get("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ type: "appel", page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions.every((a) => a.type === "appel")).toBe(true);
    });

    test("should filter by client", async () => {
      const res = await request(app)
        .get("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ client: client._id.toString(), page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions.length).toBeGreaterThan(0);
    });

    test("should filter by agent", async () => {
      const res = await request(app)
        .get("/api/actions")
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ agent: agent._id.toString(), page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions.length).toBeGreaterThan(0);
    });

    test("should require authentication", async () => {
      const res = await request(app)
        .get("/api/actions")
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/actions/:id", () => {
    test("should get action by id", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      const res = await request(app)
        .get(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body._id.toString()).toBe(action._id.toString());
      expect(res.body.type).toBe("appel");
    });

    test("should return 404 if action not found", async () => {
      const res = await request(app)
        .get(`/api/actions/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(404);
    });

    test("should populate relationships", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
        facture: invoice._id,
      });

      const res = await request(app)
        .get(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.client).toBeDefined();
      expect(res.body.client.nomComplet).toBe("Jean Dupont");
      expect(res.body.agent).toBeDefined();
      expect(res.body.facture).toBeDefined();
    });
  });

  describe("PUT /api/actions/:id", () => {
    test("should update action", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Original description",
        client: client._id,
        agent: agent._id,
      });

      const res = await request(app)
        .put(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({
          statut: "en cours",
          description: "Updated description",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.statut).toBe("en cours");
      expect(res.body.description).toBe("Updated description");
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
        description: "Other agent action",
        client: client._id,
        agent: otherAgent._id,
      });

      const res = await request(app)
        .put(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ statut: "en cours" });

      expect(res.statusCode).toBe(403);
    });

    test("should allow manager to update any action", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Agent action",
        client: client._id,
        agent: agent._id,
      });

      const res = await request(app)
        .put(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ statut: "en cours" });

      expect(res.statusCode).toBe(200);
    });

    test("should return 404 if action not found", async () => {
      const res = await request(app)
        .put(`/api/actions/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ statut: "en cours" });

      expect(res.statusCode).toBe(404);
    });

    test("should return 400 if no fields provided", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      const res = await request(app)
        .put(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe("DELETE /api/actions/:id", () => {
    test("should delete action as manager", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      const res = await request(app)
        .delete(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);

      const deleted = await Action.findById(action._id);
      expect(deleted).toBeNull();
    });

    test("should delete action as admin", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      const res = await request(app)
        .delete(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    test("should prevent agent from deleting action", async () => {
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });

      const res = await request(app)
        .delete(`/api/actions/${action._id}`)
        .set("Authorization", `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(403);
    });

    test("should return 404 if action not found", async () => {
      const res = await request(app)
        .delete(`/api/actions/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/actions/client/:clientId", () => {
    beforeEach(async () => {
      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for client",
        client: client._id,
        agent: agent._id,
      });
    });

    test("should get actions by client", async () => {
      const res = await request(app)
        .get(`/api/actions/client/${client._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions).toHaveLength(1);
      expect(res.body.actions[0].client._id).toBe(client._id.toString());
    });

    test("should return 404 if client not found", async () => {
      const res = await request(app)
        .get(`/api/actions/client/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/actions/invoice/:invoiceId", () => {
    beforeEach(async () => {
      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for invoice",
        client: client._id,
        agent: agent._id,
        facture: invoice._id,
      });
    });

    test("should get actions by invoice", async () => {
      const res = await request(app)
        .get(`/api/actions/invoice/${invoice._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions).toHaveLength(1);
    });
  });

  describe("GET /api/actions/agent/:agentId", () => {
    beforeEach(async () => {
      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Agent action",
        client: client._id,
        agent: agent._id,
      });
    });

    test("should get actions by agent", async () => {
      const res = await request(app)
        .get(`/api/actions/agent/${agent._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions).toHaveLength(1);
    });

    test("should require manager role", async () => {
      const res = await request(app)
        .get(`/api/actions/agent/${agent._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/actions/type/:type", () => {
    beforeEach(async () => {
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
    });

    test("should get actions by type", async () => {
      const res = await request(app)
        .get(`/api/actions/type/appel`)
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.actions).toHaveLength(1);
      expect(res.body.actions[0].type).toBe("appel");
    });

    test("should return 400 for invalid type", async () => {
      const res = await request(app)
        .get(`/api/actions/type/invalidType`)
        .set("Authorization", `Bearer ${agentToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(400);
    });
  });
});
