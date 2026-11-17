const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');

router.use(protect, authorize('admin'));

router.get('/overview', async (req, res) => {
  try {
    const clinics = await Clinic.countDocuments({ status: 'approved' });
    const patients = await Patient.countDocuments();
    const staff = await User.countDocuments({ role: 'staff', status: 'approved' });
    const subadmins = await User.countDocuments({ role: 'subadmin', status: 'approved' });
    res.json({ clinics, patients, staff, subadmins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/clinics', async (req, res) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: -1 });
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find().select('-pin');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/accounts', async (req, res) => {
  try {
    const accounts = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;