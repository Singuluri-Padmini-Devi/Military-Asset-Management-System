const express = require("express");
const Assignment = require("../models/Assignment");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const { upsertAssetQuantity } = require("../utils/assetBalance");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const filter = req.user.role === "Admin" ? {} : { base: req.user.base };
  const rows = await Assignment.find(filter).sort({ createdAt: -1 });
  res.json(rows);
});

router.post("/", auth, allowRoles("Admin", "Base Commander", "Logistics Officer"), async (req, res) => {
  try {
    const { assetName, category, base, quantity, actionType, assignedTo, note } = req.body;
    const targetBase = req.user.role === "Admin" ? base : req.user.base;

    await upsertAssetQuantity({
      assetName,
      category,
      base: targetBase,
      quantityChange: -Number(quantity),
    });

    const row = await Assignment.create({
      assetName,
      category,
      base: targetBase,
      quantity,
      actionType,
      assignedTo,
      note,
      createdBy: req.user._id,
    });

    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
