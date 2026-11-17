const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 title:{type:String,required:true},url:{type:String,required:true},publisher:String,
 sourceType:{type:String,enum:['guideline','government','journal','formulary','other'],default:'other'},
 jurisdiction:{type:String,default:'Nigeria'}, summary:String, content:{type:String,required:true},
 tags:[String], status:{type:String,enum:['draft','reviewed','published','archived'],default:'draft'},
 reviewedBy:String, reviewedAt:Date, reviewDueAt:Date, reviewNote:String, version:{type:Number,default:1}
},{timestamps:true});
schema.index({status:1,sourceType:1,tags:1});
module.exports=mongoose.model('KnowledgeSource',schema);