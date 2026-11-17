const mongoose = require('mongoose');
 
const auditLogSchema = new mongoose.Schema({
  user: String,
  name: String,
  role: String,
  clinicId: String,
  action: { type: String, required: true },
  detail: String,
  patientId: String
}, { timestamps: true });
 
module.exports = mongoose.model('AuditLog', auditLogSchema);