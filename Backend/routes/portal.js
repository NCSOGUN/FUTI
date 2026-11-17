const express = require('express');
const router = express.Router();
const Clinic = require('../models/Clinic');
const User = require('../models/User');
 
router.get('/clinics', async (req, res) => {
  const clinics = await Clinic.find({ status: 'approved' }).select('id name state lga');
  res.json(clinics);
});
 
router.post('/clinic-register', async (req, res) => {
  const { clinic, admin } = req.body;
  try {
    if (await Clinic.findOne({ id: clinic.id })) return res.status(400).json({ message: 'Clinic ID already registered' });
    
    await Clinic.create({ ...clinic, status: 'pending' });
    await User.create({
      username: admin.username, password: admin.password, role: 'subadmin', 
      name: admin.name, phone: admin.phone, clinicId: clinic.id, status: 'pending'
    });
    res.status(201).json({ message: 'Clinic registration submitted for approval' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
router.post('/staff-register', async (req, res) => {
  const { clinicId, name, title, phone, licence, username, password } = req.body;
  try {
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username taken' });
    if (!(await Clinic.findOne({ id: clinicId, status: 'approved' }))) return res.status(400).json({ message: 'Clinic not approved' });
 
    await User.create({ username, password, role: 'staff', name, title, phone, licence, clinicId, status: 'pending' });
    res.status(201).json({ message: 'Staff registration submitted for approval' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
 
module.exports = router;