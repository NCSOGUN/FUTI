/* app.js – patient mobile app */
let recTab = 'Visits', clinicQ = '', clinicState = '', me = null;

const hist = h => `<div class="item"><div><b>${h.title}</b><br><span class="muted small">${h.date} • ${h.clinic}<br>${h.detail}</span></div>
  <div style="text-align:right">${badge(h.type==='Visit'?'done':h.type==='Payment'?'neutral':'warn',h.type)}${h.amount?`<br><b class="out-neg">−${naira(-h.amount).replace('.00','')}</b>`:''}</div></div>`;

const empty = t => `<div class="card muted" style="text-align:center">${t}</div>`;

const views = {
  async home(){
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return `<div class="head"><div><p class="muted">${greeting},</p><h1>${me.name.split(' ')[0]} 👋</h1></div><button class="icon-btn" aria-label="Notifications" onclick="alert('You have no new notifications.')" data-ic="bell" data-s="22"></button></div>
    <div class="hero-card"><div style="display:flex;flex-direction:column;justify-content:space-between"><b class="brand" style="color:#fff;font-size:18px" data-ic="cross">HealthPass</b>
      <div><h2 style="font-size:24px;margin-top:14px">${me.name}</h2><div style="opacity:.85">${me.id}</div><p class="small" style="margin-top:6px">Show this at your next clinic visit</p></div></div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:8px;align-items:flex-end"><span class="small" style="opacity:.8">DIGITAL HEALTH ID</span><div class="qr">${qrSVG('HP:'+me.id)}</div></div></div>
    <div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><span class="muted">Wallet balance</span><h1>${naira(me.balance)}</h1></div>
      <button class="btn sm" style="background:#E6F4F1;border:0" onclick="addMoney()" data-ic="plus">Add money</button></div>
    <h2 style="margin:22px 0 8px">Your care</h2>
    <div class="grid4"><a href="#records" onclick="recTab='Visits'"><span data-ic="calendar" data-s="28"></span>Visits</a><a href="#records" onclick="recTab='Vaccinations'"><span data-ic="syringe" data-s="28"></span>Vaccinations</a>
      <a href="#records" onclick="recTab='Antenatal'"><span data-ic="heart" data-s="28"></span>Pregnancy care</a><a href="#clinics"><span data-ic="pin" data-s="28"></span>Find a clinic</a></div>
    ${me.nextVisit?`<div class="banner" style="margin-top:12px;background:#FEF0C7"><span data-ic="calendar"></span><b>${me.nextVisit}</b></div>`:''}`;
  },
  
  async wallet(){
    const h = (await HealthPassAPI.getHistory()).filter(x=>x.amount);
    return `<div class="head"><h1>My wallet</h1><button class="icon-btn" aria-label="Help" data-ic="help"></button></div>
    <div class="hero-card" style="display:block"><span data-ic="wallet" style="opacity:.8"> Available balance</span><h1 style="font-size:40px;margin:8px 0;color:#fff">${naira(me.balance)}</h1><span class="small" style="opacity:.8">${me.name} • HealthPass wallet</span></div>
    
    <h2 style="margin-bottom:10px">Add money</h2>
    <div class="chips">${[1000,2000,5000,10000].map(a=>`<button onclick="topUp(${a})">+${naira(a).replace('.00','')}</button>`).join('')}</div>
    
    <div style="display:flex; gap:8px; margin: 10px 0 18px;">
      <input class="field" id="custom-amount" type="number" placeholder="Enter custom amount" style="margin-bottom:0;">
      <button class="btn primary" onclick="topUp(Number(document.getElementById('custom-amount').value))" style="width:auto; padding:0 20px;">Add</button>
    </div>

    <p class="small muted">Fund your wallet securely via Paystack.</p>
    <h2>Recent transactions</h2>${h.map(hist).join('')||empty('No transactions yet.')}`;
  },
  
  async records(){
    const tabs = ['Visits','Vaccinations','Antenatal'];
    let body='';
    if(recTab==='Visits'){ const h=await HealthPassAPI.getHistory(); body=`<h2>Your care history</h2><p class="muted">Records from every clinic you have visited.</p>${h.map(hist).join('')||empty('No visits yet.')}`; }
    else if(recTab==='Vaccinations'){ const v=await HealthPassAPI.getVaccinations(); body=`<h2>Your vaccinations</h2><p class="muted">Stay protected, one dose at a time.</p>
      <div style="display:flex;gap:8px;margin:8px 0">${badge('done','Done')}${badge('due','Due')}${badge('overdue','Overdue')}</div>
      ${v.map(x=>`<div class="item"><div><b>${x.title}</b><br><span class="muted small">${x.detail}</span></div>${badge(x.status,x.status[0].toUpperCase()+x.status.slice(1))}</div>`).join('')||empty('No vaccinations recorded.')}
      <div class="banner" style="margin-top:14px;background:#E6F4F1;color:var(--teal)" data-ic="info">Missed a dose? Your clinic can help you catch up safely.</div>`; }
    else body = me.nextVisit ? `<h2>Antenatal care</h2><div class="card" style="margin-top:10px"><b>24 weeks</b><p class="muted">Routine antenatal check-up</p></div><div class="banner" style="margin-top:12px;background:#FEF0C7"><span data-ic="calendar"></span>${me.nextVisit}</div>` : empty('No antenatal records yet.');
    return `<div class="head"><div><h1>Health records</h1><span class="muted">${me.name} • ${me.id}</span></div><button class="icon-btn" aria-label="Help" data-ic="help"></button></div>
    <div class="tabs">${tabs.map(t=>`<button class="${t===recTab?'active':''}" onclick="recTab='${t}';render()">${t}</button>`).join('')}</div>${body}`;
  },
  
  async clinics(){
    return `<div class="head" style="justify-content:flex-start"><a href="#home" aria-label="Back" data-ic="back" data-s="26" style="color:var(--slate)"></a><h1>Find a clinic</h1></div>
    <div style="display:flex; gap:8px; margin-bottom:10px;">
      <input class="field" id="cq" placeholder="Search clinic name, town or state" value="${clinicQ}" style="margin-bottom:0;">
      <button class="btn primary" onclick="loadClinics()" style="width:auto; padding:0 20px;">Search</button>
    </div>
    <select class="field" id="cs" style="margin:10px 0" onchange="loadClinics()"><option value="">All states</option>${STATES.map(s=>`<option ${s===clinicState?'selected':''}>${s}</option>`).join('')}</select>
    <div id="clist"></div>`;
  },
  
  async profile(){
    const nin = me.nin ? `<span id="nin">•••••••${me.nin.slice(-4)}</span> <a href="#profile" onclick="$('#nin').textContent='${me.nin}';return false">Show</a>` : '<span class="muted">Not added</span>';
    const row = (k,v) => `<div class="item"><span class="muted">${k}</span><b>${v}</b></div>`;
    return `<h1>Profile</h1><div class="ava-wrap"><div class="avatar">${me.photo?`<img src="${me.photo}" alt="Profile photo">`:initials(me.name)}</div>
      <label for="photo" aria-label="Change photo" data-ic="camera" data-s="18"></label><input id="photo" type="file" accept="image/*" class="hidden"></div>
    <h2 style="text-align:center">${me.name}</h2><p class="muted" style="text-align:center;margin-bottom:14px">${me.id}</p>
    <button class="btn primary" style="margin: 10px auto; display: block;" onclick="editProfile()">Edit Profile</button>
    <div class="card">${row('Phone number',me.phone.replace(/(\d{4})(\d{3})(\d{4})/,'$1 $2 $3'))}${row('Date of birth',me.dob)}${row('Gender',me.gender)}${row('Email',me.email||'—')}${row('NIN',nin)}</div>
    <button class="btn" style="margin-top:12px" onclick="complaintSheet()" data-ic="alert">Make a complaint about a clinic</button>
    <button class="btn" style="margin-top:18px;color:var(--red)" onclick="confirmLogout()" data-ic="logout">Log out</button>`;
  },
  
  async ai(){
    return `<div class="head"><h1>Health Assistant</h1></div>
    <div class="card" style="height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;" id="chat-box">
      <div class="banner" style="background: #E6F4F1; color: var(--teal);">Hello ${me.name.split(' ')[0]}! I am your HealthPass AI. How can I help you today? (Note: I cannot diagnose or prescribe).</div>
    </div>
    <div style="display: flex; gap: 8px; margin-top: 10px;">
      <input class="field" id="ai-input" placeholder="Ask a health question..." style="margin-bottom:0;" onkeypress="if(event.key === 'Enter') sendAIMessage()">
      <button class="btn primary" onclick="sendAIMessage()" style="width: auto; padding: 0 20px;">Send</button>
    </div>`;
  },
};

