/* portal.js – shared by the staff pages (/staff) and the admin console (/admin). */
const fmtTime = t => new Date(t).toLocaleString('en-NG',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
/* Page guard: returns the logged-in account, or sends the browser to the login page and never resolves. */
async function requireRole(roles, loginUrl){
  try{ const u = await HealthPassAPI.staffMe(); if(!roles.includes(u.role)) throw 0; return u; }
  catch(e){ location.replace(loginUrl); return new Promise(()=>{}); } }
const ROLE_LABEL = {admin:'Main admin', subadmin:'Clinic admin', staff:'Staff'};
const stBadge = s => badge({approved:'ok',pending:'warn',rejected:'bad',suspended:'bad'}[s]||'neutral', s[0].toUpperCase()+s.slice(1));
/* Login form shared by staff/index.html and admin/login.html. routes = {staff:'url', subadmin:'url', admin:'url'} */
function wireLogin(routes){
  const err = m => { $('#err').textContent=m; $('#err').classList.toggle('hidden',!m); };
  $('#f').onsubmit = async e => { e.preventDefault(); err('');
    try{ const u = await HealthPassAPI.staffLogin({username:$('#u').value, password:$('#p').value}); location.href = routes[u.role]; }
    catch(x){ err(x.message); } };
  $('#cbtn').onclick = () => $('#contact').classList.toggle('hidden');
  $('#csend').onclick = async () => { const t=$('#ctext').value.trim(); if(!t) return;
    await HealthPassAPI.contactAdmin({name:$('#cname').value.trim(),username:$('#cuser').value.trim(),clinicId:$('#cclinic').value.trim(),text:t});
    $('#contact').innerHTML='<div class="banner" style="background:#E6F4F1;color:var(--teal)">Message sent. The admin will review your request.</div>'; };
}
/* Table/stat/action helpers shared by the admin and clinic consoles */
const th = (...c) => '<tr>' + c.map(x=>`<th>${x}</th>`).join('') + '</tr>';
const stat = (t,v,s='') => `<div class="card"><span class="muted">${t}</span><b>${v}</b><span class="small muted">${s}</span></div>`;
const actions = (kind,id,st) => `<div class="acts">` + ({pending:[['approved','Approve','primary'],['rejected','Reject','danger']],approved:[['suspended','Suspend','danger']],suspended:[['approved','Reactivate','']],rejected:[['approved','Approve','']]}[st]||[])
  .map(([s,l,c])=>`<button class="btn sm ${c}" data-kind="${kind}" data-id="${id}" data-status="${s}">${l}</button>`).join('') + `</div>`;