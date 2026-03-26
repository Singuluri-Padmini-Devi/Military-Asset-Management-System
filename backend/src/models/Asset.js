const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetName: { type: String, required: true },
    category: {
      type: String,
      enum: ["Vehicle", "Weapon", "Ammunition", "Equipment"],
      required: true,
    },
    base: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: "units" },
  },
  { timestamps: true }
);

assetSchema.index({ assetName: 1, base: 1 }, { unique: true });

module.exports = mongoose.model("Asset", assetSchema);
