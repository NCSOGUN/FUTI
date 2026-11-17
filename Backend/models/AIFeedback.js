const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 clinicId:String,userId:String,conversationId:String,feature:{type:String,enum:['chat','inventory'],required:true},
 responseId:String,rating:{type:Number,min:1,max:5}, helpful:{type:Boolean}, reason:String,
 correction:String, reviewed:{type:Boolean,default:false}, reviewer:String, reviewNote:String
},{timestamps:true});
module.exports=mongoose.model('AIFeedback',schema);