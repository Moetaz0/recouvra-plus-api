import Invoice from "../models/invoice.model.js";
import Payment from "../models/payment.model.js";

const UNPAID_STATUSES = ["impayée", "partiellement payée", "en retard"];

const getPeriodRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  return {
    $gte: new Date(startDate),
    $lte: new Date(endDate),
  };
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { monthStart, monthEnd };
};

/**
 * @desc Get global financial and recovery statistics
 * @route GET /api/stats
 * @access Private - Manager, Admin
 */
export const getGlobalStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const periodRange = getPeriodRange(startDate, endDate);
    const { monthStart, monthEnd } = getCurrentMonthRange();

    const [
      unpaidAggregation,
      overdueCount,
      totalPaymentsAggregation,
      debtorClientsAggregation,
      monthlyPaymentsAggregation,
      periodPaymentsAggregation,
      periodInvoicesCount,
    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { statut: { $in: UNPAID_STATUSES } } },
        {
          $project: {
            remainingAmount: {
              $max: [{ $subtract: ["$montant", { $ifNull: ["$montantPayé", 0] }] }, 0],
            },
          },
        },
        { $group: { _id: null, totalUnpaid: { $sum: "$remainingAmount" } } },
      ]),
      Invoice.countDocuments({
        statut: { $in: UNPAID_STATUSES },
        dateEcheance: { $lt: new Date() },
      }),
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalPayments: { $sum: "$amount" },
            paymentCount: { $sum: 1 },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { statut: { $in: UNPAID_STATUSES } } },
        {
          $project: {
            client: 1,
            remainingAmount: {
              $max: [{ $subtract: ["$montant", { $ifNull: ["$montantPayé", 0] }] }, 0],
            },
          },
        },
        { $match: { remainingAmount: { $gt: 0 } } },
        { $group: { _id: "$client" } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            paymentDate: {
              $gte: monthStart,
              $lte: monthEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      periodRange
        ? Payment.aggregate([
            {
              $match: {
                paymentDate: periodRange,
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
      periodRange
        ? Invoice.countDocuments({ createdAt: periodRange })
        : Promise.resolve(0),
    ]);

    const totalUnpaid = unpaidAggregation[0]?.totalUnpaid || 0;
    const totalPayments = totalPaymentsAggregation[0]?.totalPayments || 0;
    const totalPaymentCount = totalPaymentsAggregation[0]?.paymentCount || 0;
    const debtorClients = debtorClientsAggregation[0]?.count || 0;
    const paymentsThisMonth = {
      total: monthlyPaymentsAggregation[0]?.total || 0,
      count: monthlyPaymentsAggregation[0]?.count || 0,
      from: monthStart,
      to: monthEnd,
    };

    const stats = {
      totalUnpaid,
      overdueInvoices: overdueCount,
      totalPayments,
      totalPaymentCount,
      debtorClients,
      paymentsThisMonth,
    };

    if (periodRange) {
      stats.period = {
        from: new Date(startDate),
        to: new Date(endDate),
        totalPayments: periodPaymentsAggregation[0]?.total || 0,
        paymentCount: periodPaymentsAggregation[0]?.count || 0,
        invoicesCreated: periodInvoicesCount,
        recoveries: periodPaymentsAggregation[0]?.total || 0,
      };
    }

    return res.status(200).json({
      stats,
      generatedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};