function sheet(html){ $('#sheet-root').innerHTML=`<div class="sheet-back"><div class="sheet">${html}</div></div>`; hydrate($('#sheet-root')); }
const closeSheet = () => $('#sheet-root').innerHTML='';
function confirmLogout(){ sheet(`<h2>Log out of HealthPass?</h2><p class="muted">You will need your ID and PIN to log in again.</p><button class="btn primary" id="yes">Log out</button><button class="btn" onclick="closeSheet()">Stay logged in</button>`); $('#yes').onclick=logout; }

async function complaintSheet(){ 
  try {
    const res = await fetch('http://localhost:5000/api/ai/clinics', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('hp_token') }
    });
    const data = await res.json();
    const l = data.clinics || [];

    sheet(`<h2>Make a complaint</h2><p class="muted">Only that clinic's admin and the HealthPass admin will see it.</p>
      <select class="field" id="cc">${l.map(c=>`<option value="${c.id}">${c.name} • ${c.state}</option>`).join('')}</select>
      <textarea class="field" id="ct" style="min-height:120px" placeholder="What happened? e.g. I was charged more than the invoice amount."></textarea>
      <button class="btn primary" id="cs">Send complaint</button><button class="btn" onclick="closeSheet()">Cancel</button>`);
      
    $('#cs').onclick=async()=>{ 
      const t=$('#ct').value.trim(); 
      if(!t) return; 
      closeSheet(); 
      alert('Complaint sent successfully. Thank you.'); 
    }; 
  } catch (e) {
    alert('Could not load clinics to make a complaint.');
  }
}

