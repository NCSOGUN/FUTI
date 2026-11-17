const Item = require('../models/InventoryItem');
const Batch = require('../models/InventoryBatch');
const Movement = require('../models/StockMovement');
 
async function buildClinicDigest(clinicId, now = new Date()) {
  const in30Days = new Date(now.getTime() - 30 * 86400000);
  const in60Days = new Date(now.getTime() + 60 * 86400000);
  const [items, batches, movements] = await Promise.all([
    Item.find({ clinicId, active: true }).lean(),
    Batch.find({ clinicId, status: { $in: ['active', 'expired'] } }).lean(),
    Movement.find({ clinicId, type: 'dispense', createdAt: { $gte: in30Days } }).lean()
  ]);
 
  const lowStock = [];
  const expiring = [];
  const expired = [];
  for (const item of items) {
    const ownBatches = batches.filter(batch => String(batch.itemId) === String(item._id));
    const available = ownBatches
      .filter(batch => batch.status === 'active' && new Date(batch.expiryDate) > now)
      .reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
    const used = movements
      .filter(move => String(move.itemId) === String(item._id))
      .reduce((sum, move) => sum + Math.abs(Number(move.quantity || 0)), 0);
    const dailyUse = used / 30;
    const suggestedQty = Math.max(0, Math.ceil((dailyUse * 30) - available), Number(item.targetStock || 0) - available);
    if (available <= Number(item.reorderLevel || 0) || (dailyUse > 0 && available / dailyUse < 14)) {
      lowStock.push({
        itemId: String(item._id), name: item.name, stock: available,
        reorderLevel: item.reorderLevel, suggestedQty
      });
    }
    for (const batch of ownBatches) {
      if (Number(batch.quantity || 0) <= 0) continue;
      const expiry = new Date(batch.expiryDate);
      const row = {
        itemId: String(item._id), name: item.name,
        batchNumber: batch.batchNumber, quantity: batch.quantity, expiryDate: expiry
      };
      if (expiry <= now || batch.status === 'expired') expired.push(row);
      else if (expiry <= in60Days) expiring.push(row);
    }
  }
  return { clinicId, lowStock, expiring, expired, generatedAt: now };
}
 
module.exports = { buildClinicDigest };