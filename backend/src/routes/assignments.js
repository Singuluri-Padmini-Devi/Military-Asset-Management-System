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

router.put("/:id", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const row = await Assignment.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const nextAssetName = req.body.assetName || row.assetName;
    const nextCategory = req.body.category || row.category;
    const nextBase = req.body.base || row.base;
    const nextQuantity = Number(req.body.quantity ?? row.quantity);
    const nextActionType = req.body.actionType || row.actionType;
    const nextAssignedTo = req.body.assignedTo ?? row.assignedTo;
    const nextNote = req.body.note ?? row.note;

    await upsertAssetQuantity({
      assetName: row.assetName,
      category: row.category,
      base: row.base,
      quantityChange: Number(row.quantity),
    });

    try {
      await upsertAssetQuantity({
        assetName: nextAssetName,
        category: nextCategory,
        base: nextBase,
        quantityChange: -nextQuantity,
      });
    } catch (error) {
      await upsertAssetQuantity({
        assetName: row.assetName,
        category: row.category,
        base: row.base,
        quantityChange: -Number(row.quantity),
      });
      throw error;
    }

    row.assetName = nextAssetName;
    row.category = nextCategory;
    row.base = nextBase;
    row.quantity = nextQuantity;
    row.actionType = nextActionType;
    row.assignedTo = nextAssignedTo;
    row.note = nextNote;
    await row.save();

    return res.json(row);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", auth, allowRoles("Admin"), async (req, res) => {
  try {
    const row = await Assignment.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await upsertAssetQuantity({
      assetName: row.assetName,
      category: row.category,
      base: row.base,
      quantityChange: Number(row.quantity),
    });

    await row.deleteOne();
    return res.json({ message: "Assignment deleted" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
