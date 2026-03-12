import Client from "../models/client.model.js";
import User from "../models/user.model.js";

/**
 * @desc Create a new client
 * @route POST /api/clients
 * @access Private - Agent, Manager, Admin
 */
export const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, address, notes, totalDebt } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({ message: "Name, email, and phone are required" });
    }

    // Check if client with email already exists
    const existingClient = await Client.findOne({ email: email.toLowerCase() });
    if (existingClient) {
      return res
        .status(409)
        .json({ message: "A client with this email already exists" });
    }

    // Check if client with phone already exists
    const existingPhone = await Client.findOne({ phone });
    if (existingPhone) {
      return res
        .status(409)
        .json({ message: "A client with this phone number already exists" });
    }

    const client = await Client.create({
      name,
      email: email.toLowerCase(),
      phone,
      address: address || {},
      notes,
      totalDebt: totalDebt || 0,
      createdBy: req.user._id,
    });

   
    await client.populate("createdBy", "name email role");

    return res.status(201).json({
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all clients with pagination and filters
 * @route GET /api/clients
 * @access Private - Agent, Manager, Admin
 */
export const getClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, sortBy = "-createdAt" } =
      req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    // Filter by status
    if (status && ["active", "inactive"].includes(status)) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await Client.countDocuments(query);

    const clients = await Client.find(query)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get a specific client by ID
 * @route GET /api/clients/:id
 * @access Private - Agent, Manager, Admin
 */
export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .populate("invoices");

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update a client
 * @route PUT /api/clients/:id
 * @access Private - Agent, Manager, Admin
 */
export const updateClient = async (req, res, next) => {
  try {
    const { name, email, phone, address, notes, totalDebt, status } = req.body;

    let client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Check if new email is unique (if being changed)
    if (email && email.toLowerCase() !== client.email) {
      const existingClient = await Client.findOne({
        email: email.toLowerCase(),
      });
      if (existingClient) {
        return res
          .status(409)
          .json({ message: "A client with this email already exists" });
      }
      client.email = email.toLowerCase();
    }

    // Check if new phone is unique (if being changed)
    if (phone && phone !== client.phone) {
      const existingPhone = await Client.findOne({ phone });
      if (existingPhone) {
        return res
          .status(409)
          .json({ message: "A client with this phone number already exists" });
      }
      client.phone = phone;
    }

    // Update fields
    if (name) client.name = name;
    if (notes !== undefined) client.notes = notes;
    if (totalDebt !== undefined) client.totalDebt = totalDebt;
    if (status && ["active", "inactive"].includes(status)) {
      client.status = status;
    }
    if (address) {
      client.address = { ...client.address, ...address };
    }

    // Track who updated the client
    client.updatedBy = req.user._id;

    await client.save();

    // Populate the updated fields
    await client.populate("createdBy", "name email role");
    await client.populate("updatedBy", "name email role");

    return res.status(200).json({
      message: "Client updated successfully",
      client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Soft delete (deactivate) a client
 * @route DELETE /api/clients/:id
 * @access Private - Manager, Admin
 */
export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Soft delete - deactivate instead of removing
    client.status = "inactive";
    client.updatedBy = req.user._id;
    await client.save();

    return res.status(200).json({
      message: "Client deactivated successfully",
      client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Hard delete a client (permanently remove)
 * @route DELETE /api/clients/:id/permanent
 * @access Private - Admin only
 */
export const permanentlyDeleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({
      message: "Client permanently deleted",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Search clients with advanced filters
 * @route GET /api/clients/search/advanced
 * @access Private - Agent, Manager, Admin
 */
export const searchClients = async (req, res, next) => {
  try {
    const { query, status, minDebt, maxDebt, sortBy = "-createdAt" } = req.query;

    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (minDebt !== undefined) {
      filter.totalDebt = { $gte: parseFloat(minDebt) };
    }

    if (maxDebt !== undefined) {
      filter.totalDebt = {
        ...filter.totalDebt,
        $lte: parseFloat(maxDebt),
      };
    }

    // Search in text fields if query provided
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ];
    }

    const clients = await Client.find(filter)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort(sortBy);

    return res.status(200).json({
      total: clients.length,
      clients,
    });
  } catch (error) {
    next(error);
  }
};
