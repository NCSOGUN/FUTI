const express=require('express');
const router=express.Router();
const mongoose=require('mongoose');
const {protect,authorize}=require('../middleware/auth');
const asyncHandler=require('../middleware/asyncHandler');
const Item=require('../models/InventoryItem');
const Batch=require('../models/InventoryBatch');
const Movement=require('../models/StockMovement');
const Audit=require('../models/AuditLog');

router.use(protect,authorize('staff','subadmin','admin'));
const clinicScope=req=>req.user.role==='admin'?(req.query.clinicId||req.body.clinicId):req.user.clinicId;
function requireClinic(req,res,next){req.clinicScope=clinicScope(req);if(!req.clinicScope)return res.status(400).json({message:'Clinic scope is required'});next();}
router.use(requireClinic);
 
router.get('/items',asyncHandler(async(req,res)=>{
 const items=await Item.find({clinicId:req.clinicScope,active:true}).sort({name:1}).lean();
 const batches=await Batch.aggregate([{$match:{clinicId:req.clinicScope,status:'active',expiryDate:{$gt:new Date()}}},{$group:{_id:'$itemId',stock:{$sum:'$quantity'},earliestExpiry:{$min:'$expiryDate'}}}]);const map=new Map(batches.map(x=>[String(x._id),x]));res.json(items.map(i=>({...i,stock:map.get(String(i._id))?.stock||0,earliestExpiry:map.get(String(i._id))?.earliestExpiry||null})));
}));

router.post('/items',authorize('subadmin','admin'),asyncHandler(async(req,res)=>{
 const {sku,name,reorderLevel=10,targetStock=30}=req.body;
 if(!sku||!name)return res.status(400).json({message:'SKU and item name are required'});
 const item=await Item.create({...req.body,clinicId:req.clinicScope,reorderLevel,targetStock});
 await Audit.create({user:req.user.username,name:req.user.name,role:req.user.role,clinicId:req.clinicScope,action:'Created inventory item',detail:item.name});
 res.status(201).json(item);
}));

router.post('/receive',authorize('staff','subadmin','admin'),asyncHandler(async(req,res)=>{
 const {itemId,batchNumber,quantity,expiryDate,unitCost=0,supplier,idempotencyKey}=req.body;
 if(!itemId||!batchNumber||!Number.isFinite(+quantity)||+quantity<=0||!expiryDate||new Date(expiryDate)<=new Date())return res.status(400).json({message:'Valid item, positive quantity, batch and future expiry date are required'});
 if(idempotencyKey&&await Movement.findOne({idempotencyKey,clinicId:req.clinicScope}))return res.status(200).json({message:'Already processed'});
 const item=await Item.findOne({_id:itemId,clinicId:req.clinicScope,active:true});if(!item)return res.status(404).json({message:'Inventory item not found'});
 const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{
  const [batch]=await Batch.create([{clinicId:req.clinicScope,itemId,batchNumber,quantity:+quantity,expiryDate:new Date(expiryDate),unitCost:+unitCost,supplier}],{session});
  await Movement.create([{clinicId:req.clinicScope,itemId,batchId:batch._id,type:'receipt',quantity:+quantity,reference:batchNumber,actorId:String(req.user._id),actorName:req.user.name,idempotencyKey}],{session});
 });}finally{await session.endSession();}
 res.status(201).json({ok:true,message:'Stock received'});
}));

router.post('/dispense',authorize('staff','subadmin','admin'),asyncHandler(async(req,res)=>{
 const {itemId,quantity,reference,reason='Dispensing',idempotencyKey}=req.body;
 if(!itemId||!Number.isFinite(+quantity)||+quantity<=0)return res.status(400).json({message:'Valid item and positive quantity required'});
 if(idempotencyKey&&await Movement.findOne({idempotencyKey,clinicId:req.clinicScope}))return res.json({message:'Already processed'});
 const item=await Item.findOne({_id:itemId,clinicId:req.clinicScope,active:true});if(!item)return res.status(404).json({message:'Item not found'});
 const session=await mongoose.startSession();let remaining=+quantity;let firstMovement=true;
 try{await session.withTransaction(async()=>{
  const batches=await Batch.find({clinicId:req.clinicScope,itemId,status:'active',expiryDate:{$gt:new Date()},quantity:{$gt:0}}).sort({expiryDate:1,receivedAt:1}).session(session);
  const total=batches.reduce((s,b)=>s+b.quantity,0);if(total<remaining)throw Object.assign(new Error('Insufficient available stock'),{status:409,available:total});
  for(const b of batches){if(!remaining)break;const take=Math.min(b.quantity,remaining);b.quantity-=take;remaining-=take;await b.save({session});
   await Movement.create([{clinicId:req.clinicScope,itemId,batchId:b._id,type:'dispense',quantity:-take,reference,reason,actorId:String(req.user._id),actorName:req.user.name,idempotencyKey:idempotencyKey&&firstMovement?(firstMovement=false,idempotencyKey):undefined}],{session});}
 });}catch(e){if(e.status===409)return res.status(409).json({message:e.message,available:e.available});throw e;}finally{await session.endSession();}
 res.json({ok:true,message:'Stock dispensed using earliest-expiry-first batch allocation'});
}));

