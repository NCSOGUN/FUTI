const mongoose=require('mongoose');
const chargeSchema=new mongoose.Schema({
 invoice:{type:String,required:true,unique:true},patientId:{type:String,required:true},patientName:String,
 clinicId:{type:String,required:true},clinicName:String,
 items:[{desc:String,qty:{type:Number,min:0},price:{type:Number,min:0},inventoryItemId:{type:mongoose.Schema.Types.ObjectId,ref:'InventoryItem',default:null}}],
 amount:{type:Number,required:true,min:0},status:{type:String,enum:['pending','paid','declined','refunded'],default:'pending'},
 staff:String,staffName:String
},{timestamps:true});
module.exports=mongoose.model('Charge',chargeSchema);