import Invoice from "../models/invoice.model.js";
import Client from "../models/client.model.js";

/**
 * @desc Create a new invoice
 * @route POST /api/invoices
 * @access Private - Agent, Manager, Admin
 */
export const createInvoice = async (req, res, next) => {
  try {
    const {
      client,
      montant,
      dateEcheance,
      statut,
      description,
      referenceFacture,
      notes,
    } = req.body;

    // Validation
    if (!client || !montant || !dateEcheance) {
      return res.status(400).json({
        message: "Client, montant, and dateEcheance are required",
      });
    }

    // Check if client exists
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Check if reference already exists (if provided)
    if (referenceFacture) {
      const existingInvoice = await Invoice.findOne({ referenceFacture });
      if (existingInvoice) {
        return res.status(409).json({
          message: "An invoice with this reference already exists",
        });
      }
    }

    const invoice = await Invoice.create({
      client,
      montant,
      dateEcheance,
      statut: statut || "impayée",
      description,
      referenceFacture,
      notes,
      createdBy: req.user._id,
    });

    await invoice.populate("client", "name email phone");
    await invoice.populate("createdBy", "name email role");

    // Update client invoices array
    await Client.findByIdAndUpdate(
      client,
      { $push: { invoices: invoice._id } },
      { new: true }
    );

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all invoices with pagination and filters
 * @route GET /api/invoices
 * @access Private - Agent, Manager, Admin
 */
export const getInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      statut,
      client,
      search,
      sortBy = "-createdAt",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    // Filter by status
    if (statut) {
      query.statut = statut;
    }

    // Filter by client
    if (client) {
      query.client = client;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { referenceFacture: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await Invoice.countDocuments(query);

    const invoices = await Invoice.find(query)
      .populate("client", "name email phone")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role")
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      invoices,
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
 * @desc Get a specific invoice by ID
 * @route GET /api/invoices/:id
 * @access Private - Agent, Manager, Admin
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return res.status(200).json({ invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update an invoice
 * @route PUT /api/invoices/:id
 * @access Private - Agent, Manager, Admin
 */
export const updateInvoice = async (req, res, next) => {
  try {
    const {
      montant,
      dateEcheance,
      statut,
      dateReglement,
      montantPayé,
      description,
      notes,
    } = req.body;

    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update fields
    if (montant !== undefined) invoice.montant = montant;
    if (dateEcheance !== undefined) invoice.dateEcheance = dateEcheance;
    if (statut !== undefined) invoice.statut = statut;
    if (dateReglement !== undefined) invoice.dateReglement = dateReglement;
    if (montantPayé !== undefined) invoice.montantPayé = montantPayé;
    if (description !== undefined) invoice.description = description;
    if (notes !== undefined) invoice.notes = notes;

    invoice.updatedBy = req.user._id;

    await invoice.save();

    await invoice.populate("client", "name email phone");
    await invoice.populate("updatedBy", "name email role");

    return res.status(200).json({
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete an invoice
 * @route DELETE /api/invoices/:id
 * @access Private - Agent, Manager, Admin
 */
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Remove invoice from client's invoices array
    await Client.findByIdAndUpdate(
      invoice.client,
      { $pull: { invoices: invoice._id } },
      { new: true }
    );

    return res.status(200).json({
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get invoices by client
 * @route GET /api/invoices/client/:clientId
 * @access Private - Agent, Manager, Admin
 */
export const getInvoicesByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const total = await Invoice.countDocuments({ client: clientId });

    const invoices = await Invoice.find({ client: clientId })
      .populate("client", "name email phone")
      .populate("createdBy", "name email role")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      invoices,
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
