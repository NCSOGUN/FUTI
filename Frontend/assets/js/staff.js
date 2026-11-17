/* staff.js – clinic desktop workspace. Hash router: #dashboard #find #patient #visit #billing */
let current = MOCK.patients[0];   // patient selected in "Find patient" (replace with real API data)
const todayLabel = '18 October 2026';
const qBadge = s => badge({'Ready for visit':'ok','In consultation':'neutral','Waiting':'warn','At triage':'neutral'}[s]||'neutral', s);
const views = {
  async dashboard(){
    const d = await HealthPassAPI.getDashboard();
    const stat = (t,v,s)=>`<div class="card"><span class="muted">${t}</span><b>${v}</b><span class="small muted">${s}</span></div>`;
    return `<div class="head"><div><h1>Good morning, ${STAFF.name.split(' ')[0]}</h1><span class="muted">Here's what's happening at your clinic today.</span></div><a class="btn primary sm" href="#register">→ Register patient</a></div>
    <div class="stats">${stat('Patients seen today',d.seen,'8 patients still in the queue')}${stat('New registrations','0'+d.registrations,'4 adults • 2 children')}${stat('Wallet payments',naira(d.payments).replace('.00',''),'18 successful payments today')}${stat('Low-balance alerts','0'+d.lowBalance,'Wallet balances below ₦1,000')}</div>
    <div class="card"><h2 style="margin-bottom:10px">Today's queue</h2><table><tr><th>Patient</th><th>In</th><th>Service</th><th>Status</th><th></th></tr>
    ${d.queue.map(p=>`<tr><td><b>${p.name}</b><br><span class="small muted">${p.id}</span></td><td>${p.time}</td><td>${p.service}</td><td>${qBadge(p.status)}</td><td><a href="#patient">↗</a></td></tr>`).join('')}</table></div>`;
  },
  async find(){
    return `<div class="head"><div><h1>Find patient</h1><span class="muted">Search a HealthPass ID, name or phone number before creating a new record.</span></div><a class="btn sm" href="#register">Register new patient</a></div>
    <div class="card"><label for="q" style="margin-top:0">HealthPass ID, patient name or phone number</label>
    <div class="row"><input class="field" id="q" value="Amina" style="flex:4"><button class="btn primary" id="s" style="flex:1">→ Search patients</button><button class="btn" id="scan" style="flex:1" data-ic="scan">Scan QR</button></div>
    <p class="small muted">Searches saved clinic records while offline. Confirm the patient's name and date of birth before opening a record.</p></div>
    <div id="results" style="margin-top:20px"></div>`;
  },
  async patient(){
    const p = current;
    return `<div class="head card"><div><h1>${p.name}</h1><span class="muted">${p.id} • ${p.age} years • ${p.sex}</span></div>
      <div><span class="small muted">Wallet balance</span><h2>${naira(p.wallet)}</h2></div><a class="btn primary sm" href="#visit">→ Start visit</a></div>
    <div class="row"><div class="banner red">! Allergy: Penicillin • Rash reported</div><div class="banner">! Overdue vaccine: Td dose 2 • Due 10 Oct 2026</div></div>
    <div class="split"><div class="card"><h2>Patient information</h2><p>Phone: ${p.phone}</p><p>Last visit: ${p.last}</p><p class="muted small">TODO: load full record (DOB, blood group, next of kin) from API.</p></div>
    <div class="card"><h2>Care plan</h2><p>Antenatal • 24 weeks</p><div class="banner" style="margin-top:8px">Next appointment: 24 October 2026</div></div></div>`;
  },
  async visit(){
    const f=(id,l,v)=>`<label for="${id}">${l}</label><textarea class="field" id="${id}">${v}</textarea>`;
    const vt=(id,l,v)=>`<div><label for="${id}">${l}</label><input class="field" id="${id}" value="${v}"></div>`;
    return `<div class="head"><div><h1>Record visit</h1><span class="muted">General consultation • ${todayLabel} • Visit V-2026-1048</span></div><a href="#patient">← Back to patient</a></div>
    <div class="card" style="margin-bottom:16px"><b>${current.name}</b> • ${current.id} ${badge('warn','In progress')} ${badge('bad','Penicillin allergy')}</div>
    <div class="split"><div class="card"><h2>Clinical details</h2>${f('complaint','Complaint *','Headache and fatigue for 2 days; no fever or visual changes.')}${f('diagnosis','Diagnosis *','Tension-type headache • G44.2')}${f('treatment','Treatment *','Paracetamol 500 mg • 1 tablet up to 3 times daily for 3 days')}${f('notes','Notes and follow-up','Rest, fluids. Return if persistent or worsening; ANC on 24 Oct.')}</div>
    <div><div class="card"><h2>Vitals</h2><div class="row">${vt('bp','Blood pressure (mmHg)','112 / 72')}${vt('pulse','Pulse (bpm)','78')}</div><div class="row">${vt('temp','Temperature (°C)','36.7')}${vt('spo2','SpO₂ (%)','98')}</div><div class="row">${vt('wt','Weight (kg)','64')}${vt('rr','Resp. rate (/min)','18')}</div></div>
    <div class="banner" style="margin-top:12px">Td dose 2 is overdue. Review vaccination history and arrange catch-up during this visit.</div></div></div>
    <div class="head" style="margin-top:20px"><span class="muted small">💾 Ready to save locally. This visit will sync when the connection returns.</span><div class="row"><a class="btn" href="#patient">Cancel</a><button class="btn primary" id="save">→ Save visit</button></div></div>`;
  },
  async billing(){
    const b = await HealthPassAPI.getBill(); const total = b.items.reduce((s,i)=>s+i.qty*i.price,0);
    return `<div class="head"><div><h1>Billing</h1><span class="muted">Review today's charges and request secure wallet payment.</span></div></div>
    <div class="split"><div class="card"><b>${current.name}</b> ${badge('neutral','Draft bill')}<p class="small muted">${b.invoice} • Visit ${b.visit}</p>
      <table><tr><th>Services & drugs</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr>
      ${b.items.map(i=>`<tr><td><b>${i.name}</b><br><span class="small muted">${i.kind}</span></td><td>${i.qty}</td><td>${naira(i.price)}</td><td><b>${naira(i.qty*i.price)}</b></td></tr>`).join('')}</table>
      <h1 style="text-align:right;margin-top:12px">${naira(total)}</h1></div>
    <div class="card"><h2>Wallet payment</h2><div class="banner" style="background:#E6F7F4;color:var(--teal);margin-top:10px">Available balance<h1>${naira(current.wallet)}</h1></div>
      <p>This bill: <b>${naira(total)}</b></p><p>Balance after payment: <b style="color:var(--teal)">${naira(current.wallet-total)}</b></p>
      <button class="btn primary" id="pay" style="margin:12px 0">→ Request payment</button>
      <p class="small muted">🔒 The patient must approve with their PIN. Staff never enter a patient's PIN.</p><p id="paymsg" class="small"></p>
      <p class="small" style="color:var(--amb-text)">Offline requests are queued. No wallet is debited until the connection returns and the patient approves.</p></div></div>`;
  },
  async register(){ return `<h1>Register patient</h1><p class="muted">TODO: reuse the fields from register.html and call HealthPassAPI.register(). Search first to avoid duplicates.</p>`; },
  async vaccinations(){ return `<h1>Vaccinations</h1><p class="muted">TODO: not in the PDF. List overdue vaccines and record doses.</p>`; },
  async reports(){ return `<h1>Reports</h1><p class="muted">TODO: not in the PDF. Daily/weekly clinic reports.</p>`; }
};
/* Wire up buttons that exist only on certain views */
function bind(name){
  if(name==='find'){ const run = async()=>{ const r = await HealthPassAPI.searchPatients($('#q').value);
      const dup = r.some(p=>p.status==='Possible duplicate');
      $('#results').innerHTML = (dup?'<div class="banner">! Possible duplicate found: Amina Yusuf and Aminat Yusuf share a phone number and date of birth. Review before registering.</div>':'')+
      `<div class="card"><table><tr><th>Patient / ID</th><th>Age / Sex</th><th>Phone</th><th>Last visit</th><th>Wallet</th><th>Status</th><th></th></tr>`+
      r.map((p,i)=>`<tr class="${p.status!=='Verified'?'dup':''}"><td><b>${p.name}</b><br><span class="small muted">${p.id}</span></td><td>${p.age} • ${p.sex}</td><td>${p.phone}</td><td>${p.last}</td><td>${naira(p.wallet).replace('.00','')}</td>
      <td>${badge(p.status==='Verified'?'ok':'warn',p.status)}</td><td><a href="#patient" data-i="${i}">Open →</a></td></tr>`).join('')+`</table><p class="small muted">Do not merge records without confirming identity</p></div>`;
      $('#results').querySelectorAll('[data-i]').forEach(a=>a.onclick=()=>{current=r[a.dataset.i]}); };
    $('#s').onclick = run; $('#scan').onclick = scanQR; $('#q').onkeydown = e => e.key==='Enter' && run(); run(); }
  if(name==='visit') $('#save').onclick = async () => {
    const g = id => $('#'+id).value.trim();
    if(!g('complaint')||!g('diagnosis')||!g('treatment')) return alert('Complaint, diagnosis and treatment are required.');
    await HealthPassAPI.saveVisit({patientId:current.id,complaint:g('complaint'),diagnosis:g('diagnosis'),treatment:g('treatment'),notes:g('notes'),
      vitals:{bp:g('bp'),pulse:g('pulse'),temp:g('temp'),spo2:g('spo2'),weight:g('wt'),rr:g('rr')}});
    alert('Visit saved.'); location.hash = '#billing'; };
  if(name==='billing') $('#pay').onclick = async () => { $('#pay').disabled = true;
    await HealthPassAPI.requestPayment({invoice:'INV-2026-1048',amount:2500});
    $('#paymsg').textContent = 'Request sent. Awaiting patient approval. Do not charge again.'; };
}
async function render(){
  const name = (location.hash||'#dashboard').slice(1); const key = views[name]?name:'dashboard';
  document.querySelectorAll('.side a').forEach(a=>a.classList.toggle('active', a.hash==='#'+key || (key==='patient'||key==='visit')&&a.hash==='#find'));
  $('#view').innerHTML = '<p class="muted">Loading…</p>';
  $('#view').innerHTML = await views[key](); bind(key); hydrate();
}
 
