const mongoose = require('mongoose');
const refundSchema = new mongoose.Schema({
  chargeId: String, invoice: String, amount: Number,
  patientId: String, patientName: String, clinicId: String,
  reason: String, requestedBy: String, status: { type: String, default: 'pending' }
}, { timestamps: true });
module.exports = mongoose.model('Refund', refundSchema);