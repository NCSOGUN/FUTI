const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const User = require('../models/User');
const sendEmail = require('../services/mailer');

const generateToken = (id, type) => jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Patient Registration (NEW)
router.post('/register', async (req, res) => {
  const { name, phone, email, dob, gender, pin } = req.body;
  
  try {
    // Check if patient already exists
    const existing = await Patient.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone number already registered.' });

    // Generate a random HealthPass ID (e.g., HP-1234-5678)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const qrid = `HP-0234-${randomNum}`;

    // Create patient
    const patient = await Patient.create({ qrid, name, phone, email, dob, gender, pin });

    // Send Welcome Email
    try {
      await sendEmail({
        email: email,
        subject: 'Welcome to HealthPass',
        message: `Hello ${name},\n\nYour HealthPass account has been created.\nYour HealthPass ID is: ${qrid}\nKeep your PIN safe.\n\nThank you.`
      });
    } catch (err) {
      console.log('Email could not be sent:', err.message);
    }

    res.status(201).json({ 
      token: generateToken(patient._id, 'patient'),
      message: 'Account created successfully' 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patient Login
router.post('/login', async (req, res) => {
  const { id, pin } = req.body;
  try {
    const patient = await Patient.findOne({ $or: [{ qrid: id }, { phone: id }] });
    if (patient && (await patient.matchPin(pin))) {
      res.json({ token: generateToken(patient._id, 'patient') });
    } else {
      res.status(401).json({ message: 'Wrong HealthPass ID/phone or PIN' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Staff/Admin Login
router.post('/portal/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      if (user.status !== 'approved' && user.role !== 'admin') {
         return res.status(401).json({ message: `Your account is ${user.status}. Contact admin.` });
      }
      res.json({ token: generateToken(user._id, 'staff') });
    } else {
      res.status(401).json({ message: 'Wrong username or password' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;