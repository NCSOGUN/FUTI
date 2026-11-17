const mongoose=require('mongoose');
const batchSchema=new mongoose.Schema({
 clinicId:{type:String,required:true,index:true},
 itemId:{type:mongoose.Schema.Types.ObjectId,ref:'InventoryItem',required:true,index:true},
 batchNumber:{type:String,required:true}, quantity:{type:Number,required:true,min:0},
 expiryDate:{type:Date,required:true}, unitCost:{type:Number,default:0,min:0},
 receivedAt:{type:Date,default:Date.now}, supplier:String, status:{type:String,enum:['active','quarantined','expired'],default:'active'}
},{timestamps:true});
batchSchema.index({clinicId:1,itemId:1,expiryDate:1});
module.exports=mongoose.model('InventoryBatch',batchSchema);