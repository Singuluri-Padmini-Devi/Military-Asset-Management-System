const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    assetName: { type: String, required: true },
    category: { type: String, required: true },
    base: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    actionType: { type: String, enum: ["assignment", "expenditure"], required: true },
    assignedTo: { type: String, default: "" },
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
