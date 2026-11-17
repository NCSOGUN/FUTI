const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
 
// @route   POST /api/patients
// @desc    Register a new patient
// @access  Public
router.post('/', async (req, res) => {
  const { name, phone, email, dob, gender, nin, pin } = req.body;
  try {
    const patientExists = await Patient.findOne({ phone });
    if (patientExists) {
      return res.status(400).json({ message: 'Patient with this phone number already exists' });
    }
 
    // Generate a unique QR ID like HP-XXXX-XXXX
    const qrid = 'HP-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
 
    const patient = await Patient.create({
      qrid, name, phone, email, dob, gender, nin, pin
    });
 
    res.status(201).json({ message: 'Patient registered successfully', qrid: patient.qrid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
module.exports = router;