/* ===== v2: cross-hospital history, clinic registration, QR scanning ===== */
const typeBadge = t => badge(t==='Visit'?'done':t==='Payment'?'neutral':'warn', t);
const _patient = views.patient;
views.patient = async function(){
  const html = await _patient();
  const h = await HealthPassAPI.getPatientHistory(current.id);
  /* Everything this HealthPass ID has done at ANY hospital in Nigeria (that is the point of a national health ID) */
  return html + `<div class="card" style="margin-top:20px"><h2>All records • every hospital</h2><p class="small muted" style="margin-bottom:8px">Visits, drugs and payments from every clinic that uses HealthPass.</p>
    <table><tr><th>Date</th><th>Clinic</th><th>Type</th><th>Details</th><th>Amount</th></tr>${h.map(x=>`<tr><td>${x.date}</td><td>${x.clinic}</td><td>${typeBadge(x.type)}</td><td><b>${x.title}</b><br><span class="small muted">${x.detail}</span></td><td>${x.amount?naira(-x.amount):'—'}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">No records yet.</td></tr>'}</table></div>`;
};
views.clinic = async () => `<div class="head"><div><h1>Register clinic</h1><span class="muted">Clinic administrators add their facility so patients can find it and staff can use HealthPass.</span></div></div>
  <div class="card" style="max-width:640px"><label for="cn" style="margin-top:0">Clinic name</label><input class="field" id="cn">
  <div class="row"><div><label for="cst">State</label><select class="field" id="cst">${STATES.map(s=>`<option>${s}</option>`).join('')}</select></div><div><label for="cl">LGA</label><input class="field" id="cl"></div></div>
  <label for="ca">Address</label><input class="field" id="ca"><label for="cp">Clinic phone</label><input class="field" id="cp" type="tel">
  <label>Services</label><div class="chips">${['Antenatal','Immunisation','General','Laboratory','Pharmacy'].map(s=>`<label style="font-weight:400;margin:0"><input type="checkbox" value="${s}"> ${s}</label>`).join('')}</div>
  <label for="cad">Administrator name</label><input class="field" id="cad"><p id="cmsg" class="banner hidden" style="margin-top:12px"></p>
  <button class="btn primary" id="creg" style="margin-top:16px">→ Register clinic</button></div>`;
