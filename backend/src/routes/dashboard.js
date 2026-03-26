const express = require("express");
const auth = require("../middleware/auth");
const Asset = require("../models/Asset");
const Purchase = require("../models/Purchase");
const Transfer = require("../models/Transfer");
const Assignment = require("../models/Assignment");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const base = req.query.base;
  const category = req.query.category;

  const assetFilter = {};
  if (req.user.role !== "Admin") {
    assetFilter.base = req.user.base;
  } else if (base) {
    assetFilter.base = base;
  }
  if (category) {
    assetFilter.category = category;
  }

  const assets = await Asset.find(assetFilter).sort({ assetName: 1 });
  const purchaseFilter = req.user.role === "Admin" ? {} : { base: req.user.base };
  const assignmentFilter = req.user.role === "Admin" ? {} : { base: req.user.base };
  const transferFilter =
    req.user.role === "Admin"
      ? {}
      : { $or: [{ fromBase: req.user.base }, { toBase: req.user.base }] };

  const [purchasesCount, transfersCount, assignmentsCount] = await Promise.all([
    Purchase.countDocuments(purchaseFilter),
    Transfer.countDocuments(transferFilter),
    Assignment.countDocuments(assignmentFilter),
  ]);

  res.json({
    totals: {
      assets: assets.length,
      purchases: purchasesCount,
      transfers: transfersCount,
      assignments: assignmentsCount,
    },
    assets,
  });
});

module.exports = router;
