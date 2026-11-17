const mongoose = require('mongoose');
 
const schema = new mongoose.Schema({
  clinicId: { type: String, required: true, index: true },
  dayKey: { type: String, required: true },
  alertCount: { type: Number, default: 0 },
  lowStock: [{ itemId: String, name: String, stock: Number, reorderLevel: Number, suggestedQty: Number }],
  expiring: [{ itemId: String, name: String, batchNumber: String, quantity: Number, expiryDate: Date }],
  expired: [{ itemId: String, name: String, batchNumber: String, quantity: Number, expiryDate: Date }],
  emailSent: { type: Boolean, default: false },
  emailError: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
 
schema.index({ clinicId:  1, dayKey: 1 }, { unique: true });
module.exports = mongoose.model('InventoryAlertLog', schema);