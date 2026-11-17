const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Refund = require('../models/Refund');
const Charge = require('../models/Charge');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
 
router.use(protect, authorize('subadmin')); // Only clinic admins
 
router.get('/overview', async (req, res) => {
  const clinic = await Clinic.findOne({ id: req.user.clinicId });
  res.json({ 
    staff: await User.countDocuments({ clinicId: req.user.clinicId, role: 'staff', status: 'approved' }),
    pendingStaff: await User.countDocuments({ clinicId: req.user.clinicId, role: 'staff', status: 'pending' }),
    balance: clinic.walletBalance
    // Add pending refunds and complaints here
  });
});
 
router.post('/withdraw', async (req, res) => {
  const { amount } = req.body;
  const clinic = await Clinic.findOne({ id: req.user.clinicId });
  if (clinic.walletBalance < amount) return res.status(400).json({ message: 'Insufficient clinic wallet balance' });
  
  clinic.walletBalance -= amount;
  await clinic.save();
  // In production, trigger a Paystack/Flutterwave payout API call here
 
  res.json({ ok: true, balance: clinic.walletBalance });
});
 
router.post('/accounts/:username', async (req, res) => {
  const { status } = req.body;
  const user = await User.findOne({ username: req.params.username, clinicId: req.user.clinicId, role: 'staff' });
  if (!user) return res.status(404).json({ message: 'Staff not found in your clinic' });
  
  user.status = status;
  await user.save();
  res.json({ message: `Staff ${status}` });
});
 
module.exports = router;