const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
  {
    assetName: { type: String, required: true },
    category: { type: String, required: true },
    fromBase: { type: String, required: true },
    toBase: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["completed"], default: "completed" },
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transfer", transferSchema);
