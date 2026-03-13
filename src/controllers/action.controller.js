import Action from "../models/action.model.js";
import Client from "../models/client.model.js";

/**
 * Create an action (activity log entry)
 */
export const createAction = async (req, res, next) => {
  try {
    const { type, dateAction, description, statut, client, facture, resultat, montantConvenu, dateProchainSuivi, referenceDocument } = req.body;

    // Validate required fields
    if (!type || !description || !client) {
      return res.status(400).json({
        message: "Type, description, and client are required",
      });
    }

    // Verify client exists
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Create action
    const action = await Action.create({
      type,
      dateAction: dateAction || new Date(),
      description,
      statut: statut || "complétée",
      client,
      facture: facture || null,
      agent: req.user._id,
      resultat: resultat || null,
      montantConvenu: montantConvenu || null,
      dateProchainSuivi: dateProchainSuivi || null,
      referenceDocument: referenceDocument || null,
      createdBy: req.user._id,
    });

    // Populate references
    const populatedAction = await action.populate([
      { path: "client", select: "name email" },
      { path: "facture", select: "referenceFacture montant" },
      { path: "agent", select: "name email" },
    ]);

    return res.status(201).json({
      message: "Action created successfully",
      action: populatedAction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all actions with pagination and filters
 */
export const getActions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, client, agent, statut, from, to, sortBy = "dateAction", order = "desc" } = req.query;

    // Build filter
    const filter = {};
    if (type) filter.type = type.toLowerCase();
    if (client) filter.client = client;
    if (agent) filter.agent = agent;
    if (statut) filter.statut = statut.toLowerCase();

    // Date range filter
    if (from || to) {
      filter.dateAction = {};
      if (from) filter.dateAction.$gte = new Date(from);
      if (to) filter.dateAction.$lte = new Date(to);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Action.countDocuments(filter);

    // Get actions
    const actions = await Action.find(filter)
      .populate([
        { path: "client", select: "name email" },
        { path: "facture", select: "referenceFacture montant statut" },
        { path: "agent", select: "name email role" },
        { path: "createdBy", select: "name email" },
      ])
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      actions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get action by ID
 */
export const getActionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const action = await Action.findById(id)
      .populate([
        { path: "client", select: "name email phone" },
        { path: "facture", select: "referenceFacture montant statut dateEcheance" },
        { path: "agent", select: "name email role" },
        { path: "createdBy", select: "name email" },
        { path: "updatedBy", select: "name email" },
      ]);

    if (!action) {
      return res.status(404).json({ message: "Action not found" });
    }

    return res.status(200).json({ action });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an action
 */
export const updateAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, statut, resultat, montantConvenu, dateProchainSuivi, referenceDocument } = req.body;

    const action = await Action.findById(id);

    if (!action) {
      return res.status(404).json({ message: "Action not found" });
    }

    // Check authorization - agent can only modify their own actions
    if (req.user.role === "agent" && action.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only modify your own actions" });
    }

    // Update fields
    if (description) action.description = description;
    if (statut) action.statut = statut.toLowerCase();
    if (resultat) action.resultat = resultat;
    if (montantConvenu !== undefined) action.montantConvenu = montantConvenu;
    if (dateProchainSuivi) action.dateProchainSuivi = dateProchainSuivi;
    if (referenceDocument) action.referenceDocument = referenceDocument;

    action.updatedBy = req.user._id;

    await action.save();

    // Populate references
    const updatedAction = await action.populate([
      { path: "client", select: "name email" },
      { path: "facture", select: "referenceFacture montant" },
      { path: "agent", select: "name email" },
    ]);

    return res.status(200).json({
      message: "Action updated successfully",
      action: updatedAction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an action (manager/admin only)
 */
export const deleteAction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const action = await Action.findById(id);

    if (!action) {
      return res.status(404).json({ message: "Action not found" });
    }

    await action.deleteOne();

    return res.status(200).json({
      message: "Action deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get actions for a specific client
 */
export const getActionsByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10, sortBy = "dateAction", order = "desc" } = req.query;

    // Verify client exists
    const clientExists = await Client.findById(clientId);
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Action.countDocuments({ client: clientId });

    // Get actions
    const actions = await Action.find({ client: clientId })
      .populate([
        { path: "agent", select: "name email" },
        { path: "facture", select: "referenceFacture montant" },
      ])
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      clientId,
      actions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get actions for a specific invoice
 */
export const getActionsByInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { page = 1, limit = 10, sortBy = "dateAction", order = "desc" } = req.query;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Action.countDocuments({ facture: invoiceId });

    // Get actions
    const actions = await Action.find({ facture: invoiceId })
      .populate([
        { path: "client", select: "name email" },
        { path: "agent", select: "name email" },
      ])
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      invoiceId,
      actions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get actions by agent
 */
export const getActionsByAgent = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { page = 1, limit = 10, from, to, sortBy = "dateAction", order = "desc" } = req.query;

    // Build filter
    const filter = { agent: agentId };

    // Date range filter
    if (from || to) {
      filter.dateAction = {};
      if (from) filter.dateAction.$gte = new Date(from);
      if (to) filter.dateAction.$lte = new Date(to);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Action.countDocuments(filter);

    // Get actions
    const actions = await Action.find(filter)
      .populate([
        { path: "client", select: "name email" },
        { path: "facture", select: "referenceFacture montant" },
      ])
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      agentId,
      actions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get actions by type
 */
export const getActionsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, sortBy = "dateAction", order = "desc" } = req.query;

    // Validate type
    const validTypes = ["appel", "email", "lettre", "visite", "procedure", "negociation", "rappel"];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Action.countDocuments({ type: type.toLowerCase() });

    // Get actions
    const actions = await Action.find({ type: type.toLowerCase() })
      .populate([
        { path: "client", select: "name email" },
        { path: "agent", select: "name email" },
      ])
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      type: type.toLowerCase(),
      actions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};
