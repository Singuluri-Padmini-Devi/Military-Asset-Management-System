const express = require("express");
const Transfer = require("../models/Transfer");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const { upsertAssetQuantity } = require("../utils/assetBalance");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const filter =
    req.user.role === "Admin"
      ? {}
      : {
          $or: [{ fromBase: req.user.base }, { toBase: req.user.base }],
        };

  const transfers = await Transfer.find(filter).sort({ createdAt: -1 });
  res.json(transfers);
});

router.post("/", auth, allowRoles("Admin", "Base Commander", "Logistics Officer"), async (req, res) => {
  try {
    const { assetName, category, fromBase, toBase, quantity, note } = req.body;

    const actualFrom = req.user.role === "Admin" ? fromBase : req.user.base;

    if (actualFrom === toBase) {
      return res.status(400).json({ message: "fromBase and toBase must be different" });
    }

    await upsertAssetQuantity({
      assetName,
      category,
      base: actualFrom,
      quantityChange: -Number(quantity),
    });

    await upsertAssetQuantity({
      assetName,
      category,
      base: toBase,
      quantityChange: Number(quantity),
    });

    const transfer = await Transfer.create({
      assetName,
      category,
      fromBase: actualFrom,
      toBase,
      quantity,
      note,
      createdBy: req.user._id,
    });

    res.status(201).json(transfer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
