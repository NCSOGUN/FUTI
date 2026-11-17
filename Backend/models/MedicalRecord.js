const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // e.g., HP-0234-8891
  type: { type: String, enum: ['Visit', 'Vaccination', 'Antenatal'], required: true },
  title: { type: String, required: true },
  clinic: { type: String, required: true },
  date: { type: String, required: true },
  detail: { type: String },
  status: { type: String, enum: ['done', 'due', 'overdue'], default: 'done' },
  amount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);