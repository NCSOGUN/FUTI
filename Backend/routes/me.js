const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');

router.use(protect);

// Get Profile
router.get('/', async (req, res) => {
  const p = req.patient;
  res.json({ id: p.qrid, name: p.name, phone: p.phone, email: p.email, dob: p.dob, gender: p.gender, photo: p.photo, balance: p.balance, nin: p.nin });
});

// Update Profile (All fields including NIN)
router.patch('/', async (req, res) => {
  const patient = await Patient.findById(req.patient._id);
  const { name, phone, email, dob, gender, photo, nin } = req.body;
  
  if (name) patient.name = name;
  if (phone) patient.phone = phone;
  if (email) patient.email = email;
  if (dob) patient.dob = dob;
  if (gender) patient.gender = gender;
  if (photo) patient.photo = photo;
  if (nin !== undefined) patient.nin = nin; // NIN updated here
  
  await patient.save();
  res.json({ ok: true, message: 'Profile updated' });
});

// Get Real Visits
router.get('/history', async (req, res) => {
  const records = await MedicalRecord.find({ patientId: req.patient.qrid, type: 'Visit' }).sort({ createdAt: -1 });
  res.json(records);
});

// Get Real Vaccinations
router.get('/vaccinations', async (req, res) => {
  const records = await MedicalRecord.find({ patientId: req.patient.qrid, type: 'Vaccination' }).sort({ createdAt: -1 });
  res.json(records);
});

// Paystack Payment Verification
router.post('/verify-payment', async (req, res) => {
  const { reference, amount } = req.body;
  if (!reference) return res.status(400).json({ message: 'No reference provided.' });

  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const paystackData = await paystackRes.json();

    if (paystackData.status && paystackData.data && paystackData.data.status === 'success') {
      const amountPaid = paystackData.data.amount / 100; 
      const patient = await Patient.findById(req.patient._id);
      patient.balance += amountPaid;
      await patient.save();
      res.json({ ok: true, balance: patient.balance, message: 'Wallet funded successfully!' });
    } else {
      res.status(400).json({ message: 'Payment verification failed.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment.' });
  }
});

router.get('/pending-charge', async (req, res) => {
  res.status(404).json({ message: 'No pending charge' });
});

module.exports = router;