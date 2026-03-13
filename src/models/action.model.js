import mongoose from "mongoose";

const actionSchema = new mongoose.Schema(
  {
    // Type d'action (enum fixe)
    type: {
      type: String,
      enum: ["appel", "email", "lettre", "visite", "procedure", "negociation", "rappel"],
      required: true,
      lowercase: true,
      trim: true,
    },

    // Date et heure de l'action
    dateAction: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Description/Notes de l'action
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },

    // Statut optionnel de l'action
    statut: {
      type: String,
      enum: ["planifiée", "en cours", "complétée", "échouée", "annulée"],
      default: "complétée",
      lowercase: true,
    },

    // Client concerné
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    // Facture concernée (optionnel - peut être lié à plusieurs factures d'un même client)
    facture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    // Agent qui a réalisé l'action
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Résultat de l'action (optionnel)
    resultat: {
      type: String,
      enum: ["succès", "partiel", "échec", "report"],
      default: null,
    },

    // Montant pris ou convenu (optionnel)
    montantConvenu: {
      type: Number,
      min: 0,
      default: null,
    },

    // Date du prochain suivi prévu (optionnel)
    dateProchainSuivi: {
      type: Date,
      default: null,
    },

    // Pièce jointe / référence (optionnel)
    referenceDocument: {
      type: String,
      default: null,
    },

    // Créé par (pour audit)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Modifié par (pour audit)
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index pourrecherche rapide
actionSchema.index({ client: 1 });
actionSchema.index({ facture: 1 });
actionSchema.index({ agent: 1 });
actionSchema.index({ type: 1 });
actionSchema.index({ dateAction: -1 });
actionSchema.index({ createdAt: -1 });

// Index composé pour les recherches les plus courantes
actionSchema.index({ client: 1, dateAction: -1 });
actionSchema.index({ agent: 1, dateAction: -1 });

const Action = mongoose.model("Action", actionSchema);

export default Action;
