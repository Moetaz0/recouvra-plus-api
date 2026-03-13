import mongoose from "mongoose";
import Client from "../../src/models/client.model.js";

describe("Client Model", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || "mongodb://localhost/recouvra-plus-test");
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Client.deleteMany({});
  });

  describe("Client Creation", () => {
    it("should create a client with valid data", async () => {
      const clientData = {
        name: "Jean Martin",
        email: "jean@example.com",
        phone: "+33612345678",
        address: {
          street: "123 Rue de la Paix",
          city: "Paris",
          zipCode: "75001",
          country: "France",
        },
        totalDebt: 0,
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client).toBeDefined();
      expect(client.name).toBe("Jean Martin");
      expect(client.email).toBe("jean@example.com");
      expect(client.phone).toBe("+33612345678");
      expect(client.status).toBe("active");
      expect(client.totalDebt).toBe(0);
    });

    it("should require name, email, and phone fields", async () => {
      const invalidData = {
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Client.create(invalidData)).rejects.toThrow();
    });

    it("should enforce unique email", async () => {
      const email = "duplicate@example.com";
      const clientData = {
        name: "Client 1",
        email,
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      await Client.create(clientData);

      const duplicateData = {
        name: "Client 2",
        email,
        phone: "+33687654321",
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Client.create(duplicateData)).rejects.toThrow();
    });

    it("should convert email to lowercase", async () => {
      const clientData = {
        name: "Test Client",
        email: "TEST@EXAMPLE.COM",
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client.email).toBe("test@example.com");
    });

    it("should set default status to active", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client.status).toBe("active");
    });

    it("should trim whitespace from fields", async () => {
      const clientData = {
        name: "  Test Client  ",
        email: "  test@example.com  ",
        phone: "  +33612345678  ",
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client.name).toBe("Test Client");
      expect(client.email).toBe("test@example.com");
      expect(client.phone).toBe("+33612345678");
    });
  });

  describe("Client Validation", () => {
    it("should validate email format", async () => {
      const clientData = {
        name: "Test Client",
        email: "invalid-email",
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Client.create(clientData)).rejects.toThrow();
    });

    it("should validate phone minimum length", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "123",
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Client.create(clientData)).rejects.toThrow();
    });

    it("should validate name minimum length", async () => {
      const clientData = {
        name: "A",
        email: "test@example.com",
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Client.create(clientData)).rejects.toThrow();
    });

    it("should validate status enum values", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        status: "invalid",
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Client.create(clientData)).rejects.toThrow();
    });

    it("should validate totalDebt is non-negative", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        totalDebt: -100,
        createdBy: new mongoose.Types.ObjectId(),
      };

      await expect(Client.create(clientData)).rejects.toThrow();
    });
  });

  describe("Client Timestamps", () => {
    it("should automatically add createdAt timestamp", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client.createdAt).toBeDefined();
      expect(client.createdAt).toBeInstanceOf(Date);
    });

    it("should automatically add updatedAt timestamp", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client.updatedAt).toBeDefined();
      expect(client.updatedAt).toBeInstanceOf(Date);
    });

    it("should update updatedAt when client is modified", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);
      const originalUpdatedAt = client.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      client.name = "Updated Name";
      await client.save();

      expect(client.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("Client Address", () => {
    it("should store complete address information", async () => {
      const address = {
        street: "123 Rue de la Paix",
        city: "Paris",
        zipCode: "75001",
        country: "France",
      };

      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        address,
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client.address).toEqual(address);
    });

    it("should allow partial address updates", async () => {
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        address: {
          street: "123 Rue de la Paix",
          city: "Paris",
        },
        createdBy: new mongoose.Types.ObjectId(),
      };

      const client = await Client.create(clientData);

      expect(client.address.street).toBe("123 Rue de la Paix");
      expect(client.address.city).toBe("Paris");
    });
  });

  describe("Client References", () => {
    it("should reference creator", async () => {
      const userId = new mongoose.Types.ObjectId();
      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        createdBy: userId,
      };

      const client = await Client.create(clientData);

      expect(client.createdBy).toEqual(userId);
    });

    it("should reference updater", async () => {
      const creatorId = new mongoose.Types.ObjectId();
      const updaterId = new mongoose.Types.ObjectId();

      const clientData = {
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        createdBy: creatorId,
        updatedBy: updaterId,
      };

      const client = await Client.create(clientData);

      expect(client.updatedBy).toEqual(updaterId);
    });
  });
});
