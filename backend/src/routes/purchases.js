const express = require("express");
const Purchase = require("../models/Purchase");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const { upsertAssetQuantity } = require("../utils/assetBalance");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const filter = req.user.role === "Admin" ? {} : { base: req.user.base };
  const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
  res.json(purchases);
});

router.post("/", auth, allowRoles("Admin", "Logistics Officer"), async (req, res) => {
  try {
    const { assetName, category, base, quantity, unitCost, note } = req.body;
    const targetBase = req.user.role === "Admin" ? base : req.user.base;

    const purchase = await Purchase.create({
      assetName,
      category,
      base: targetBase,
      quantity,
      unitCost,
      note,
      createdBy: req.user._id,
    });

    await upsertAssetQuantity({
      assetName,
      category,
      base: targetBase,
      quantityChange: Number(quantity),
    });

    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
