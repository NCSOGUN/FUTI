(() => {
    const $ = selector => document.querySelector(selector);
    const token = localStorage.getItem('hp_token');
    if (!token) { location.href = '../login.html'; return; }
    const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.BASE_URL) ? CONFIG.BASE_URL : (window.HEALTHPASS_API_BASE || '/api');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const log = $('#chatLog');
    const status = $('#chatStatus');
    const conversationId = crypto.randomUUID();
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function addBubble(text, who = 'assistant') {
      const el = document.createElement('div');
      el.className = `bubble ${who}`;
      el.textContent = text;
      log.appendChild(el); log.scrollTop = log.scrollHeight;
      return el;
    }
    async function api(path, options = {}) {
      const response = await fetch(`${API_BASE}/ai${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Request failed');
      return data;
    }
    $('#chatForm').addEventListener('submit', async event => {
      event.preventDefault();
      const message = $('#message').value.trim();
      if (!message) return;
      addBubble(message, 'user');
      $('#message').value = '';
      const waiting = addBubble('Checking reviewed health information…');
      status.textContent = 'Please wait.';
      const consentToStore = $('#consentToStore')?.checked === true;
      try {
        const data = await api('/chat', {method:'POST',body:JSON.stringify({message,conversationId,consentToStore})});
        waiting.textContent = data.answer || 'No answer was returned.';
        if (data.sources?.length) {
          const sourceBox = document.createElement('div');
          sourceBox.className = 'bubble assistant source';
          sourceBox.textContent = 'Reviewed sources:\n' + data.sources.map(s => `[${s.id}] ${s.title} — ${s.publisher || ''} — ${s.url}`).join('\n');
          waiting.after(sourceBox);
        }
        if (data.urgency === 'emergency') waiting.style.border = '2px solid #c33';
        const feedback = document.createElement('div');
        feedback.className = 'ai-muted';
        feedback.textContent = 'Was this response helpful? ';
        for (const helpful of [true, false]) {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'btn sm';
          button.textContent = helpful ? 'Yes' : 'No';
          button.onclick = async () => {
            try {
              await api('/feedback', {method:'POST',body:JSON.stringify({
                feature:'chat', helpful, rating:helpful?5:2, conversationId,
                reason: helpful ? '' : 'User marked this answer as not helpful.'
              })});
              button.disabled = true; status.textContent = 'Thank you. Feedback submitted for review.';
            } catch (error) { status.textContent = error.message; }
          };
          feedback.appendChild(button);
        }
        waiting.after(feedback);
        status.textContent = data.disclaimer || 'General information only.';
      } catch (error) {
        waiting.textContent = error.message;
        status.textContent = 'Check your connection or contact the system administrator.';
      }
    });
   
    $('#clinicForm').addEventListener('submit', async event => {
      event.preventDefault();
      const params = new URLSearchParams();
      for (const [id, key] of [['clinicQuery','q'],['clinicState','state'],['clinicLga','lga'],['clinicService','service']]) {
        const value = document.getElementById(id)?.value.trim();
        if (value) params.set(key, value);
      }
      $('#clinics').textContent = 'Searching approved clinic records…';
      try {
        const data = await api('/clinics?' + params.toString(), {method:'GET'});
        $('#clinics').innerHTML = data.clinics.map(c => `<div class="ai-card"><b>${esc(c.name)}</b><p>${esc(c.address)}, ${esc(c.lga)}, ${esc(c.state)}</p><p>${(c.services||[]).map(s=>`<span class="pill">${esc(s)}</span>`).join(' ')}</p><p>${esc(c.phone||'Contact details not listed')}</p></div>`).join('') || '<p>No matching approved clinics were found.</p>';
      } catch (error) { $('#clinics').textContent = error.message; }
    });
  })();  