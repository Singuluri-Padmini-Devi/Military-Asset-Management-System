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

router.put("/:id", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const nextAssetName = req.body.assetName || purchase.assetName;
    const nextCategory = req.body.category || purchase.category;
    const nextBase = req.body.base || purchase.base;
    const nextQuantity = Number(req.body.quantity ?? purchase.quantity);
    const nextUnitCost = Number(req.body.unitCost ?? purchase.unitCost);
    const nextNote = req.body.note ?? purchase.note;

    if (
      nextAssetName !== purchase.assetName ||
      nextCategory !== purchase.category ||
      nextBase !== purchase.base
    ) {
      return res.status(400).json({
        message: "Changing assetName/category/base is not supported for purchase updates",
      });
    }

    const delta = nextQuantity - Number(purchase.quantity);
    if (delta !== 0) {
      await upsertAssetQuantity({
        assetName: purchase.assetName,
        category: purchase.category,
        base: purchase.base,
        quantityChange: delta,
      });
    }

    purchase.assetName = nextAssetName;
    purchase.category = nextCategory;
    purchase.base = nextBase;
    purchase.quantity = nextQuantity;
    purchase.unitCost = nextUnitCost;
    purchase.note = nextNote;
    await purchase.save();

    return res.json(purchase);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    await upsertAssetQuantity({
      assetName: purchase.assetName,
      category: purchase.category,
      base: purchase.base,
      quantityChange: -Number(purchase.quantity),
    });

    await purchase.deleteOne();
    return res.json({ message: "Purchase deleted" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
