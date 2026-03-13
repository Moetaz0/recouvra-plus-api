import mongoose from "mongoose";

const factureSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    montant: {
      type: Number,
      required: true,
      min: 0,
    },
    dateEcheance: {
      type: Date,
      required: true,
    },
    statut: {
      type: String,
      enum: ["impayée", "payée", "en retard", "partiellement payée", "annulée"],
      default: "impayée",
    },
    dateReglement: {
      type: Date,
    },
    montantPayé: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    referenceFacture: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
factureSchema.index({ referenceFacture: 1, client: 1 });
factureSchema.index({ dateEcheance: 1 });
factureSchema.index({ statut: 1 });

const Invoice = mongoose.model("Invoice", factureSchema);

export default Invoice;
