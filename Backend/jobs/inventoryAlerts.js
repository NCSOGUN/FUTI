const cron = require('node-cron');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const InventoryAlertLog = require('../models/InventoryAlertLog');
const { buildClinicDigest } = require('../services/inventoryIntelligence');
const { sendMail } = require('../services/mailer');
 
function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIMEZONE || 'Africa/Lagos',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}
 
async function runInventoryAlertSweep() {
  const clinics = await Clinic.find({ status: 'approved' }).select('id name').lean();
  const key = dayKey();
  for (const clinic of clinics) {
    const digest = await buildClinicDigest(clinic.id);
    const count = digest.lowStock.length + digest.expiring.length + digest.expired.length;
    if (!count) continue;
 
    let log;
    try {
      log = await InventoryAlertLog.findOneAndUpdate(
        { clinicId: clinic.id, dayKey: key },
        {
          $setOnInsert: {
            clinicId: clinic.id, dayKey: key, alertCount: count,
            lowStock: digest.lowStock, expiring: digest.expiring, expired: digest.expired
          }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      if (error.code === 11000) continue;
      throw error;
    }
    if (log.emailSent) continue;
 
    const recipients = await User.find({
      clinicId: clinic.id, role: { $in: ['subadmin', 'staff'] },
      status: 'approved', email: { $exists: true, $ne: '' }
    }).distinct('email');
 
    if (!recipients.length) continue;
    const lines = [
      `HealthPass stock alert for ${clinic.name}`,
      `Low stock/reorder items: ${digest.lowStock.length}`,
      `Batches expiring within 60 days: ${digest.expiring.length}`,
      `Expired batches requiring quarantine/reconciliation: ${digest.expired.length}`,
      '',
      ...digest.lowStock.map(x => `LOW STOCK: ${x.name}; current ${x.stock}; suggested review quantity ${x.suggestedQty}`),
      ...digest.expiring.map(x => `EXPIRING: ${x.name}; batch ${x.batchNumber}; qty ${x.quantity}; expiry ${new Date(x.expiryDate).toDateString()}`),
      ...digest.expired.map(x => `EXPIRED: ${x.name}; batch ${x.batchNumber}; qty ${x.quantity}; expiry ${new Date(x.expiryDate).toDateString()}`),
      '',
      'This is an operational alert, not an automatic purchase order. Verify physical stock and supplier lead time.'
    ];
    try {
      const result = await sendMail({
        to: recipients.join(','),
        subject: `HealthPass inventory alert — ${clinic.name}`,
        text: lines.join('\n')
      });
      if (result.sent) {
        log.emailSent = true;
        await log.save();
      }
    } catch (error) {
      log.emailError = String(error.message || 'Email failed').slice(0, 300);
      await log.save();
    }
  }
}
 
function startInventoryAlerts() {
  if (process.env.ENABLE_INVENTORY_ALERTS !== 'true') {
    console.log('Inventory alert scheduler disabled (ENABLE_INVENTORY_ALERTS is not true).');
    return;
  }
  cron.schedule(process.env.INVENTORY_ALERT_CRON || '0 7 * * *', () => {
    runInventoryAlertSweep().catch(error => console.error('Inventory alert sweep failed:', error));
  }, { timezone: process.env.APP_TIMEZONE || 'Africa/Lagos' });
  console.log('Inventory alert scheduler enabled.');
}
 
module.exports = { startInventoryAlerts, runInventoryAlertSweep };