async function logout(){ try{ await HealthPassAPI.logout(); }catch(e){} location.replace('login.html'); }
function addMoney(){ location.hash='#wallet'; }

// --- PAYSTACK INTEGRATION ---
async function topUp(a){
  if (a <= 0 || isNaN(a)) return alert('Please enter a valid amount.');
  
  const PAYSTACK_PUBLIC_KEY = 'pk_test_3deff19661c5a5977ea578a4f5b9d5dfc799888a'; // <--- PASTE YOUR KEY HERE
  
  let handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY, 
    email: me.email || 'patient@example.com',
    amount: a * 100, 
    currency: "NGN",
    ref: 'HP-' + Math.floor((Math.random() * 1000000000) + 1), 
    callback: function(response){
      fetch('http://localhost:5000/api/me/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('hp_token')
        },
        body: JSON.stringify({ reference: response.reference, amount: a })
      })
      .then(res => res.json())
      .then(data => {
        if(data.ok) {
          alert('Wallet funded successfully!');
          render(); 
        } else {
          alert('Verification failed: ' + data.message);
        }
      })
      .catch(() => alert('Network error verifying payment.'));
    },
    onClose: function(){}
  });
  handler.openIframe();
}

// --- PROFILE EDITING ---
async function editProfile() {
  sheet(`
    <h2>Edit Profile</h2>
    <label>Full Name</label>
    <input class="field" id="ep-name" value="${me.name}">
    
    <label>Phone Number</label>
    <input class="field" id="ep-phone" value="${me.phone}">
    
    <label>Email Address</label>
    <input class="field" id="ep-email" value="${me.email || ''}">
    
    <label>NIN (National Identity Number)</label>
    <input class="field" id="ep-nin" value="${me.nin || ''}" placeholder="Enter NIN">
    
    <label>Date of Birth</label>
    <input class="field" id="ep-dob" type="date" value="${me.dob}">
    
    <label>Gender</label>
    <select class="field" id="ep-gender">
      <option value="Female" ${me.gender === 'Female' ? 'selected' : ''}>Female</option>
      <option value="Male" ${me.gender === 'Male' ? 'selected' : ''}>Male</option>
    </select>

    <button class="btn primary" id="save-profile" style="margin-top: 16px;">Save Changes</button>
    <button class="btn" onclick="closeSheet()">Cancel</button>
  `);

  document.getElementById('save-profile').onclick = async () => {
    const updatedData = {
      name: document.getElementById('ep-name').value,
      phone: document.getElementById('ep-phone').value,
      email: document.getElementById('ep-email').value,
      nin: document.getElementById('ep-nin').value,
      dob: document.getElementById('ep-dob').value,
      gender: document.getElementById('ep-gender').value
    };

    try {
      await fetch('http://localhost:5000/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('hp_token')
        },
        body: JSON.stringify(updatedData)
      });
      alert('Profile updated successfully!');
      closeSheet();
      render(); 
    } catch (e) {
      alert('Failed to update profile');
    }
  };
}

