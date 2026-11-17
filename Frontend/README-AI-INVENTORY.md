# HealthPass AI + Inventory Frontend
 
The extension adds two standalone staff pages, using the existing stylesheet and the current JWT (`hp_token`).
 
- `staff/inventory.html`: stock catalogue, batch receipts, stock summary and reorder/expiry recommendations.
- `staff/ai-consultant.html`: evidence-aware general health information chat and approved-clinic search.
- `assets/js/inventory.js` and `assets/js/ai-consultant.js`: plain vanilla JavaScript.
- `staff/workspace.html`: adds links to the two new pages.
- `assets/js/staff.js`: invoice rows can optionally link to an inventory catalogue item. Stock is deducted by the server only after patient approval.
 
Serve the frontend over HTTP(S), not `file://`. Ensure the API base URL and CORS origin match the backend deployment.
 
The consultant is for general health education, not diagnosis or prescribing. Never enter patient-identifying information in the chat.