views.register = async () => `<h1>Register patient</h1><p class="muted" style="margin-top:8px">Patients create their own HealthPass in the app (register.html). Search first with Find Patient to avoid duplicates. TODO: staff-assisted registration.</p>`;
const _bind = bind;
bind = function(name){ _bind(name);
  if(name==='clinic') $('#creg').onclick = async () => { const g=id=>$('#'+id).value.trim(), msg=$('#cmsg'); msg.classList.remove('hidden');
    if(!g('cn')||!g('cl')||!g('ca')) return msg.textContent='Please fill in the clinic name, LGA and address.';
    await HealthPassAPI.registerClinic({name:g('cn'),state:$('#cst').value,lga:g('cl'),address:g('ca'),phone:g('cp'),admin:g('cad'),services:[...document.querySelectorAll('.chips input:checked')].map(i=>i.value)});
    msg.textContent='Clinic registered. Patients can now find it under Find a clinic.'; }; };
async function scanQR(){
  const m = document.createElement('div'); m.className='sheet-back'; m.style.alignItems='center';
  m.innerHTML = `<div class="sheet" style="max-width:420px;border-radius:20px"><b>Scan patient QR</b><video id="cam" playsinline muted style="width:100%;border-radius:12px;background:#000"></video>
    <p id="cm" class="small muted">Point the camera at the patient's HealthPass QR code.</p><input class="field" id="manual" placeholder="Or type the HealthPass ID"><button class="btn primary" id="mgo">Open patient</button><button class="btn" id="mx">Close</button></div>`;
  document.body.append(m); let stream, stop = false;
  const close = () => { stop = true; stream && stream.getTracks().forEach(t=>t.stop()); m.remove(); };
  const done = async id => { close(); const r = await HealthPassAPI.searchPatients(id); if(r[0]){ current = r[0]; location.hash = '#patient'; render(); } else alert('No patient found for ' + id); };
  $('#mx').onclick = close; $('#mgo').onclick = () => done($('#manual').value.trim());
  if('BarcodeDetector' in window && navigator.mediaDevices){
    try{ stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); const v=$('#cam'); v.srcObject=stream; await v.play();
      const det = new BarcodeDetector({formats:['qr_code']});
      (async function loop(){ if(stop) return; const c = await det.detect(v).catch(()=>[]); if(c[0]) return done(c[0].rawValue.replace(/^HP:/,'')); setTimeout(loop,300); })();
    }catch(e){ $('#cm').textContent = 'Camera unavailable (needs HTTPS and permission). Type the ID instead.'; }
  } else $('#cm').textContent = 'This browser cannot scan QR codes. Type the ID instead.';
}
/* ===== v3: staff must be logged in. The account decides the clinic and name shown; every action is audited by the API layer. ===== */
let STAFF = {name:'Staff'};
(async () => {
  STAFF = await requireRole(['staff'], 'index.html');   // not logged in / not a staff account -> back to login
  $('#clinicName').textContent = STAFF.clinic.name; $('#clinicSub').textContent = STAFF.clinic.state + ', Nigeria • ' + STAFF.clinic.id;
  $('#uName').textContent = STAFF.name; $('#uRole').textContent = STAFF.title;
  $('#logout').onclick = async () => { await HealthPassAPI.staffLogout(); location.replace('index.html'); };
  watchConnection(); addEventListener('hashchange', render); render();
})();
 
