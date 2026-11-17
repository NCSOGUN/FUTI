const mongoose = require('mongoose');
 
const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 5000 },
  sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeSource' }],
  createdAt: { type: Date, default: Date.now }
}, { _id: false });
 
const schema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  actorType: { type: String, enum: ['patient', 'user'], required: true },
  actorId: { type: String, required: true, index: true },
  clinicId: { type: String, default: null, index: true },
  messages: { type: [messageSchema], default: [] },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
}, { timestamps: true });
 
module.exports = mongoose.model('AIConversation', schema);