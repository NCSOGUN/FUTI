const mongoose = require('mongoose');
const complaintSchema = new mongoose.Schema({
  fromType: String, fromName: String, fromId: String,
  clinicId: String, text: String, status: { type: String, default: 'open' }
}, { timestamps: true });
module.exports = mongoose.model('Complaint', complaintSchema);