// --- AI CHAT LOGIC ---
async function sendAIMessage(){
  const input = document.getElementById('ai-input');
  const msg = input.value.trim();
  if(!msg) return;
  
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML += `<div class="banner" style="background: #f1f5f9; align-self: flex-end; max-width: 80%;">${msg}</div>`;
  input.value = '';
  
  const loadingId = 'load-' + Date.now();
  chatBox.innerHTML += `<div id="${loadingId}" class="muted small">AI is typing...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('hp_token')
      },
      body: JSON.stringify({ message: msg, consentToStore: false })
    });
    const data = await res.json();
    
    document.getElementById(loadingId).remove();
    
    if (data.answer) {
      chatBox.innerHTML += `<div class="banner" style="background: #E6F4F1; color: var(--teal); max-width: 80%;">${data.answer}</div>`;
    } else if (data.message) {
      chatBox.innerHTML += `<div class="banner red">Error: ${data.message}</div>`;
    } else {
      chatBox.innerHTML += `<div class="banner red">Error: Could not get response</div>`;
    }
  } catch (e) {
    document.getElementById(loadingId).remove();
    chatBox.innerHTML += `<div class="banner red">Connection error. Is the server running?</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadClinics(){ 
  const q = $('#cq') ? $('#cq').value : '';
  const state = $('#cs') ? $('#cs').value : '';
  $('#clist').innerHTML = '<div class="muted small">Searching...</div>';

  try {
    const res = await fetch(`http://localhost:5000/api/ai/clinics?q=${q}&state=${state}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('hp_token') }
    });
    const data = await res.json();
    const l = data.clinics || []; 
    
    $('#clist').innerHTML = l.map(c=>`<div class="card" style="margin-bottom:10px"><b data-ic="hospital"> ${c.name}</b>${badge('ok','Verified clinic')}
      <p class="muted small" style="margin:6px 0">${c.address}, ${c.lga}, ${c.state} • <a href="tel:${c.phone.replace(/\s/g,'')}">${c.phone}</a></p>${(c.services||[]).map(s=>`<span class="tag">${s}</span>`).join('')}</div>`).join('') || empty('No clinic found. Try another name or state.');
  } catch(e) {
    $('#clist').innerHTML = '<div class="banner red">Could not load clinics.</div>';
  }
  hydrate($('#clist')); 
}

async function render(){
  const name = (location.hash||'#home').slice(1);
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+name||(name==='clinics'&&a.hash==='#home')));
  try{ me = await HealthPassAPI.getMe(); }catch(e){ return location.replace('login.html'); }
  try{ $('#view').innerHTML = await (views[name]||views.home)(); }catch(e){ $('#view').innerHTML='<div class="banner red">Could not load. Try again when online.</div>'; }
  hydrate();
  if(name==='clinics'){ loadClinics(); }
  if(name==='profile') $('#photo').onchange=e=>e.target.files[0]&&savePhoto(e.target.files[0]);
}

function savePhoto(file){ const img=new Image(); img.onload=async()=>{ const c=document.createElement('canvas'),s=256,r=Math.min(img.width,img.height);
  c.width=c.height=s; c.getContext('2d').drawImage(img,(img.width-r)/2,(img.height-r)/2,r,r,0,0,s,s);
  await HealthPassAPI.updateMe({photo:c.toDataURL('image/jpeg',.8)}); render(); }; img.src=URL.createObjectURL(file); }

let idle; const resetIdle = () => { clearTimeout(idle); idle = setTimeout(logout, 5*60*1000); };
['click','touchstart','keydown'].forEach(e => addEventListener(e, resetIdle)); resetIdle();

watchConnection(); addEventListener('hashchange', render); render();