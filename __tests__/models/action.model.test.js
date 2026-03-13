import { jest } from "@jest/globals";
import mongoose from "mongoose";
import Action from "../../src/models/action.model.js";
import Client from "../../src/models/client.model.js";
import Invoice from "../../src/models/invoice.model.js";
import User from "../../src/models/user.model.js";
import db from "../../src/config/db.js";

describe("Action Model Tests", () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  afterEach(async () => {
    await Action.deleteMany({});
    await Client.deleteMany({});
    await Invoice.deleteMany({});
    await User.deleteMany({});
  });

  // Test Schema Validation
  describe("Schema Validation", () => {
    test("should create an action with all valid fields", async () => {
      // Create dependent documents
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const invoice = await Invoice.create({
        numero: "INV-001",
        dateEmission: new Date(),
        montant: 1000,
        client: client._id,
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Contact client pour rappel de paiement",
        statut: "complétée",
        resultat: "succès",
        client: client._id,
        facture: invoice._id,
        agent: agent._id,
        montantConvenu: 500,
        createdBy: agent._id,
        updatedBy: agent._id,
      });

      expect(action).toBeDefined();
      expect(action.type).toBe("appel");
      expect(action.statut).toBe("complétée");
      expect(action.description).toBe("Contact client pour rappel de paiement");
    });

    test("should create action with minimum required fields", async () => {
      const client = await Client.create({
        nomComplet: "Test Client",
        email: "test@example.com",
        telephone: "0600000000",
      });

      const agent = await User.create({
        nom: "Agent Test",
        prenom: "Test",
        email: "agent.test@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "email",
        dateAction: new Date(),
        description: "Email envoyé",
        client: client._id,
        agent: agent._id,
      });

      expect(action).toBeDefined();
      expect(action.statut).toBe("complétée"); // Default value
      expect(action.facture).toBeUndefined();
      expect(action.resultat).toBeUndefined();
    });

    test("should validate type enum", async () => {
      const client = await Client.create({
        nomComplet: "Test Client",
        email: "test@example.com",
        telephone: "0600000000",
      });

      const agent = await User.create({
        nom: "Agent Test",
        prenom: "Test",
        email: "agent.test@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      try {
        await Action.create({
          type: "invalidType",
          dateAction: new Date(),
          description: "Test",
          client: client._id,
          agent: agent._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.message).toContain("invalidType");
      }
    });

    test("should validate status enum", async () => {
      const client = await Client.create({
        nomComplet: "Test Client",
        email: "test@example.com",
        telephone: "0600000000",
      });

      const agent = await User.create({
        nom: "Agent Test",
        prenom: "Test",
        email: "agent.test@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      try {
        await Action.create({
          type: "appel",
          dateAction: new Date(),
          description: "Test",
          statut: "invalidStatus",
          client: client._id,
          agent: agent._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.message).toContain("invalidStatus");
      }
    });

    test("should validate result enum", async () => {
      const client = await Client.create({
        nomComplet: "Test Client",
        email: "test@example.com",
        telephone: "0600000000",
      });

      const agent = await User.create({
        nom: "Agent Test",
        prenom: "Test",
        email: "agent.test@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      try {
        await Action.create({
          type: "appel",
          dateAction: new Date(),
          description: "Test",
          resultat: "invalidResult",
          client: client._id,
          agent: agent._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.message).toContain("invalidResult");
      }
    });

    test("should require client reference", async () => {
      const agent = await User.create({
        nom: "Agent Test",
        prenom: "Test",
        email: "agent.test@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      try {
        await Action.create({
          type: "appel",
          dateAction: new Date(),
          description: "Test",
          agent: agent._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.message).toContain("client");
      }
    });

    test("should require agent reference", async () => {
      const client = await Client.create({
        nomComplet: "Test Client",
        email: "test@example.com",
        telephone: "0600000000",
      });

      try {
        await Action.create({
          type: "appel",
          dateAction: new Date(),
          description: "Test",
          client: client._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.message).toContain("agent");
      }
    });

    test("should validate description length (minimum 5 characters)", async () => {
      const client = await Client.create({
        nomComplet: "Test Client",
        email: "test@example.com",
        telephone: "0600000000",
      });

      const agent = await User.create({
        nom: "Agent Test",
        prenom: "Test",
        email: "agent.test@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      try {
        await Action.create({
          type: "appel",
          dateAction: new Date(),
          description: "abc",
          client: client._id,
          agent: agent._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.message).toContain("description");
      }
    });

    test("should set default dateAction to now if not provided", async () => {
      const client = await Client.create({
        nomComplet: "Test Client",
        email: "test@example.com",
        telephone: "0600000000",
      });

      const agent = await User.create({
        nom: "Agent Test",
        prenom: "Test",
        email: "agent.test@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const before = new Date();
      const action = await Action.create({
        type: "appel",
        description: "Test action",
        client: client._id,
        agent: agent._id,
      });
      const after = new Date();

      expect(action.dateAction.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(action.dateAction.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // Test Relationships
  describe("Relationships", () => {
    test("should populate client reference", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Contact client",
        client: client._id,
        agent: agent._id,
      });

      const populatedAction = await Action.findById(action._id).populate(
        "client"
      );

      expect(populatedAction.client).toBeDefined();
      expect(populatedAction.client.nomComplet).toBe("Jean Dupont");
    });

    test("should populate agent reference", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Contact client",
        client: client._id,
        agent: agent._id,
      });

      const populatedAction = await Action.findById(action._id).populate(
        "agent"
      );

      expect(populatedAction.agent).toBeDefined();
      expect(populatedAction.agent.email).toBe("agent@example.com");
    });

    test("should populate invoice reference when provided", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const invoice = await Invoice.create({
        numero: "INV-001",
        dateEmission: new Date(),
        montant: 1000,
        client: client._id,
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Contact for invoice payment",
        client: client._id,
        agent: agent._id,
        facture: invoice._id,
      });

      const populatedAction = await Action.findById(action._id).populate(
        "facture"
      );

      expect(populatedAction.facture).toBeDefined();
      expect(populatedAction.facture.numero).toBe("INV-001");
    });

    test("should populate createdBy and updatedBy audit fields", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Contact client",
        client: client._id,
        agent: agent._id,
        createdBy: agent._id,
        updatedBy: agent._id,
      });

      const populatedAction = await Action.findById(action._id)
        .populate("createdBy")
        .populate("updatedBy");

      expect(populatedAction.createdBy).toBeDefined();
      expect(populatedAction.updatedBy).toBeDefined();
      expect(populatedAction.createdBy.email).toBe("agent@example.com");
      expect(populatedAction.updatedBy.email).toBe("agent@example.com");
    });
  });

  // Test Timestamps
  describe("Timestamps", () => {
    test("should automatically set createdAt and updatedAt", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const before = new Date();
      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Contact client",
        client: client._id,
        agent: agent._id,
      });
      const after = new Date();

      expect(action.createdAt).toBeDefined();
      expect(action.updatedAt).toBeDefined();
      expect(action.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(action.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(action.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
    });

    test("should update updatedAt when document is modified", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Contact client",
        client: client._id,
        agent: agent._id,
      });

      const originalUpdatedAt = action.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      action.statut = "en cours";
      await action.save();

      expect(action.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  // Test Indexes
  describe("Indexes", () => {
    test("should have index on client field", async () => {
      const indexes = Action.collection.getIndexes();
      const hasClientIndex = Object.values(indexes).some((index) =>
        Object.keys(index["key"]).includes("client")
      );
      expect(hasClientIndex).toBe(true);
    });

    test("should have index on agent field", async () => {
      const indexes = Action.collection.getIndexes();
      const hasAgentIndex = Object.values(indexes).some((index) =>
        Object.keys(index["key"]).includes("agent")
      );
      expect(hasAgentIndex).toBe(true);
    });

    test("should have index on type field", async () => {
      const indexes = Action.collection.getIndexes();
      const hasTypeIndex = Object.values(indexes).some((index) =>
        Object.keys(index["key"]).includes("type")
      );
      expect(hasTypeIndex).toBe(true);
    });

    test("should have index on dateAction field", async () => {
      const indexes = Action.collection.getIndexes();
      const hasDateIndex = Object.values(indexes).some((index) =>
        Object.keys(index["key"]).includes("dateAction")
      );
      expect(hasDateIndex).toBe(true);
    });

    test("should have index on createdAt field", async () => {
      const indexes = Action.collection.getIndexes();
      const hasCreatedAtIndex = Object.values(indexes).some((index) =>
        Object.keys(index["key"]).includes("createdAt")
      );
      expect(hasCreatedAtIndex).toBe(true);
    });
  });

  // Test Query Operations
  describe("Query Operations", () => {
    test("should find actions by type", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "First call",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "email",
        dateAction: new Date(),
        description: "First email",
        client: client._id,
        agent: agent._id,
      });

      const calls = await Action.find({ type: "appel" });
      const emails = await Action.find({ type: "email" });

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe("appel");
      expect(emails).toHaveLength(1);
      expect(emails[0].type).toBe("email");
    });

    test("should find actions by client", async () => {
      const client1 = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const client2 = await Client.create({
        nomComplet: "Marie Martin",
        email: "marie@example.com",
        telephone: "0687654321",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for client 1",
        client: client1._id,
        agent: agent._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action for client 2",
        client: client2._id,
        agent: agent._id,
      });

      const client1Actions = await Action.find({ client: client1._id });

      expect(client1Actions).toHaveLength(1);
      expect(client1Actions[0].client.toString()).toBe(client1._id.toString());
    });

    test("should find actions by agent", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent1 = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent1@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const agent2 = await User.create({
        nom: "Agent Doe",
        prenom: "Jane",
        email: "agent2@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Agent 1 action",
        client: client._id,
        agent: agent1._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Agent 2 action",
        client: client._id,
        agent: agent2._id,
      });

      const agent1Actions = await Action.find({ agent: agent1._id });

      expect(agent1Actions).toHaveLength(1);
      expect(agent1Actions[0].agent.toString()).toBe(agent1._id.toString());
    });

    test("should find actions by status", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Completed action",
        statut: "complétée",
        client: client._id,
        agent: agent._id,
      });

      await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "In progress action",
        statut: "en cours",
        client: client._id,
        agent: agent._id,
      });

      const completed = await Action.find({ statut: "complétée" });
      const inProgress = await Action.find({ statut: "en cours" });

      expect(completed).toHaveLength(1);
      expect(inProgress).toHaveLength(1);
    });

    test("should sort actions by date in descending order", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

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

      const sorted = await Action.find().sort({ dateAction: -1 });

      expect(sorted[0].description).toBe("Tomorrow action");
      expect(sorted[1].description).toBe("Yesterday action");
    });
  });

  // Test Edge Cases
  describe("Edge Cases", () => {
    test("should handle optional fields gracefully", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Simple action",
        client: client._id,
        agent: agent._id,
      });

      expect(action.facture).toBeUndefined();
      expect(action.resultat).toBeUndefined();
      expect(action.dateProchainSuivi).toBeUndefined();
      expect(action.montantConvenu).toBeUndefined();
      expect(action.referenceDocument).toBeUndefined();
    });

    test("should handle long description text", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const longDescription =
        "A".repeat(1000) +
        "Cette action concerne un appel téléphonique au client pour un rappel de paiement.";

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: longDescription,
        client: client._id,
        agent: agent._id,
      });

      expect(action.description.length).toBeGreaterThan(1000);
    });

    test("should allow null values for optional date fields", async () => {
      const client = await Client.create({
        nomComplet: "Jean Dupont",
        email: "jean@example.com",
        telephone: "0612345678",
      });

      const agent = await User.create({
        nom: "Agent Smith",
        prenom: "John",
        email: "agent@example.com",
        motDePasse: "password123",
        role: "agent",
      });

      const action = await Action.create({
        type: "appel",
        dateAction: new Date(),
        description: "Action without next contact date",
        client: client._id,
        agent: agent._id,
        dateProchainSuivi: null,
      });

      expect(action.dateProchainSuivi).toBeNull();
    });
  });
});
