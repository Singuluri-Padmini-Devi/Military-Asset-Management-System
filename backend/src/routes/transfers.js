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

router.put("/:id", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    const nextAssetName = req.body.assetName || transfer.assetName;
    const nextCategory = req.body.category || transfer.category;
    const nextFromBase = req.body.fromBase || transfer.fromBase;
    const nextToBase = req.body.toBase || transfer.toBase;
    const nextQuantity = Number(req.body.quantity ?? transfer.quantity);
    const nextNote = req.body.note ?? transfer.note;

    if (nextFromBase === nextToBase) {
      return res.status(400).json({ message: "fromBase and toBase must be different" });
    }

    await upsertAssetQuantity({
      assetName: transfer.assetName,
      category: transfer.category,
      base: transfer.fromBase,
      quantityChange: Number(transfer.quantity),
    });
    await upsertAssetQuantity({
      assetName: transfer.assetName,
      category: transfer.category,
      base: transfer.toBase,
      quantityChange: -Number(transfer.quantity),
    });

    try {
      await upsertAssetQuantity({
        assetName: nextAssetName,
        category: nextCategory,
        base: nextFromBase,
        quantityChange: -nextQuantity,
      });
      await upsertAssetQuantity({
        assetName: nextAssetName,
        category: nextCategory,
        base: nextToBase,
        quantityChange: nextQuantity,
      });
    } catch (error) {
      await upsertAssetQuantity({
        assetName: transfer.assetName,
        category: transfer.category,
        base: transfer.fromBase,
        quantityChange: -Number(transfer.quantity),
      });
      await upsertAssetQuantity({
        assetName: transfer.assetName,
        category: transfer.category,
        base: transfer.toBase,
        quantityChange: Number(transfer.quantity),
      });
      throw error;
    }

    transfer.assetName = nextAssetName;
    transfer.category = nextCategory;
    transfer.fromBase = nextFromBase;
    transfer.toBase = nextToBase;
    transfer.quantity = nextQuantity;
    transfer.note = nextNote;
    await transfer.save();

    return res.json(transfer);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" });
    }

    await upsertAssetQuantity({
      assetName: transfer.assetName,
      category: transfer.category,
      base: transfer.fromBase,
      quantityChange: Number(transfer.quantity),
    });
    await upsertAssetQuantity({
      assetName: transfer.assetName,
      category: transfer.category,
      base: transfer.toBase,
      quantityChange: -Number(transfer.quantity),
    });

    await transfer.deleteOne();
    return res.json({ message: "Transfer deleted" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
