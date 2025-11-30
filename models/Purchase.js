const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  supplier: { type: String, required: true },
  date: { type: Date, required: true },
  shippingCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  items: [
    {
      model: String,
      brand: String,
      description: String,
      qty: Number,
      unitPrice: Number,
      totalValue: Number,
      extraCostShareTotal: Number,
      finalUnitCost: Number,
    }
  ],
  totals: {
    merchandise: Number,
    extras: Number,
    grandTotal: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', PurchaseSchema);
