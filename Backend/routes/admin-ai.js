const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const Knowledge = require('../models/KnowledgeSource');
const Feedback = require('../models/AIFeedback');
const InventoryAlertLog = require('../models/InventoryAlertLog');
const Audit = require('../models/AuditLog');
 
router.use(protect, authorize('admin'));
 
router.get('/knowledge', asyncHandler(async (req, res) => {
  const status = ['draft', 'reviewed', 'published', 'archived'].includes(req.query.status)
    ? req.query.status : 'draft';
  const rows = await Knowledge.find({ status }).sort({ createdAt: -1 }).limit(100)
    .select('-content').lean();
  res.json(rows);
}));
 
router.patch('/knowledge/:id/review', asyncHandler(async (req, res) => {
  const { status, reviewNote, reviewDueAt } = req.body;
  if (!['reviewed', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Status must be reviewed, published or archived.' });
  }
  if (status === 'published' && !String(reviewNote || '').trim()) {
    return res.status(400).json({ message: 'A review note is required before publication.' });
  }
  const update = {
    status,
    reviewedBy: req.user.username,
    reviewedAt: new Date(),
    reviewNote: String(reviewNote || '').slice(0, 1000),
    reviewDueAt: reviewDueAt ? new Date(reviewDueAt) : null
  };
  const source = await Knowledge.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!source) return res.status(404).json({ message: 'Research source not found.' });
  await Audit.create({
    user: req.user.username, name: req.user.name, role: req.user.role,
    action: `AI research source ${status}`, detail: source.title
  });
  res.json({ ok: true, source });
}));
 
router.get('/feedback', asyncHandler(async (req, res) => {
  const rows = await Feedback.find({ reviewed: false }).sort({ createdAt: -1 }).limit(100).lean();
  res.json(rows);
}));
 
router.patch('/feedback/:id/review', asyncHandler(async (req, res) => {
  const { reviewNote } = req.body;
  const row = await Feedback.findByIdAndUpdate(req.params.id, {
    reviewed: true, reviewer: req.user.username,
    reviewNote: String(reviewNote || '').slice(0, 1000)
  }, { new: true });
  if (!row) return res.status(404).json({ message: 'Feedback record not found.' });
  await Audit.create({
    user: req.user.username, name: req.user.name, role: req.user.role,
    action: 'Reviewed AI feedback', detail: String(row._id)
  });
  res.json({ ok: true });
}));
 
router.get('/inventory-alerts', asyncHandler(async (req, res) => {
  const rows = await InventoryAlertLog.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json(rows);
}));
 
module.exports = router;