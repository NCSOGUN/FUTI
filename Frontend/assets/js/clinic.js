/* clinic.js – CLINIC ADMIN console (the "sub admin": exactly one per clinic, approved by the main admin).
   Only this person can: see the clinic wallet, withdraw, approve/reject refunds. Staff can only REQUEST a refund.
   Menus: Overview • Wallet • Refund requests • Staff • Patients seen • Complaints • Audit log */
   let ME;
   const menu = [['overview','grid','Overview'],['wallet','wallet','Clinic wallet'],['refunds','arrow','Refund requests'],['staff','user','Staff'],['patients','heart','Patients seen'],['complaints','alert','Complaints'],['audit','records','Audit log']];
   const TX = {payment:['ok','Payment in'],refund:['warn','Refund'],withdrawal:['neutral','Withdrawal']};
   const views = {
     async overview(){ const o = await HealthPassAPI.clinicOverview();
       return `<div class="head"><div><h1>Clinic overview</h1><span class="muted">Your clinic, your staff, your money.</span></div></div>
       <div class="stats">${stat('Clinic wallet',naira(o.balance),'Only you can see this')+stat('Refund requests',o.pendingRefunds,'Waiting for your decision')+stat('Active staff',o.staff,o.pendingStaff+' awaiting approval')+stat('Open complaints',o.openComplaints)}</div>
       <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${stat('Patients seen',o.patients)+stat('Actions (24h)',o.actions)}</div>`; },
     async wallet(){ const w = await HealthPassAPI.clinicWallet();
       return `<h1 style="margin-bottom:16px">Clinic wallet</h1><div class="split"><div class="card" style="background:var(--teal);color:#fff;border:0"><span style="opacity:.85">Available balance</span><b style="font-size:38px;margin:8px 0;display:block">${naira(w.balance)}</b><span class="small" style="opacity:.85">Payments from patients land here. Staff cannot see or touch this wallet.</span></div>
         <div class="card"><h2 style="margin-bottom:6px">Withdraw</h2><label for="wa" style="margin-top:6px">Amount (₦)</label><input class="field" id="wa" type="number" min="1"><label for="wb">Bank</label><input class="field" id="wb"><label for="wn">Account number</label><input class="field" id="wn" inputmode="numeric" maxlength="10">
         <p id="wm" class="banner red hidden" style="margin-top:10px"></p><button class="btn primary" id="wgo" style="margin-top:12px">Withdraw</button></div></div>
       <h2 style="margin:22px 0 10px">Transactions</h2><div class="card"><table>${th('Time','Type','Details','Amount')}${w.tx.map(t=>`<tr><td>${fmtTime(t.t)}</td><td>${badge(...TX[t.type])}</td><td>${t.note}</td><td><b class="${t.type==='payment'?'in-pos':'out-neg'}">${t.type==='payment'?'+':'−'}${naira(t.amount)}</b></td></tr>`).join('')||'<tr><td colspan="4" class="muted">No transactions yet.</td></tr>'}</table></div>`; },
     async refunds(){ const l = await HealthPassAPI.clinicRefunds();
       return `<h1 style="margin-bottom:6px">Refund requests</h1><p class="muted" style="margin-bottom:14px">Staff request refunds for wrong transactions. Approving returns the money from the clinic wallet to the patient's wallet.</p>
       ${l.map(r=>`<div class="card" style="margin-bottom:12px"><div class="head" style="margin-bottom:6px"><b>${r.patientName} • ${naira(r.amount)}</b>${badge({pending:'warn',approved:'ok',rejected:'bad'}[r.status],r.status[0].toUpperCase()+r.status.slice(1))}</div>
         <p>${r.reason}</p><p class="small muted" style="margin:6px 0 10px">${r.invoice} • requested by ${r.requestedBy} • ${fmtTime(r.t)}</p>
         ${r.status==='pending'?`<div class="acts"><button class="btn sm primary" data-kind="refund" data-id="${r.id}" data-status="approved">Approve refund</button><button class="btn sm danger" data-kind="refund" data-id="${r.id}" data-status="rejected">Reject</button></div>`:''}</div>`).join('')||'<div class="card muted">No refund requests.</div>'}`; },
     async staff(){ const l = await HealthPassAPI.clinicAccounts();
       return `<h1 style="margin-bottom:6px">Clinic staff</h1><p class="muted" style="margin-bottom:12px">Check each person's details before approving. One person, one login.</p><div class="card"><table>${th('Name / username','Email / phone','Licence','Status','')}${l.map(a=>`<tr><td><b>${a.name}</b><br><span class="small muted">${a.username} • ${a.title||''}</span></td><td>${a.email||'—'}<br><span class="small muted">${a.phone||''}</span></td><td>${a.licence||'—'}</td><td>${stBadge(a.status)}</td><td>${actions('staff',a.username,a.status)}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">No staff yet.</td></tr>'}</table></div>`; },
     async patients(){ const l = await HealthPassAPI.clinicPatients();
       return `<h1 style="margin-bottom:16px">Patients seen at your clinic</h1><div class="card"><table>${th('Patient','HealthPass ID','Phone','Sex')}${l.map(p=>`<tr><td><b>${p.name}</b></td><td>${p.id}</td><td>${p.phone}</td><td>${p.sex}</td></tr>`).join('')||'<tr><td colspan="4" class="muted">No patients yet.</td></tr>'}</table></div>`; },
     async complaints(){ const l = await HealthPassAPI.clinicComplaints();
       return `<h1 style="margin-bottom:6px">Complaints about your clinic</h1><p class="muted" style="margin-bottom:14px">Only you and the main admin can see these.</p>${l.map(c=>`<div class="card" style="margin-bottom:12px"><div class="head" style="margin-bottom:6px"><b>${c.fromName} <span class="small muted">(${c.fromType})</span></b>${badge(c.status==='open'?'warn':'ok',c.status==='open'?'Open':'Resolved')}</div>
         <p>${c.text}</p><p class="small muted" style="margin:6px 0 10px">${fmtTime(c.t)}</p>${c.status==='open'?`<button class="btn sm" data-kind="complaint" data-id="${c.id}">Mark resolved</button>`:''}</div>`).join('')||'<div class="card muted">No complaints.</div>'}`; },
     async audit(){ const l = await HealthPassAPI.clinicAudit();
       return `<div class="head"><h1>Audit log</h1><input class="field" id="af" placeholder="Filter by staff, action, patient…" style="max-width:320px"></div><p class="muted" style="margin-bottom:12px">Everything your staff did: logins, searches, records viewed, visits, payments, refunds.</p>
       <div class="card"><table id="at">${th('Time','Person','Action','Details')}${l.map(x=>`<tr><td>${fmtTime(x.t)}</td><td><b>${x.name}</b><br><span class="small muted">${x.user} • ${ROLE_LABEL[x.role]}</span></td><td>${x.action}</td><td>${[x.detail,x.patientId].filter(Boolean).join(' • ')||'—'}</td></tr>`).join('')}</table></div>`; }
   };
   async function render(){
     const k = (location.hash||'#overview').slice(1), key = menu.some(m=>m[0]===k) ? k : 'overview';
     $('#nav').innerHTML = menu.map(([id,ic,l])=>`<a href="#${id}" data-ic="${ic}" class="${id===key?'active':''}">${l}</a>`).join('');
     $('#view').innerHTML = '<p class="muted">Loading…</p>';
     try{ $('#view').innerHTML = await views[key](); }catch(e){ $('#view').innerHTML = '<div class="banner red">Could not load.</div>'; }
     hydrate();
     if(key==='wallet') $('#wgo').onclick = async () => { const m=$('#wm'); try{ await HealthPassAPI.withdraw({amount:$('#wa').value,bank:$('#wb').value.trim(),account:$('#wn').value.trim()}); render(); }catch(x){ m.textContent=x.message; m.classList.remove('hidden'); } };
     if(key==='audit') $('#af').oninput = e => document.querySelectorAll('#at tr:not(:first-child)').forEach(r => r.classList.toggle('hidden', !r.textContent.toLowerCase().includes(e.target.value.toLowerCase())));
   }
   document.addEventListener('click', async e => { const b = e.target.closest('[data-kind]'); if(!b) return; b.disabled = true;
     try{ const k=b.dataset.kind; if(k==='staff') await HealthPassAPI.setStaffStatus(b.dataset.id,b.dataset.status); else if(k==='refund') await HealthPassAPI.setRefund(b.dataset.id,b.dataset.status); else await HealthPassAPI.resolveClinicComplaint(b.dataset.id); }
     catch(x){ alert(x.message==='403'?'Not allowed.':x.message); } render(); });
   (async () => { ME = await requireRole(['subadmin'], '../staff/index.html');
     $('#roleLabel').textContent = 'CLINIC ADMIN'; $('#who').textContent = ME.name; $('#clinicOf').textContent = ME.clinic.name;
     $('#logout').onclick = async () => { await HealthPassAPI.staffLogout(); location.replace('../staff/index.html'); };
     addEventListener('hashchange', render); render(); })();   