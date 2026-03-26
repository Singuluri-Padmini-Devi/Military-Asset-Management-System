const express = require("express");
const Asset = require("../models/Asset");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const filter = req.user.role === "Admin" ? {} : { base: req.user.base };
  const assets = await Asset.find(filter).sort({ base: 1, assetName: 1 });
  res.json(assets);
});

module.exports = router;
