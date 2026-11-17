const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const Knowledge = require('../models/KnowledgeSource');
const Clinic = require('../models/Clinic');
const { completeChat } = require('../services/aiProvider');
 
router.use(protect);

// 1. AI Chat (RAG)
router.post('/chat', asyncHandler(async (req, res) => {
  const question = String(req.body.message || '').trim();
  if (question.length < 3) return res.status(400).json({ message: 'Question too short.' });

  // Retrieve knowledge from DB (RAG)
  // We do a simple text search for now. In production, use vector embeddings.
  const searchRegex = new RegExp(question.split(' ').join('|'), 'i');
  const sourceRows = await Knowledge.find({
    status: 'published',
    $or: [{ title: searchRegex }, { content: searchRegex }, { tags: searchRegex }]
  }).limit(3);

  const sources = sourceRows.map((s, i) => ({ id: i + 1, title: s.title, url: s.url }));
  
  const context = sourceRows.map((s, i) =>
    `[${i + 1}] ${s.title} | URL: ${s.url}\nContent: ${String(s.content || '').slice(0, 4000)}`
  ).join('\n\n');

  const system = [
    'You are HealthPass, a cautious health assistant.',
    'If the supplied Knowledge Base contains information to answer the question, use it and cite it as [1], [2].',
    'If the Knowledge Base is empty or does not contain the answer, state that you do not have enough information in your reviewed sources, but provide general safe medical advice.',
    'Never diagnose or prescribe.'
  ].join(' ');

  let answer;
  try {
    answer = await completeChat({
      system: `${system}\n\nKnowledge Base:\n${context || 'No matching sources found in database.'}`,
      messages: [{ role: 'user', content: question }],
      temperature: 0.2,
      maxTokens: 800
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
 
  res.json({ answer, sources, disclaimer: 'General information only.' });
}));

// 2. Upload Knowledge Source (From AI Governance Page)
router.post('/knowledge', asyncHandler(async (req, res) => {
  const { title, url, content, summary, publisher, sourceType } = req.body;
  
  if (!title || !url || !content) {
    return res.status(400).json({ message: 'Title, URL and content are required.' });
  }

  // Save as 'published' so the AI can use it immediately
  const source = await Knowledge.create({
    title,
    url,
    content,
    summary: summary || '',
    publisher: publisher || 'Admin Upload',
    sourceType: sourceType || 'guideline',
    status: 'published' 
  });

  res.status(201).json({ message: 'Source published successfully.', source });
}));

// 3. Clinics Endpoint (For patient search)
router.get('/clinics', asyncHandler(async (req, res) => {
  const clinics = await Clinic.find({ status: 'approved' }).lean();
  res.json({ clinics });
}));

module.exports = router;