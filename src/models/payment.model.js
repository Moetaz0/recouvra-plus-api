import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "check", "credit_card", "online", "other"],
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    referenceNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for search optimization
paymentSchema.index({ invoiceId: 1, paymentDate: -1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ referenceNumber: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
