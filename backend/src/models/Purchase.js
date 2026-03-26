const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    assetName: { type: String, required: true },
    category: { type: String, required: true },
    base: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, min: 0, default: 0 },
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
