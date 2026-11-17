(() => {
  const token = localStorage.getItem('hp_token');
  if (!token) { location.href = 'login.html'; return; }
  const $ = s => document.querySelector(s);
  const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.BASE_URL) ? CONFIG.BASE_URL : (window.HEALTHPASS_API_BASE || '/api');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}/admin/ai${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function loadSources() {
    const rows = await api('/knowledge?status=draft');
    $('#sources').innerHTML = rows.map(s => `<div class="source"><b>${esc(s.title)}</b><p class="mutedx">${esc(s.publisher)} • ${esc(s.sourceType)} • <a href="${esc(s.url)}" target="_blank" rel="noopener">Open source</a></p><p>${esc(s.summary || '')}</p><div class="rowx"><button class="btn sm" data-review="${s._id}" data-status="reviewed">Mark reviewed</button><button class="btn sm primary" data-review="${s._id}" data-status="published">Publish after verification</button></div></div>`).join('') || '<p class="mutedx">No draft sources.</p>';
    $('#sources').querySelectorAll('[data-review]').forEach(button => button.onclick = async () => {
      const reviewNote = prompt('Record what you checked: authority, date, jurisdiction and clinical relevance.');
      if (!reviewNote || !reviewNote.trim()) return;
      try {
        await api(`/knowledge/${button.dataset.review}/review`, { method:'PATCH', body:JSON.stringify({status:button.dataset.status,reviewNote}) });
        await loadSources();
      } catch (e) { alert(e.message); }
    });
  }
  async function loadFeedback() {
    const rows = await api('/feedback');
    $('#feedback').innerHTML = rows.map(x => `<div class="source"><b>${esc(x.feature)} feedback</b><p class="mutedx">Rating: ${esc(x.rating ?? '—')} • Helpful: ${esc(x.helpful ?? 'not specified')} • ${new Date(x.createdAt).toLocaleString()}</p><p>${esc(x.reason || '')}</p><p><b>Suggested correction:</b> ${esc(x.correction || 'None')}</p><button class="btn sm" data-feedback="${x._id}">Mark reviewed</button></div>`).join('') || '<p class="mutedx">No pending feedback.</p>';
    $('#feedback').querySelectorAll('[data-feedback]').forEach(button => button.onclick = async () => {
      const reviewNote = prompt('Reviewer note (optional)') || '';
      try { await api(`/feedback/${button.dataset.feedback}/review`, {method:'PATCH',body:JSON.stringify({reviewNote})}); await loadFeedback(); }
      catch (e) { alert(e.message); }
    });
  }
  async function loadAlerts() {
    const rows = await api('/inventory-alerts');
    $('#alerts').innerHTML = `<table><thead><tr><th>Clinic</th><th>Date</th><th>Low stock</th><th>Expiring</th><th>Expired</th><th>Email</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.clinicId)}</td><td>${esc(x.dayKey)}</td><td>${x.lowStock?.length||0}</td><td>${x.expiring?.length||0}</td><td>${x.expired?.length||0}</td><td>${x.emailSent?'Sent':esc(x.emailError||'Pending')}</td></tr>`).join('')}</tbody></table>`;
  }
  $('#sourceForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.target), data = Object.fromEntries(form);
    data.tags = String(data.tags || '').split(',').map(x=>x.trim()).filter(Boolean);
    data.reviewDueAt = data.reviewDueAt || null;
    try { await api('/knowledge', {method:'POST',body:JSON.stringify(data)}); event.target.reset(); $('#sourceStatus').textContent='Saved as draft for review.'; await loadSources(); }
    catch (e) { $('#sourceStatus').textContent=e.message; }
  });
  $('#reloadSources').onclick = () => loadSources().catch(e=>alert(e.message));
  $('#reloadFeedback').onclick = () => loadFeedback().catch(e=>alert(e.message));
  $('#reloadAlerts').onclick = () => loadAlerts().catch(e=>alert(e.message));
  Promise.all([loadSources(),loadFeedback(),loadAlerts()]).catch(e=>alert(e.message));
})();