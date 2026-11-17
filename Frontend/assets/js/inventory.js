(() => {
 const $=s=>document.querySelector(s), token=localStorage.getItem('hp_token');
 if(!token){location.href='../login.html';return;}
 const api=async(path,opts={})=>{const r=await fetch('/api/inventory'+path,{...opts,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,...opts.headers}});const d=await r.json();if(!r.ok)throw new Error(d.message||'Request failed');return d;};
 const notice=(m,bad=false)=>{$('#notice').textContent=m;$('#notice').style.color=bad?'#a33':'#28756a';};
 let items=[];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){
  try{const [list,rec]=await Promise.all([api('/items'),api('/recommendations')]);items=list;
   const low=list.filter(x=>x.stock<=x.reorderLevel).length, total=list.reduce((n,x)=>n+x.stock,0);
   $('#summary').innerHTML=`<div class="ai-card"><div class="ai-muted">Catalogue items</div><div class="ai-kpi">${list.length}</div></div><div class="ai-card"><div class="ai-muted">Total available units</div><div class="ai-kpi">${total}</div></div><div class="ai-card"><div class="ai-muted">At/below reorder level</div><div class="ai-kpi">${low}</div></div><div class="ai-card"><div class="ai-muted">Recommendations</div><div class="ai-kpi">${rec.recommendations.length}</div></div>`;
   $('#items').innerHTML=list.map(x=>`<tr><td><b>${esc(x.name)}</b><br><small>${esc(x.genericName||'')}</small></td><td>${esc(x.sku)}</td><td>${x.stock}</td><td>${x.reorderLevel}</td><td>${x.earliestExpiry?new Date(x.earliestExpiry).toLocaleDateString():'—'}</td></tr>`).join('')||'<tr><td colspan="5">No inventory items yet.</td></tr>';
   $('#receiveItem').innerHTML=list.map(x=>`<option value="${x._id}">${esc(x.name)} (${esc(x.sku)})</option>`).join('');
   $('#recommendations').innerHTML=rec.recommendations.map(x=>`<div class="ai-alert"><b>${esc(x.name)} — ${esc(x.action)}</b><br>Stock: ${x.stock} • 30-day use: ${x.usedLast30Days} • Estimated cover: ${x.estimatedDaysOfCover??'Not enough data'} days • Suggested quantity: ${x.suggestedQty}<br><small>${esc(x.method)}</small></div>`).join('')||'<p>No stock alerts at the moment.</p>';
   notice('Inventory refreshed '+new Date().toLocaleTimeString());
  }catch(e){notice(e.message,true);}
 }
 $('#itemForm').addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.reorderLevel=+d.reorderLevel;d.targetStock=+d.targetStock;try{await api('/items',{method:'POST',body:JSON.stringify(d)});e.target.reset();notice('Inventory item saved.');load();}catch(x){notice(x.message,true);}});
 $('#receiveForm').addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.quantity=+d.quantity;d.unitCost=+d.unitCost;d.idempotencyKey=crypto.randomUUID();try{await api('/receive',{method:'POST',body:JSON.stringify(d)});e.target.reset();notice('Batch receipt recorded.');load();}catch(x){notice(x.message,true);}});
 $('#refresh').addEventListener('click',load);load();
})();