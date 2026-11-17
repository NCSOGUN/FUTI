const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
 
const patientSchema = new mongoose.Schema({
  qrid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String,
  dob: String,
  gender: String,
  nin: String,
  pin: { type: String, required: true },
  photo: String,
  balance: { type: Number, default: 0 }
}, { timestamps: true });
 
patientSchema.pre('save', async function () {
  if (!this.isModified('pin')) return;
  this.pin = await bcrypt.hash(this.pin, 10);
});
 
patientSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};
 
module.exports = mongoose.model('Patient', patientSchema);