router.get('/movements',asyncHandler(async(req,res)=>{
 const rows=await Movement.find({clinicId:req.clinicScope}).populate('itemId','name sku').sort({createdAt:-1}).limit(100).lean();res.json(rows);
}));

router.get('/recommendations',asyncHandler(async(req,res)=>{
 const items=await Item.find({clinicId:req.clinicScope,active:true}).lean();
 const batches=await Batch.find({clinicId:req.clinicScope,status:'active'}).lean();
 const movements=await Movement.find({clinicId:req.clinicScope,type:'dispense',createdAt:{$gte:new Date(Date.now()-30*86400000)}}).lean();
 const result=items.map(item=>{
  const related=batches.filter(b=>String(b.itemId)===String(item._id));
  const stock=related.filter(b=>b.expiryDate>new Date()).reduce((s,b)=>s+b.quantity,0);
  const expiring=related.filter(b=>b.expiryDate>new Date()&&b.expiryDate<=new Date(Date.now()+60*86400000)).reduce((s,b)=>s+b.quantity,0);
  const used=movements.filter(m=>String(m.itemId)===String(item._id)).reduce((s,m)=>s+Math.abs(m.quantity),0);
  const daily=used/30;const daysCover=daily?stock/daily:null;
  let action='healthy',priority='low',suggestedQty=0;
  if(stock<=item.reorderLevel){action='reorder';priority='high';suggestedQty=Math.max(0,item.targetStock-stock);}
  else if(daysCover!==null&&daysCover<14){action='reorder soon';priority='medium';suggestedQty=Math.max(0,Math.ceil(daily*30-stock));}
  if(expiring>0&&action==='healthy'){action='review near-expiry stock';priority='medium';}
  return {itemId:item._id,name:item.name,sku:item.sku,stock,reorderLevel:item.reorderLevel,expiringWithin60Days:expiring,usedLast30Days:used,estimatedDaysOfCover:daysCover===null?null:Math.round(daysCover),action,priority,suggestedQty,method:'30-day consumption heuristic; review before purchasing'};
 }).filter(x=>x.action!=='healthy').sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-({high:0,medium:1,low:2}[b.priority])));
 res.json({generatedAt:new Date(),recommendations:result,notice:'Suggestions are decision support, not automatic purchase orders. Validate demand, seasonality, expiry and supplier lead time.'});
}));

// --- NEW: NON-TRANSACTIONAL ROUTE FOR STAFF ADD ITEM (WORKS ON LOCAL MONGODB) ---
router.post('/', protect, asyncHandler(async (req, res) => {
  const { name, batch, quantity, expiry } = req.body;
  
  if (!name || !batch || !quantity) {
    return res.status(400).json({ message: 'Name, batch, and quantity are required.' });
  }

  try {
    // 1. Create the Item
    const newItem = await Item.create({
      clinicId: req.clinicScope,
      name: name,
      sku: name.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now(),
      reorderLevel: 10,
      targetStock: 100
    });

    // 2. Create the Batch (Stock)
    await Batch.create({
      clinicId: req.clinicScope,
      itemId: newItem._id,
      batchNumber: batch,
      quantity: Number(quantity),
      expiryDate: expiry ? new Date(expiry) : new Date(Date.now() + 365*24*60*60*1000),
      status: 'active'
    });

    // 3. Log the movement
    await Movement.create({
      clinicId: req.clinicScope,
      itemId: newItem._id,
      type: 'receipt',
      quantity: Number(quantity),
      reference: batch,
      actorId: String(req.user._id),
      actorName: req.user.name
    });

    res.status(201).json({ message: 'Item saved successfully!' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}));

module.exports=router;