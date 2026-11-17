/* common.js – helpers shared by every page */
const naira = n => '₦' + Number(n).toLocaleString('en-NG', {minimumFractionDigits:2});
const $ = (s, el=document) => el.querySelector(s);
const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
const BADGE_IC = {done:'checkc', ok:'checkc', due:'clock', warn:'clock', overdue:'alert', bad:'alert', neutral:'dot'};
/* Status badge: colour + icon + label together (accessibility rule from the design) */
const badge = (cls, text) => `<span class="badge ${cls}">${icon(BADGE_IC[cls]||'dot',15)} ${text}</span>`;
const initials = n => n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
/* hydrate(): turns data-ic="name" into icons and leading "→ " / "← " / "! " text into icons. Call after every render. */
function hydrate(root=document){
  root.querySelectorAll('[data-ic]:not([data-done])').forEach(e=>{e.dataset.done=1;e.insertAdjacentHTML('afterbegin',icon(e.dataset.ic,+e.dataset.s||20))});
  root.querySelectorAll('.btn,a,.banner,.muted,span').forEach(e=>{const t=e.firstChild;if(!t||t.nodeType!==3)return;
    const map={'→ ':'arrow','← ':'back','! ':'alert','🔒 ':'lock','💾 ':'wallet'};
    for(const k in map) if(t.nodeValue.startsWith(k)){t.nodeValue=t.nodeValue.slice(k.length);e.insertAdjacentHTML('afterbegin',icon(map[k],18));break}});
}
/* Offline banner: toggles body.offline and syncs queued writes on reconnect */
function watchConnection(){
  const set = () => document.body.classList.toggle('offline', !navigator.onLine);
  addEventListener('online', () => { set(); syncQueue(); }); addEventListener('offline', set); set();
}
document.addEventListener('DOMContentLoaded', () => hydrate());
 
/* emailVerify('#box'): email + "Send code" + code + "Verify". Returns {get()} -> the verified email, or '' if not verified yet.
   Used by patient, staff and clinic registration. The server emails the code (mock shows it on screen as "demo"). */
function emailVerify(box){
  const el = $(box); let ok = '';
  el.innerHTML = `<label>Email address *</label><div class="row"><input class="field" id="ev-e" type="email" autocapitalize="none" placeholder="name@example.com" style="flex:3"><button type="button" class="btn sm" id="ev-s" style="flex:1;align-self:stretch">Send code</button></div>
    <div id="ev-c" class="hidden"><label>Verification code</label><div class="row"><input class="field" id="ev-k" inputmode="numeric" maxlength="6" placeholder="6-digit code" style="flex:3"><button type="button" class="btn sm" id="ev-v" style="flex:1;align-self:stretch">Verify</button></div></div><p id="ev-m" class="small muted" style="margin-top:6px"></p>`;
  const msg = (t,c) => { const m=$('#ev-m',el); m.textContent=t; m.style.color=c||''; }, em = () => $('#ev-e',el).value.trim().toLowerCase();
  $('#ev-e',el).oninput = () => { ok=''; };
  $('#ev-s',el).onclick = async () => { if(!/^\S+@\S+\.\S+$/.test(em())) return msg('Enter a valid email address.','var(--red)');
    const r = await HealthPassAPI.sendEmailCode(em()); $('#ev-c',el).classList.remove('hidden'); msg('We sent a 6-digit code to '+em()+'.'+(r.demoCode?' (Demo mode: your code is '+r.demoCode+')':'')); };
  $('#ev-v',el).onclick = async () => { try{ await HealthPassAPI.verifyEmailCode(em(), $('#ev-k',el).value.trim()); ok = em(); msg('✓ Email verified','var(--teal)'); }catch(x){ msg(x.message,'var(--red)'); } };
  return {get:()=>ok};
}