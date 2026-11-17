# HealthPass AI + Inventory Extension
 
This extension preserves the existing HTML/CSS/vanilla-JS frontend and Express/Mongoose backend.
 
## Added capabilities
- Clinic-scoped inventory catalogue and batch-level stock.
- Expiry-aware FEFO dispensing (first-expiry, first-out).
- Stock movement ledger and deterministic 30-day usage recommendations.
- Optional inventory item linking on staff invoice rows; stock is dispensed only after the patient approves payment.
- Evidence-aware health information assistant backed by a reviewed KnowledgeSource collection.
- Clinic discovery from approved clinic records.
- Feedback collection for human review.
- AI provider configured only on the server.
 
## Install
1. Back up the current project and database.
2. Copy the new/updated Backend files into the existing Backend folder.
3. Copy the new frontend files into the existing Frontend folder.
4. Run `npm install` inside Backend.
5. Copy `.env.example` to `.env`, fill MONGO_URI, JWT_SECRET, AI_API_URL, AI_API_KEY, AI_MODEL and CORS_ORIGIN.
6. Use MongoDB replica set / Atlas because wallet and inventory stock changes require transactions.
7. Run `npm run dev`.
8. Serve Frontend from the configured CORS origin. Do not open pages using `file://`.
 
## Initial setup
- Sign in as an approved staff member to use the inventory page.
- Create inventory catalogue items and record each received batch with expiry date.
- Link medicines to stock using the dropdown in invoice creation.
- Stock is deducted only when the patient approves a linked invoice.
- Create research-library entries using POST `/api/ai/knowledge` as an admin/subadmin. Entries are drafts.
- An authorised reviewer must publish sources through PATCH `/api/ai/knowledge/:id/review` before the chatbot can cite them.
 
## API endpoints
### Inventory (JWT; clinic scoped)
- GET `/api/inventory/items`
- POST `/api/inventory/items` (subadmin/admin)
- POST `/api/inventory/receive`
- POST `/api/inventory/dispense`
- GET `/api/inventory/movements`
- GET `/api/inventory/recommendations`
 
### AI (JWT)
- POST `/api/ai/chat` `{message, conversationId?}`
- GET `/api/ai/clinics?q=&state=&lga=&service=`
- POST `/api/ai/feedback`
- GET `/api/ai/knowledge?q=`
- POST `/api/ai/knowledge` (admin/subadmin; creates draft)
- PATCH `/api/ai/knowledge/:id/review` (admin; publish/review/archive)
 
## Important production requirements
- Do not store AI keys in frontend code, HTML, localStorage or Git.
- Use HTTPS, strict CORS, secure deployment secrets, backups, monitoring and audit review.
- Configure MongoDB as a replica set before using transactions.
- Add rate limits at the reverse proxy/API gateway and monitor provider spend.
- Research content is not scraped from the open web automatically. It must be sourced, reviewed, dated, versioned and periodically revalidated. A live web-search connector can be added later, but raw web pages must never be trusted as clinical authority.
- User feedback is stored for review; it does not retrain the model or automatically alter clinical guidance.
- AI recommendations must never be treated as diagnosis or prescriptions. Escalate emergency symptoms and keep clinical decisions with licensed professionals.
- Get privacy/legal review for the Nigeria Data Protection Act 2023, patient consent/lawful basis, data minimisation, retention, access requests and breach response.
- Existing code still contains demo/mock flows and other unfinished modules. Run a full integration/security test before production deployment.