/* ===== v4: invoice builder (auto total), payment requests, refund requests, complaints ===== */
function askText(title, ph){ return new Promise(res => { const m=document.createElement('div'); m.className='sheet-back'; m.style.alignItems='center';
  m.innerHTML=`<div class="sheet" style="max-width:420px;border-radius:20px"><b>${title}</b><textarea class="field" id="at" placeholder="${ph}"></textarea><button class="btn primary" id="aok">Submit</button><button class="btn" id="ano">Cancel</button></div>`;
  document.body.append(m); $('#ano').onclick=()=>{m.remove();res(null)}; $('#aok').onclick=()=>{const v=$('#at').value.trim(); if(!v) return; m.remove(); res(v)}; }); }
const CH_BADGE = {pending:['warn','Pending'],paid:['ok','Paid'],declined:['bad','Declined'],refunded:['neutral','Refunded']};
views.billing = async () => `<div class="head"><div><h1>Invoice &amp; billing</h1><span class="muted">List what you are charging for. The total updates as you type.</span></div></div>
  <div class="split"><div class="card"><div class="head" style="margin-bottom:10px"><div><b>${current.name}</b> <span class="muted">${current.id}</span><br><span class="small muted">To bill a different patient, open them from Find Patient first.</span></div>${badge('neutral','Draft invoice')}</div>
    <table id="inv"><tr><th>Drug / service</th><th style="width:90px">Qty</th><th style="width:140px">Unit price (₦)</th><th style="width:120px">Amount</th><th style="width:50px"></th></tr></table>
    <button class="btn sm" id="addrow" style="margin-top:12px" data-ic="plus" data-s="16">Add item</button>
    <div style="text-align:right;margin-top:14px"><span class="muted">Total payable</span><h1 id="tot">₦0.00</h1></div></div>
  <div class="card"><h2>Payment from patient wallet</h2><p class="muted small" style="margin:8px 0 14px">The patient approves on their own phone with their PIN. Staff never enter or see a PIN. The money goes to the clinic wallet, which only your clinic admin can see. Staff cannot refund: request a refund and the clinic admin decides.</p>
    <button class="btn primary" id="pay" data-ic="arrow">Request payment</button><p id="paymsg" class="small" style="margin-top:12px"></p></div></div>
  <h2 style="margin:24px 0 12px">Recent payment requests</h2><div id="acts" class="stats" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))"></div>`;
