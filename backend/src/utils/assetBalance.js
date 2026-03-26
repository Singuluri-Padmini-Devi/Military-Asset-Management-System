const Asset = require("../models/Asset");

const upsertAssetQuantity = async ({ assetName, category, base, quantityChange }) => {
  const existing = await Asset.findOne({ assetName, base });

  if (!existing) {
    if (quantityChange < 0) {
      throw new Error("Insufficient asset quantity");
    }

    return Asset.create({
      assetName,
      category,
      base,
      quantity: quantityChange,
    });
  }

  const newQty = existing.quantity + quantityChange;
  if (newQty < 0) {
    throw new Error("Insufficient asset quantity");
  }

  existing.quantity = newQty;
  if (category) {
    existing.category = category;
  }
  return existing.save();
};

module.exports = { upsertAssetQuantity };
