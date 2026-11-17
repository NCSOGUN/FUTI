const KnowledgeSource = require('../models/KnowledgeSource');
 
const STOP_WORDS = new Set([
  'the','and','for','with','that','this','from','what','when','where','which',
  'have','does','about','into','your','you','are','can','how','why','who',
  'was','were','will','would','could','should','their','them','there','then'
]);
 
function terms(value) {
  return String(value || '').toLowerCase()
    .normalize('NFKD')
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}
 
function rankDocument(doc, queryTerms) {
  const title = new Set(terms(doc.title));
  const tags = new Set(terms((doc.tags || []).join(' ')));
  const summary = new Set(terms(doc.summary));
  const body = new Set(terms(doc.content));
  let score = 0;
  for (const term of queryTerms) {
    if (title.has(term)) score += 5;
    if (tags.has(term)) score += 4;
    if (summary.has(term)) score += 2;
    if (body.has(term)) score += 1;
  }
  if (doc.sourceType === 'government' || doc.sourceType === 'guideline') score += 2;
  return score;
}
 
async function retrieveReviewedSources(question, limit = 5) {
  const now = new Date();
  const docs = await KnowledgeSource.find({
    status: 'published',
    reviewedAt: { $ne: null },
    $or: [{ reviewDueAt: null }, { reviewDueAt: { $gt: now } }]
  }).select('title url publisher summary content tags reviewedAt reviewDueAt sourceType jurisdiction').limit(500).lean();
 
  const queryTerms = [...new Set(terms(question))];
  return docs.map(doc => ({ ...doc, relevance: rankDocument(doc, queryTerms) }))
    .filter(doc => doc.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
 
module.exports = { retrieveReviewedSources };