views.complaint = async () => `<h1>Make a complaint</h1><p class="muted" style="margin:6px 0 16px">Choose the clinic you are complaining about. Only that clinic's admin and the main HealthPass admin will see it.</p>
  <div class="card" style="max-width:640px"><label for="cc" style="margin-top:0">Clinic</label><select class="field" id="cc"></select><label for="ct">Your complaint</label><textarea class="field" id="ct" style="min-height:140px"></textarea>
  <p id="cmsg" class="banner hidden" style="margin-top:12px;background:#E6F4F1;color:var(--teal)"></p><button class="btn primary" id="cs" style="margin-top:14px" data-ic="arrow">Send complaint</button></div>`;
function initBilling(){
  const tbl=$('#inv'); let lastId=null;
  const rows=()=>[...tbl.querySelectorAll('tr')].slice(1).map(tr=>({tr,desc:tr.querySelector('.d').value.trim(),qty:+tr.querySelector('.q').value||0,price:+tr.querySelector('.p').value||0}));
  const calc=()=>{ let t=0; rows().forEach(r=>{ const a=r.qty*r.price; t+=a; r.tr.querySelector('.amt').innerHTML='<b>'+naira(a)+'</b>'; }); $('#tot').textContent=naira(t); return t; };
  const addRow=()=>{ const tr=document.createElement('tr'); tr.innerHTML='<td><input class="field d" placeholder="e.g. Amoxicillin 500 mg"></td><td><input class="field q" type="number" min="1" value="1"></td><td><input class="field p" type="number" min="0" placeholder="0"></td><td class="amt"><b>₦0.00</b></td><td><button class="btn sm x" aria-label="Remove item">✕</button></td>';
    tbl.append(tr); tr.querySelector('.x').onclick=()=>{ if(rows().length>1){ tr.remove(); calc(); } }; };
  tbl.addEventListener('input',calc); $('#addrow').onclick=addRow; addRow();
  const loadActs=async()=>{ const l=await HealthPassAPI.getStaffCharges(); if(!$('#acts')) return;
    $('#acts').innerHTML=l.slice(0,9).map(c=>`<div class="card"><div class="head" style="margin-bottom:6px">${badge(...CH_BADGE[c.status])}<b>${naira(c.amount).replace('.00','')}</b></div>
      <b>${c.patientName}</b><br><span class="small muted">${c.invoice} • ${fmtTime(c.t)}</span>
      ${c.status==='paid'?(c.refund?'<p class="small" style="margin-top:8px;color:var(--amb-text)">Refund requested • awaiting clinic admin</p>':`<button class="btn sm" style="margin-top:10px" data-rf="${c.id}">Request refund</button>`):''}</div>`).join('')||'<p class="muted">No requests yet.</p>';
    $('#acts').querySelectorAll('[data-rf]').forEach(b=>b.onclick=async()=>{ const r=await askText('Request refund','Why should this payment be refunded?'); if(!r) return;
      try{ await HealthPassAPI.requestRefund(b.dataset.rf,r); loadActs(); }catch(e){ alert(e.message); } });
    const mine=l.find(c=>c.id===lastId); if(mine&&mine.status!=='pending'){ $('#paymsg').innerHTML=badge(...CH_BADGE[mine.status])+' '+(mine.status==='paid'?'Payment confirmed. Money has moved to the clinic wallet.':'The patient declined the request.'); $('#pay').disabled=false; lastId=null; } };
  $('#pay').onclick=async()=>{ const items=rows().filter(r=>r.desc&&r.qty>0).map(r=>({desc:r.desc,qty:r.qty,price:r.price,inventoryItemId:r.tr.querySelector('.sku')?.value||null}));
    if(!items.length||calc()<=0) return $('#paymsg').textContent='Add at least one item with a price.';
    try{ const r=await HealthPassAPI.requestPayment({patientId:current.id,patientName:current.name,items}); lastId=r.id; $('#pay').disabled=true;
      $('#paymsg').innerHTML=badge('warn','Pending')+' '+r.invoice+' sent. Awaiting patient approval. Do not request again.'; loadActs(); }
    catch(e){ $('#paymsg').textContent=e.message; } };
  loadActs(); clearInterval(window.invPoll); window.invPoll=setInterval(()=>{ if(!$('#acts')) return clearInterval(window.invPoll); loadActs(); },4000);
}
const _bind2 = bind;
bind = function(name){ _bind2(name);
  if(name==='billing') initBilling();
  if(name==='complaint'){ HealthPassAPI.publicClinics().then(l=>{ $('#cc').innerHTML=l.map(c=>`<option value="${c.id}" ${c.id===STAFF.clinic.id?'selected':''}>${c.name} • ${c.state}</option>`).join(''); });
    $('#cs').onclick=async()=>{ const t=$('#ct').value.trim(); if(!t) return; await HealthPassAPI.staffComplaint({clinicId:$('#cc').value,text:t});
      $('#cmsg').textContent='Complaint sent to the clinic admin and the main admin.'; $('#cmsg').classList.remove('hidden'); $('#ct').value=''; }; } };