import Payment from "../models/payment.model.js";
import Invoice from "../models/invoice.model.js";

/**
 * @desc Create a new payment
 * @route POST /api/payments
 * @access Private - Agent, Manager, Admin
 */
export const createPayment = async (req, res, next) => {
  try {
    const {
      invoiceId,
      amount,
      paymentDate,
      method,
      notes,
      referenceNumber,
    } = req.body;

    // Validation
    if (!invoiceId || !amount || !paymentDate || !method) {
      return res.status(400).json({
        message: "invoiceId, amount, paymentDate, and method are required",
      });
    }

    // Check if invoice exists
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check if amount is not greater than invoice amount
    if (amount > invoice.montant) {
      return res.status(400).json({
        message: "Payment amount cannot exceed invoice amount",
      });
    }

    // Check if reference number already exists (if provided)
    if (referenceNumber) {
      const existingPayment = await Payment.findOne({ referenceNumber });
      if (existingPayment) {
        return res.status(409).json({
          message: "A payment with this reference number already exists",
        });
      }
    }

    const payment = await Payment.create({
      invoiceId,
      amount,
      paymentDate,
      method,
      notes,
      referenceNumber,
      recordedBy: req.user._id,
    });

    await payment.populate("invoiceId", "referenceFacture montant statut");
    await payment.populate("recordedBy", "name email");

    // Update invoice payment status based on total paid
    const totalPaid = await Payment.aggregate([
      { $match: { invoiceId: invoice._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
    let newStatus = "impayée";

    if (paidAmount >= invoice.montant) {
      newStatus = "payée";
    } else if (paidAmount > 0) {
      newStatus = "partiellement payée";
    }

    await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        statut: newStatus,
        montantPayé: paidAmount,
        dateReglement: paidAmount >= invoice.montant ? new Date() : null,
      },
      { new: true }
    );

    return res.status(201).json({
      message: "Payment recorded successfully",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all payments with pagination and filters
 * @route GET /api/payments
 * @access Private - Agent, Manager, Admin
 */
export const getPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      invoiceId,
      method,
      search,
      sortBy = "-paymentDate",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    // Filter by invoice
    if (invoiceId) {
      query.invoiceId = invoiceId;
    }

    // Filter by method
    if (method) {
      query.method = method;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { referenceNumber: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("invoiceId", "referenceFacture montant statut")
      .populate("recordedBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      payments,
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
 * @desc Get a specific payment by ID
 * @route GET /api/payments/:id
 * @access Private - Agent, Manager, Admin
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("invoiceId")
      .populate("recordedBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({ payment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update a payment
 * @route PUT /api/payments/:id
 * @access Private - Agent, Manager, Admin
 */
export const updatePayment = async (req, res, next) => {
  try {
    const {
      amount,
      paymentDate,
      method,
      notes,
      referenceNumber,
    } = req.body;

    let payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const oldAmount = payment.amount;

    // Check if new reference number is unique (if being changed)
    if (referenceNumber && referenceNumber !== payment.referenceNumber) {
      const existingPayment = await Payment.findOne({ referenceNumber });
      if (existingPayment) {
        return res.status(409).json({
          message: "A payment with this reference number already exists",
        });
      }
    }

    // Update fields
    if (amount !== undefined) payment.amount = amount;
    if (paymentDate !== undefined) payment.paymentDate = paymentDate;
    if (method !== undefined) payment.method = method;
    if (notes !== undefined) payment.notes = notes;
    if (referenceNumber !== undefined) payment.referenceNumber = referenceNumber;

    payment.updatedBy = req.user._id;

    await payment.save();

    // Recalculate invoice payment status if amount changed
    if (amount !== undefined && amount !== oldAmount) {
      const invoice = await Invoice.findById(payment.invoiceId);
      const totalPaid = await Payment.aggregate([
        { $match: { invoiceId: invoice._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
      let newStatus = "impayée";

      if (paidAmount >= invoice.montant) {
        newStatus = "payée";
      } else if (paidAmount > 0) {
        newStatus = "partiellement payée";
      }

      await Invoice.findByIdAndUpdate(
        payment.invoiceId,
        {
          statut: newStatus,
          montantPayé: paidAmount,
          dateReglement: paidAmount >= invoice.montant ? new Date() : null,
        },
        { new: true }
      );
    }

    await payment.populate("invoiceId", "referenceFacture montant statut");
    await payment.populate("updatedBy", "name email");

    return res.status(200).json({
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a payment
 * @route DELETE /api/payments/:id
 * @access Private - Agent, Manager, Admin
 */
export const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Recalculate invoice payment status
    const invoice = await Invoice.findById(payment.invoiceId);
    const totalPaid = await Payment.aggregate([
      { $match: { invoiceId: invoice._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
    let newStatus = "impayée";

    if (paidAmount >= invoice.montant) {
      newStatus = "payée";
    } else if (paidAmount > 0) {
      newStatus = "partiellement payée";
    }

    await Invoice.findByIdAndUpdate(
      payment.invoiceId,
      {
        statut: newStatus,
        montantPayé: paidAmount,
        dateReglement: paidAmount >= invoice.montant ? new Date() : null,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Payment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get payments by invoice
 * @route GET /api/payments/invoice/:invoiceId
 * @access Private - Agent, Manager, Admin
 */
export const getPaymentsByInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if invoice exists
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const total = await Payment.countDocuments({ invoiceId });

    const payments = await Payment.find({ invoiceId })
      .populate("invoiceId", "referenceFacture montant statut")
      .populate("recordedBy", "name email")
      .sort("-paymentDate")
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      payments,
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
 * @desc Get payment statistics
 * @route GET /api/payments/stats
 * @access Private - Agent, Manager, Admin
 */
export const getPaymentStats = async (req, res, next) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: "$method",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const overallStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: "$amount" },
          averagePayment: { $avg: "$amount" },
          countPayments: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      byMethod: stats,
      overall: overallStats[0] || { totalPayments: 0, averagePayment: 0, countPayments: 0 },
    });
  } catch (error) {
    next(error);
  }
};
