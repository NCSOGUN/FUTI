const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const AuditLog = require('../models/AuditLog');

// GET Patient by QR ID (For the scanner)
router.get('/patient/:id', protect, async (req, res) => {
  try {
    // Search for the patient by their HealthPass ID
    const patient = await Patient.findOne({ qrid: req.params.id }).select('-pin');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Optional: Log that a staff member scanned this patient
    if (req.user) {
      await AuditLog.create({
        user: req.user.username,
        name: req.user.name,
        role: req.user.role,
        clinicId: req.user.clinicId,
        action: 'Scanned Patient QR',
        detail: `Scanned ${patient.name} (${patient.qrid})`
      });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET Clinic Overview (for Staff Dashboard)
router.get('/clinic-overview', protect, async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ id: req.user.clinicId });
    if (!clinic) return res.status(404).json({ message: 'Clinic not found' });

    res.json({
      clinicName: clinic.name,
      address: clinic.address,
      balance: clinic.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;