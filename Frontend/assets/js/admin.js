async function loadView() {
  const hash = location.hash.replace('#', '') || 'overview';
  const viewEl = document.getElementById('view');
  
  document.querySelectorAll('.sidebar a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${hash}`);
  });

  viewEl.innerHTML = '<div class="muted" style="padding: 20px;">Loading...</div>';

  try {
    if (hash === 'overview') {
      const data = await HealthPassAPI.getAdminOverview();
      viewEl.innerHTML = `
        <div class="head"><h1>System Overview</h1></div>
        <div class="grid4" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:20px;">
          <div class="card" style="background:#fff; padding:20px; border-radius:12px;"><p class="muted">Total Clinics</p><h1>${data.clinics || 0}</h1></div>
          <div class="card" style="background:#fff; padding:20px; border-radius:12px;"><p class="muted">Registered Patients</p><h1>${data.patients || 0}</h1></div>
          <div class="card" style="background:#fff; padding:20px; border-radius:12px;"><p class="muted">Clinic Staff</p><h1>${data.staff || 0}</h1></div>
          <div class="card" style="background:#fff; padding:20px; border-radius:12px;"><p class="muted">Clinic Admins</p><h1>${data.subadmins || 0}</h1></div>
        </div>
      `;
    } 
    else if (hash === 'patients') {
      const patients = await HealthPassAPI.getAdminPatients();
      viewEl.innerHTML = `
        <div class="head"><h1>Patients</h1></div>
        <table style="width: 100%; background: #fff; border-radius: 12px; border-collapse: collapse;">
          <tr style="background: #f8fafc; text-align: left;"><th style="padding:16px;">Name</th><th>ID</th><th>Phone</th><th>Balance</th></tr>
          ${patients.map(p => `<tr style="border-bottom: 1px solid #eee;"><td style="padding:16px;"><b>${p.name}</b></td><td>${p.qrid}</td><td>${p.phone}</td><td>₦${p.balance}</td></tr>`).join('')}
        </table>
      `;
    }
    else if (hash === 'clinics') {
      const clinics = await HealthPassAPI.getAdminClinics();
      viewEl.innerHTML = `
        <div class="head"><h1>Clinics</h1></div>
        <table style="width: 100%; background: #fff; border-radius: 12px; border-collapse: collapse;">
          <tr style="background: #f8fafc; text-align: left;"><th style="padding:16px;">Clinic</th><th>Location</th><th>Phone</th></tr>
          ${clinics.map(c => `<tr style="border-bottom: 1px solid #eee;"><td style="padding:16px;"><b>${c.name}</b></td><td>${c.lga}, ${c.state}</td><td>${c.phone}</td></tr>`).join('')}
        </table>
      `;
    }
    else if (hash === 'accounts') {
      const accounts = await HealthPassAPI.getAdminAccounts();
      viewEl.innerHTML = `
        <div class="head"><h1>Accounts</h1></div>
        <table style="width: 100%; background: #fff; border-radius: 12px; border-collapse: collapse;">
          <tr style="background: #f8fafc; text-align: left;"><th style="padding:16px;">Name</th><th>Username</th><th>Role</th><th>Status</th></tr>
          ${accounts.map(a => `<tr style="border-bottom: 1px solid #eee;"><td style="padding:16px;"><b>${a.name}</b></td><td>${a.username}</td><td>${a.role}</td><td>${a.status}</td></tr>`).join('')}
        </table>
      `;
    }
    else if (hash === 'ai-governance') {
      viewEl.innerHTML = `
        <div class="head"><h1>AI Governance (RAG)</h1><p class="muted">Upload medical knowledge.</p></div>
        <div class="card" style="max-width: 600px; padding: 24px; background:#fff; border-radius:12px;">
          <label style="font-weight:bold;">Title</label>
          <input class="field" id="src-title" placeholder="e.g. WHO Malaria Guidelines">
          <label style="font-weight:bold; margin-top:16px; display:block;">URL</label>
          <input class="field" id="src-url" placeholder="https://who.int/malaria">
          <label style="font-weight:bold; margin-top:16px; display:block;">Content</label>
          <textarea class="field" id="src-content" style="min-height: 150px;"></textarea>
          <button class="btn primary" id="submit-src" style="margin-top: 24px; width: 100%;">Upload Source</button>
        </div>
      `;
      document.getElementById('submit-src').onclick = async () => {
        const title = document.getElementById('src-title').value;
        const url = document.getElementById('src-url').value;
        const content = document.getElementById('src-content').value;
        if (!title || !url || !content) return alert('Fill all fields');

        const res = await fetch('http://localhost:5000/api/ai/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
          body: JSON.stringify({ title, url, content })
        });
        const d = await res.json();
        if (res.ok) { alert('Knowledge uploaded!'); document.getElementById('src-content').value = ''; }
        else alert(d.message);
      };
    }
  } catch (error) {
    // If it crashes again, this will print the EXACT error to your console
    console.error("Admin Dashboard Error:", error);
    viewEl.innerHTML = `<div class="banner red" style="background:#fee2e2; padding:16px; border-radius:8px;">Error: ${error.message}</div>`;
  }
}

(async function init() {
  if (!localStorage.getItem('token')) return location.replace('login.html');
  await loadView();
  window.addEventListener('hashchange', loadView);
  document.getElementById('logout').onclick = () => { localStorage.removeItem('token'); location.href = 'login.html'; };
})();