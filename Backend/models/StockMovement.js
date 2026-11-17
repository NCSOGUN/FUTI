const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 clinicId:{type:String,required:true,index:true}, itemId:{type:mongoose.Schema.Types.ObjectId,ref:'InventoryItem',required:true},
 batchId:{type:mongoose.Schema.Types.ObjectId,ref:'InventoryBatch'}, type:{type:String,enum:['receipt','dispense','adjustment','waste','return'],required:true},
 quantity:{type:Number,required:true}, reference:String, reason:String, actorId:String, actorName:String,
 idempotencyKey:{type:String,index:true}
},{timestamps:true});
schema.index({clinicId:1,itemId:1,createdAt:-1});
module.exports=mongoose.model('StockMovement',schema);