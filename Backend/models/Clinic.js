const mongoose = require('mongoose');
 
const clinicSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  state: { type: String, required: true },
  lga: { type: String, required: true },
  address: { type: String, required: true },
  phone: String,
  licence: String,
  services: [String],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  walletBalance: { type: Number, default: 0 }
}, { timestamps: true });
 
module.exports = mongoose.model('Clinic', clinicSchema);