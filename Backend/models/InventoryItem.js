const mongoose = require('mongoose');
const inventoryItemSchema = new mongoose.Schema({
  clinicId:{type:String,required:true,index:true},
  sku:{type:String,required:true,trim:true},
  name:{type:String,required:true,trim:true},
  genericName:String, brand:String, category:{type:String,default:'medicine'},
  strength:String, dosageForm:String, unit:{type:String,default:'unit'},
  reorderLevel:{type:Number,default:10,min:0},
  targetStock:{type:Number,default:30,min:0},
  preferredSupplier:String, supplierContact:String,
  requiresPrescription:{type:Boolean,default:false},
  active:{type:Boolean,default:true}
},{timestamps:true});
inventoryItemSchema.index({clinicId:1,sku:1},{unique:true});
module.exports=mongoose.model('InventoryItem',inventoryItemSchema);