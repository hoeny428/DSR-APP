
// ─── STORAGE ───────────────────────────────────────────────
const LSP='alpago_projects', LSR='alpago_reports', LPE='alpago_personnel';
function lp(){try{return JSON.parse(localStorage.getItem(LSP)||'[]')}catch{return[]}}
function sp(a){localStorage.setItem(LSP,JSON.stringify(a))}
function lr(){try{return JSON.parse(localStorage.getItem(LSR)||'{}')}catch{return{}}}
function sr(o){localStorage.setItem(LSR,JSON.stringify(o))}
function lpe(){try{return JSON.parse(localStorage.getItem(LPE)||'[]')}catch{return[]}}
function spe(a){localStorage.setItem(LPE,JSON.stringify(a))}
function getProjReports(pid){const a=lr();return(a[pid]||[]).sort((a,b)=>b.date.localeCompare(a.date))}
function upsertReport(pid,data){
  const all=lr(); if(!all[pid])all[pid]=[];
  const date=data.header.proj_date||today();
  const idx=all[pid].findIndex(r=>r.date===date);
  const entry={date,data,savedAt:new Date().toISOString()};
  if(idx>=0)all[pid][idx]=entry;else all[pid].push(entry);
  sr(all);
}
function delReport(pid,date){const a=lr();if(a[pid])a[pid]=a[pid].filter(r=>r.date!==date);sr(a)}

// ─── STATE ─────────────────────────────────────────────────
const SECS=['s0','s1','s2','s3','s4','s5','s6','s7','s8'];
let cur=0,emails=[],photoData={},activePid=null,viewPid=null;
let currentTab = 'analytics';

function initDummyData() {
  const projects = lp();
  if(projects.length > 0) return; // Only run if empty

  // 1. Create 5 Personnel
  const dummyPersonnel = [
    { name: "John Doe", role: "Project Manager", email: "john.doe@buildcorp.com", phone: "123-456-7890" },
    { name: "Jane Smith", role: "Site Engineer", email: "jane.smith@astra.com", phone: "123-456-7891" },
    { name: "Mike Johnson", role: "HSE Officer", email: "mike.j@pillar.com", phone: "123-456-7892" },
    { name: "Emily Brown", role: "QA/QC", email: "emily.b@summit.com", phone: "123-456-7893" },
    { name: "Chris Wilson", role: "Foreman", email: "chris.w@delta.com", phone: "123-456-7894" }
  ];
  spe(dummyPersonnel);

  // 2. Create 1 Project
  const dummyProject = {
    id: 'proj_dummy_1',
    name: "City Center Highrise",
    refId: "PRJ-2026-001",
    client: "Global Estates",
    loc: "Downtown Core",
    contractor: "BuildCorp",
    consultant: "Astra Projects",
    preparedBy: "Jane Smith",
    reviewedBy: "John Doe",
    hours: "08:00 - 17:00",
    emails: ["john.doe@buildcorp.com"],
    createdAt: new Date().toISOString()
  };
  sp([dummyProject]);

  // 3. Create 5-6 Daily Reports
  const companies = ["BuildCorp", "Astra Projects", "Pillar Construct", "Summit Infra", "Delta Builders"];
  const machineries = ["Excavator", "Tower Crane", "Dump Truck", "Bulldozer", "Concrete Mixer"];
  
  const allReports = {};
  allReports[dummyProject.id] = [];

  for(let i=5; i>=0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    let dateStr = d.toISOString().split('T')[0];
    
    // Generate random manpower and equipment for this day
    let manpowerData = [];
    let equipmentData = [];
    
    companies.forEach(comp => {
      let planned = Math.floor(Math.random() * 50) + 10;
      let actual = Math.floor(planned * (0.8 + Math.random() * 0.3)); // 80% to 110% of planned
      manpowerData.push([comp, planned, actual, "All Zones", "0", "Normal Ops"]);
    });

    machineries.forEach(mach => {
      let qty = Math.floor(Math.random() * 5) + 1;
      equipmentData.push([mach, qty, "Zone A", "None"]);
    });

    let report = {
      date: dateStr,
      savedAt: new Date().toISOString(),
      data: {
        header: {
          proj_name: dummyProject.name,
          proj_loc: dummyProject.loc,
          proj_date: dateStr,
          proj_shift: "Day"
        },
        manpower: manpowerData,
        equipment: equipmentData
      }
    };
    allReports[dummyProject.id].push(report);
  }
  
  sr(allReports);
}

// ─── INIT ──────────────────────────────────────────────────
(function(){
  document.getElementById('today-badge').textContent=fmtDate(today());
  document.querySelectorAll('.nav-tab').forEach((t,i)=>t.addEventListener('click',()=>jumpTo(i)));
  document.getElementById('new-email').addEventListener('keydown',e=>{if(e.key==='Enter')addEmail()});
  document.getElementById('np-name').addEventListener('keydown',e=>{if(e.key==='Enter')createProject()});
  document.querySelectorAll('.modal-backdrop').forEach(bd=>bd.addEventListener('click',e=>{if(e.target===bd)bd.classList.add('hidden')}));
  switchMainTab('analytics');
  initDummyData();
  checkSetup();
})();

function switchMainTab(tabId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + tabId).classList.add('active');
  document.getElementById('tab-btn-' + tabId).classList.add('active');
  currentTab = tabId;
  
  if(tabId === 'home') renderHome();
  if(tabId === 'analytics') renderGlobalDashboard();
  if(tabId === 'personnel') renderPersonnel();
  if(tabId === 'reports') renderGlobalReports();
}

function today(){return new Date().toISOString().split('T')[0]}
function fmtDate(iso){if(!iso)return'';const[y,m,d]=iso.split('-');const mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return`${d} ${mn[parseInt(m)-1]} ${y}`}

// ─── HOME ──────────────────────────────────────────────────
// ─── PERSONNEL LOGIC ───────────────────────────────────────
function renderPersonnel() {
  const pList = lpe();
  const list = document.getElementById('personnel-list');
  if(!pList.length) {
    list.innerHTML = '<div class="empty-state"><div>👥</div><strong>No Personnel added</strong><br>Add team members to easily include them in report distributions.</div>';
    return;
  }
  list.innerHTML = pList.map((p, i) => `
    <div class="personnel-card">
      <button class="personnel-del" onclick="deletePersonnel(${i})">✖</button>
      <h4>${p.name} <span style="font-size:11px;font-weight:400;color:var(--muted)">(${p.role})</span></h4>
      <p>✉️ ${p.email || 'N/A'}</p>
      <p>📞 ${p.phone || 'N/A'}</p>
    </div>
  `).join('');
}

function savePersonnel() {
  const name = document.getElementById('per-name').value.trim();
  const role = document.getElementById('per-role').value;
  const email = document.getElementById('per-email').value.trim();
  const phone = document.getElementById('per-phone').value.trim();
  if(!name) return toast('Name is required');
  const pList = lpe();
  pList.push({ name, role, email, phone });
  spe(pList);
  document.getElementById('per-name').value = '';
  document.getElementById('per-email').value = '';
  document.getElementById('per-phone').value = '';
  document.getElementById('modal-personnel').classList.add('hidden');
  renderPersonnel();
  toast('Personnel added');
}

function deletePersonnel(idx) {
  if(!confirm('Delete this contact?')) return;
  const pList = lpe();
  pList.splice(idx, 1);
  spe(pList);
  renderPersonnel();
}

// ─── GLOBAL REPORTS LOGIC ──────────────────────────────────
function renderGlobalReports() {
  const projects = lp();
  const allReports = lr();
  const list = document.getElementById('global-reports-list');
  
  let flat = [];
  projects.forEach(p => {
    const projReports = allReports[p.id] || [];
    projReports.forEach(r => {
      flat.push({ ...r, projName: p.name, pid: p.id });
    });
  });
  flat.sort((a,b) => b.date.localeCompare(a.date));
  
  if(!flat.length) {
    list.innerHTML = '<div class="empty-state"><div>📋</div><strong>No reports found</strong><br>Create reports in your projects to see them here.</div>';
    return;
  }
  
  list.innerHTML = flat.map(r => {
    let mpCount = 0;
    (r.data.manpower||[]).forEach(row => mpCount += Number(row[2]||0));
    return `
    <div class="dsr-item">
      <div class="dsr-item-inner" onclick="openExistingDSR('${r.pid}', '${r.date}')">
        <div>
          <div class="dsr-date">${fmtDate(r.date)} <span style="font-size:11px;font-weight:400;color:var(--muted)">• ${r.projName}</span></div>
          <div class="dsr-sub">Manpower: ${mpCount}</div>
        </div>
        <div class="dsr-badge">${r.data.header?.proj_shift || 'Day'}</div>
      </div>
    </div>`;
  }).join('');
}

function renderHome(){
  const projects=lp();
  const list=document.getElementById('proj-list');
  if(!projects.length){
    list.innerHTML='<div class="empty-state"><div>🏗️</div><strong>No projects yet</strong><br>Create your first project to start generating Daily Site Reports.</div>';
    document.getElementById('quick-dsr-wrap').style.display='none';
    return;
  }
  list.innerHTML=projects.map(p=>{
    const reports=getProjReports(p.id);
    const last=reports.length?reports[0].date:null;
    const init=(p.name||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    return`<div class="proj-card" onclick="openHistory('${p.id}')">
      <button class="proj-del-btn" onclick="event.stopPropagation();deleteProjConfirm('${p.id}')" aria-label="Delete">🗑</button>
      <div class="proj-card-top">
        <div class="proj-avatar">${init}</div>
        <div class="proj-card-info">
          <div class="proj-card-name">${p.name}</div>
          <div class="proj-card-sub">${p.refId?p.refId+' · ':''}${p.loc||'No location set'}</div>
        </div>
      </div>
      <div class="proj-card-meta" style="margin-bottom: 10px;">
        <span class="mpill">${reports.length} DSR${reports.length!==1?'s':''}</span>
        ${last?`<span class="mpill green">Last: ${fmtDate(last)}</span>`:'<span class="mpill">No reports yet</span>'}
        ${p.client?`<span class="mpill">${p.client}</span>`:''}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="fab" style="margin-top:0;flex:1;background:var(--navy);font-size:12px;padding:10px" onclick="event.stopPropagation();openHistory('${p.id}')">📂 View All Reports (${reports.length})</button>
      </div>
    </div>`;
  }).join('');
  document.getElementById('quick-dsr-wrap').style.display='block';
}
function goHome(){
  document.getElementById('screen-dsr').classList.remove('active');
  const planScreen = document.getElementById('screen-plan');
  if(planScreen) planScreen.classList.remove('active');
  document.getElementById('screen-home').classList.add('active');
  renderHome();
}

// ─── PROJECT CRUD ─────────────────────────────────────────
function openNewProjectModal(){
  ['np-name','np-id','np-client','np-loc','np-contractor','np-consultant','np-preparedby','np-reviewedby'].forEach(id=>{document.getElementById(id).value=''});
  document.getElementById('np-hours').value='08:00 - 17:00';
  showModal('modal-new-project');
  setTimeout(()=>document.getElementById('np-name').focus(),250);
}
function createProject(){
  const name=document.getElementById('np-name').value.trim();
  if(!name){toast('Enter a project name');return}
  const p={
    id:'proj_'+Date.now(),name,
    refId:document.getElementById('np-id').value.trim(),
    client:document.getElementById('np-client').value.trim(),
    loc:document.getElementById('np-loc').value.trim(),
    contractor:document.getElementById('np-contractor').value.trim(),
    consultant:document.getElementById('np-consultant').value.trim(),
    preparedBy:document.getElementById('np-preparedby').value.trim(),
    reviewedBy:document.getElementById('np-reviewedby').value.trim(),
    hours:document.getElementById('np-hours').value.trim()||'08:00 - 17:00',
    emails:['operations@alpago.ae','pm@alpago.ae'],
    createdAt:new Date().toISOString()
  };
  const arr=lp(); arr.push(p); sp(arr);
  closeModal('modal-new-project');
  renderHome();
  toast('Project created');
  setTimeout(()=>openHistory(p.id),400);
}
function deleteProjConfirm(pid){
  if(!confirm('Delete this project and all its DSRs? Cannot be undone.'))return;
  sp(lp().filter(p=>p.id!==pid));
  const a=lr(); delete a[pid]; sr(a);
  renderHome(); toast('Project deleted');
}

// ─── HISTORY MODAL ────────────────────────────────────────
function openHistory(pid){
  viewPid=pid;
  const proj=lp().find(p=>p.id===pid);
  if(!proj)return;
  document.getElementById('history-title').textContent=proj.name;
  const reports=getProjReports(pid);
  const c=document.getElementById('dsr-history-list');
  if(!reports.length){
    c.innerHTML='<div class="empty-state"><div>📋</div>No DSRs yet.<br>Tap "New DSR for Today" to start.</div>';
  } else {
    c.innerHTML=reports.map(r=>{
      const mp=(r.data.manpower||[]).length;
      const pr=(r.data.progress||[]).length;
      return`<div class="dsr-item">
        <div class="dsr-item-inner" onclick="openExistingDSR('${pid}','${r.date}')">
          <div>
            <div class="dsr-date">${fmtDate(r.date)}</div>
            <div class="dsr-sub">${mp} manpower · ${pr} progress · ${(r.data.header||{}).proj_shift||'Day'} shift · Saved ${r.savedAt?r.savedAt.substring(11,16):''}</div>
          </div>
          <span class="dsr-badge">Open ›</span>
        </div>
        <button class="dsr-del" onclick="event.stopPropagation();delReportConfirm('${pid}','${r.date}')" aria-label="Delete">🗑</button>
      </div>`;
    }).join('');
  }
  showModal('modal-history');
}
function delReportConfirm(pid,date){
  if(!confirm('Delete DSR for '+fmtDate(date)+'?'))return;
  delReport(pid,date); openHistory(pid); toast('DSR deleted');
}

// ─── OPEN DSR ─────────────────────────────────────────────
function openExistingDSR(pid,date){
  closeModal('modal-history');
  const r=getProjReports(pid).find(x=>x.date===date);
  if(!r)return;
  activePid=pid;
  loadIntoForm(r.data,pid);
  openDSRScreen(pid);
}
function startNewDSR(){
  closeModal('modal-history');
  activePid=viewPid;
  const reports=getProjReports(activePid);
  const prev=reports.length?reports[0]:null;
  if(prev){
    loadIntoForm(prev.data, activePid);
    gv('proj_date', today());
    document.getElementById('carryover-wrap').innerHTML=`
      <div class="carryover-banner">
        <div class="carryover-icon">🔄</div>
        <div class="carryover-text">
          <strong>Copied from ${fmtDate(prev.date)}</strong><br>
          All data from the previous report has been kept. Please update today's progress, actuals, and issues before saving.
        </div>
      </div>`;
  } else {
    const proj=lp().find(p=>p.id===activePid);
    clearForm(); resetTables();
    if(proj){
      gv('proj_name',proj.refId?(proj.refId+' - Daily Site Report'):proj.name);
      gv('proj_loc',proj.loc||'');
      gv('client',proj.client||'');
      gv('consultant',proj.consultant||'');
      gv('contractor',proj.contractor||'');
      gv('prepared_by',proj.preparedBy||'');
      gv('reviewed_by',proj.reviewedBy||'');
      gv('hours',proj.hours||'08:00 - 17:00');
      emails=proj.emails?[...proj.emails]:[];
    }
    gv('proj_date',today());
    renderEmails();
    addRow('manpower'); addRow('manpower'); addRow('manpower');
    addRow('equipment'); addRow('equipment');
    addRow('progress'); addRow('progress');
    addRow('issues'); addRow('tomorrow'); addRow('tomorrow');
    document.getElementById('carryover-wrap').innerHTML='';
    buildPhotoGrid();
  }
  openDSRScreen(activePid);
}
function openQuickDSR(){
  const ps=lp(); if(!ps.length)return;
  viewPid=ps[ps.length-1].id; startNewDSR();
}
function openDSRScreen(pid){
  const proj=lp().find(p=>p.id===pid);
  document.getElementById('dsr-topbar-title').textContent=proj?proj.name:'Daily Site Report';
  document.getElementById('dsr-topbar-sub').textContent=proj?(proj.refId||getCompany()):getCompany();
  document.getElementById('screen-home').classList.remove('active');
  document.getElementById('screen-dsr').classList.add('active');
  cur=0; jumpTo(0); updateTotals();
}
function loadIntoForm(data,pid){
  clearForm(); resetTables();
  const h=data.header||{};
  const flds={proj_name:h.proj_name,proj_loc:h.proj_loc,proj_date:h.proj_date,proj_shift:h.proj_shift,
    client:h.client,consultant:h.consultant,contractor:h.contractor,weather:h.weather,hours:h.hours,
    prepared_by:h.prepared_by,reviewed_by:h.reviewed_by,distribution:h.distribution,doc_ref:h.doc_ref,
    exec1:(data.summary||{}).exec1,exec2:(data.summary||{}).exec2,exec3:(data.summary||{}).exec3};
  Object.entries(flds).forEach(([k,v])=>{ const el=document.getElementById(k); if(el&&v!==undefined) el.value=v||''; });
  (data.manpower||[]).forEach(r=>addRowWithData('manpower',r));
  (data.equipment||[]).forEach(r=>addRowWithData('equipment',r));
  (data.progress||[]).forEach(r=>addRowWithData('progress',r));
  (data.materials||[]).forEach(r=>addRowWithData('materials',r));
  (data.issues||[]).forEach(r=>addRowWithData('issues',r));
  (data.tomorrow||[]).forEach(r=>addRowWithData('tomorrow',r));
  const proj=lp().find(p=>p.id===pid);
  emails=data.emails&&data.emails.length?[...data.emails]:(proj&&proj.emails?[...proj.emails]:[]);
  document.getElementById('carryover-wrap').innerHTML='';
  buildPhotoGrid();
  if(data.captions && data.captions.length > 0){
    while(photoCount < data.captions.length) addPhotoSlot();
    data.captions.forEach((cap, idx)=>{
      const el = ge('pc'+(idx+1));
      if(el) el.value = cap || '';
    });
  }
  renderEmails();
}

// ─── SAVE ──────────────────────────────────────────────────
function saveDSR(){
  if(!activePid){toast('No active project');return}
  const data=collectData();
  const date=data.header.proj_date||today();
  const projReports = lr()[activePid] || [];
  const exists = projReports.some(r => r.date === date);
  if (!exists) {
    const total = Object.values(lr()).reduce((acc, arr) => acc + arr.length, 0);
    if (total >= 50) {
      alert("You have reached the maximum limit of 50 reports. Please delete old reports to create new ones.");
      return;
    }
  }
  upsertReport(activePid,data);
  // persist email list back to project
  const arr=lp(); const idx=arr.findIndex(p=>p.id===activePid);
  if(idx>=0){arr[idx].emails=[...emails];sp(arr);}
  toast('DSR saved to project ✓');
}

// ─── HELPERS ──────────────────────────────────────────────
function getCompany() { return localStorage.getItem('company_name') || 'Your Company'; }
function checkSetup() {
  const c = localStorage.getItem('company_name');
  if (!c) { showModal('modal-setup'); }
  else { updateCompanyUI(c); }
}
function saveSetup() {
  const c = ge('setup-company').value.trim();
  if (!c) { toast('Please enter a company name'); return; }
  localStorage.setItem('company_name', c);
  updateCompanyUI(c);
  closeModal('modal-setup');
}
function updateCompanyUI(c) {
  const h1 = ge('home-company-name'); if(h1) h1.textContent = c;
  const h2 = ge('dsr-topbar-sub'); if(h2 && !activePid) h2.textContent = c;
}
function editCompany() {
  const c = prompt('Enter your company name:', localStorage.getItem('company_name') || '');
  if (c !== null && c.trim() !== '') {
    localStorage.setItem('company_name', c.trim());
    updateCompanyUI(c.trim());
  }
}
function ge(id){return document.getElementById(id)}
function gv(id,val){const el=ge(id);if(el)el.value=val||''}
function clearForm(){
  ['proj_name','proj_loc','proj_date','client','consultant','contractor','hours',
   'prepared_by','reviewed_by','distribution','doc_ref','exec1','exec2','exec3'].forEach(id=>gv(id,''));
  gv('proj_date',today()); gv('proj_shift','Day'); gv('weather','Hot'); photoData={};
}
function resetTables(){
  ['manpower','equipment','progress','materials','issues','tomorrow'].forEach(t=>ge(t+'-body').innerHTML='');
}

// ─── NAVIGATION ───────────────────────────────────────────
function jumpTo(i){
  document.querySelectorAll('.nav-tab')[cur].classList.remove('active');
  ge(SECS[cur]).classList.remove('active');
  cur=Math.max(0,Math.min(SECS.length-1,i));
  document.querySelectorAll('.nav-tab')[cur].classList.add('active');
  ge(SECS[cur]).classList.add('active');
  ge('prev-btn').style.visibility=cur===0?'hidden':'visible';
  ge('next-btn').textContent=cur===SECS.length-1?'Done':'Next →';
  updateProg(); if(cur===8)updatePreview(); window.scrollTo(0,0);
  document.querySelectorAll('.nav-tab')[cur].scrollIntoView({behavior:'smooth',inline:'nearest',block:'nearest'});
}
function navigate(d){ if(d===1 && cur===SECS.length-1) { saveDSR(); goHome(); } else jumpTo(cur+d); }
function updateProg(){ge('prog-bar').innerHTML=SECS.map((_,i)=>`<div class="prog-seg ${i<cur?'done':i===cur?'active':''}"></div>`).join('')}

// ─── TOAST ────────────────────────────────────────────────
let _tt;
function toast(msg,d=2800){clearTimeout(_tt);const el=ge('toast');el.textContent=msg;el.classList.add('show');_tt=setTimeout(()=>el.classList.remove('show'),d)}

// ─── TABLE ROWS ───────────────────────────────────────────
function inp(ph,w=''){return`<input type="text" placeholder="${ph}" style="min-width:${w}px">`}
function num(ph){return`<input type="number" placeholder="${ph}" min="0" style="min-width:50px" oninput="updateTotals()">`}
function di(){return`<input type="date" style="min-width:110px">`}
function sel(...o){return`<select style="min-width:80px">${o.map(x=>`<option>${x}</option>`).join('')}</select>`}
const TPLS={
  manpower:()=>`<td>${inp('Company / trade',120)}</td><td>${num('0')}</td><td>${num('0')}</td><td>${inp('Zone',70)}</td><td>${num('0')}</td><td>${inp('Notes',80)}</td><td><button class="del-btn" onclick="delRow(this)">x</button></td>`,
  equipment:()=>`<td>${inp('Equipment name',110)}</td><td>${num('0')}</td><td>${inp('Zone',70)}</td><td>${inp('Downtime / issue',110)}</td><td><button class="del-btn" onclick="delRow(this)">x</button></td>`,
  progress:()=>`<td>${inp('Zone',80)}</td><td>${inp('Activity',120)}</td><td>${inp('Planned',60)}</td><td>${inp('Actual + units',80)}</td><td>${inp('Remarks',110)}</td><td><button class="del-btn" onclick="delRow(this)">x</button></td>`,
  materials:()=>`<td>${inp('Item',90)}</td><td>${inp('Required for',90)}</td><td>${di()}</td><td>${inp('Qty / desc',80)}</td><td>${sel('OK','Delay')}</td><td>${inp('Impact',90)}</td><td>${inp('Owner',70)}</td><td><button class="del-btn" onclick="delRow(this)">x</button></td>`,
  issues:()=>`<td>${sel('Issue','Risk','Action')}</td><td>${inp('Description',130)}</td><td>${inp('Time/Cost/Quality/HSE',100)}</td><td>${inp('Owner',70)}</td><td>${di()}</td><td>${sel('Open','In Progress','Closed')}</td><td><button class="del-btn" onclick="delRow(this)">x</button></td>`,
  tomorrow:()=>`<td>${inp('Zone',80)}</td><td>${inp('Activity',120)}</td><td>${inp('Target qty',80)}</td><td>${inp('Crew/trade',80)}</td><td>${inp('Notes',90)}</td><td><button class="del-btn" onclick="delRow(this)">x</button></td>`,
  plan:()=>`<td>${inp('Task name',120)}</td><td>${inp('Assignee',80)}</td><td>${di()}</td><td>${di()}</td><td>${sel('Not Started','In Progress','Completed','On Hold')}</td><td>${num('0')}</td><td>${inp('Notes',100)}</td><td><button class="del-btn" onclick="delRow(this)">x</button></td>`
};
function addRow(type){const tr=document.createElement('tr');tr.innerHTML=TPLS[type]();ge(type+'-body').appendChild(tr)}
function addRowWithData(type,vals){
  const tr=document.createElement('tr');tr.innerHTML=TPLS[type]();ge(type+'-body').appendChild(tr);
  const inputs=[...tr.querySelectorAll('input,select')];
  (vals||[]).forEach((v,i)=>{if(inputs[i]&&v!==undefined)inputs[i].value=v||''});
  updateTotals();
}
function delRow(btn){btn.closest('tr').remove();updateTotals()}
function updateTotals(){
  let p=0,a=0;
  document.querySelectorAll('#manpower-body tr').forEach(tr=>{const n=tr.querySelectorAll('input[type="number"]');p+=parseFloat(n[0]?.value||0)||0;a+=parseFloat(n[1]?.value||0)||0});
  const mtp=ge('mp-tp'),mta=ge('mp-ta');if(mtp)mtp.textContent=p;if(mta)mta.textContent=a;
  let q=0;document.querySelectorAll('#equipment-body tr').forEach(tr=>{const n=tr.querySelectorAll('input[type="number"]');q+=parseFloat(n[0]?.value||0)||0});
  const eqt=ge('eq-tq');if(eqt)eqt.textContent=q;
}

// ─── PHOTOS ───────────────────────────────────────────────
let photoCount = 0;
function buildPhotoGrid(){
  const grid=ge('photo-grid');grid.innerHTML='';photoData={};photoCount=0;
  for(let i=0;i<4;i++) addPhotoSlot();
}
function addPhotoSlot(){
  photoCount++;
  const i = photoCount;
  const grid=ge('photo-grid');
  const item=document.createElement('div');item.className='photo-item';
  const slot=document.createElement('div');slot.className='photo-slot';slot.id='ps'+i;
  const fiCam=document.createElement('input');fiCam.type='file';fiCam.accept='image/*';fiCam.capture='environment';
  const fiGal=document.createElement('input');fiGal.type='file';fiGal.accept='image/*';
  
  const handleFile = function(){
    if(this.files&&this.files[0]){
      const reader=new FileReader();
      reader.onload=e=>{
        photoData[i]=e.target.result;
        const oldDef=slot.querySelector('.ps-default');if(oldDef)oldDef.style.display='none';
        const old=slot.querySelector('img');if(old)old.remove();
        const img=document.createElement('img');img.src=e.target.result;
        img.onclick = (ev) => { 
          ev.stopPropagation();
          const d=slot.querySelector('.ps-default');if(d)d.style.display='flex'; 
          img.remove(); 
          delete photoData[i]; 
        };
        slot.appendChild(img);
      };reader.readAsDataURL(this.files[0]);
    }
  };
  fiCam.addEventListener('change', handleFile);
  fiGal.addEventListener('change', handleFile);

  const defState = document.createElement('div'); defState.className = 'ps-default';
  const icon = document.createElement('div'); icon.className = 'ps-icon'; icon.textContent = '📷';
  const lbl = document.createElement('div'); lbl.className = 'ps-lbl'; lbl.textContent = 'Add Photo ' + i;
  defState.appendChild(icon); defState.appendChild(lbl);

  const dropdown = document.createElement('div'); dropdown.className = 'ps-dropdown';
  const btnCam = document.createElement('button'); btnCam.innerHTML = '📷 Camera';
  const btnGal = document.createElement('button'); btnGal.innerHTML = '🖼️ Gallery';
  
  btnCam.onclick = (e) => { e.stopPropagation(); dropdown.style.display = 'none'; fiCam.click(); };
  btnGal.onclick = (e) => { e.stopPropagation(); dropdown.style.display = 'none'; fiGal.click(); };
  dropdown.appendChild(btnCam); dropdown.appendChild(btnGal);

  slot.onclick = (e) => {
    if(!photoData[i]) {
      dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    }
  };

  slot.appendChild(fiCam);slot.appendChild(fiGal);slot.appendChild(defState);slot.appendChild(dropdown);
  const cap=document.createElement('input');cap.type='text';cap.className='photo-caption';cap.placeholder='Caption for photo '+i;cap.id='pc'+i;
  item.appendChild(slot);item.appendChild(cap);grid.appendChild(item);
}

// ─── EMAILS ───────────────────────────────────────────────
function renderEmails(){
  ge('email-tags').innerHTML=emails.map((e,i)=>`<span class="email-tag">${e}<button onclick="removeEmail(${i})">x</button></span>`).join('');
  const qa = ge('quick-add-personnel');
  if(qa) {
    qa.innerHTML = lpe().filter(p => p.email && !emails.includes(p.email)).map(p => 
      `<button class="mpill" style="cursor:pointer;border:1px solid var(--border)" onclick="addQuickEmail('${p.email}')">+ ${p.name} (${p.role})</button>`
    ).join('');
  }
}
function addQuickEmail(email){ if(!emails.includes(email)){ emails.push(email); renderEmails(); toast('Email added'); } }
function addEmail(){const inp=ge('new-email');const val=inp.value.trim().toLowerCase();if(!val||!val.includes('@')||!val.includes('.')){toast('Enter a valid email');return}if(emails.includes(val)){toast('Already in list');return}emails.push(val);renderEmails();inp.value='';toast('Email added')}
function removeEmail(i){emails.splice(i,1);renderEmails()}

// ─── COLLECT DATA ─────────────────────────────────────────
function collectRows(tbodyId){const rows=[];document.querySelectorAll('#'+tbodyId+' tr').forEach(tr=>{rows.push([...tr.querySelectorAll('input,select')].map(el=>el.value))});return rows}
function collectData(){
  const gv=id=>ge(id)?ge(id).value:'';
  return{
    header:{proj_name:gv('proj_name'),proj_loc:gv('proj_loc'),proj_date:gv('proj_date'),proj_shift:gv('proj_shift'),client:gv('client'),consultant:gv('consultant'),contractor:gv('contractor'),weather:gv('weather'),hours:gv('hours'),prepared_by:gv('prepared_by'),reviewed_by:gv('reviewed_by'),distribution:gv('distribution'),doc_ref:gv('doc_ref')},
    summary:{exec1:gv('exec1'),exec2:gv('exec2'),exec3:gv('exec3')},
    manpower:collectRows('manpower-body'),equipment:collectRows('equipment-body'),
    progress:collectRows('progress-body'),materials:collectRows('materials-body'),
    issues:collectRows('issues-body'),tomorrow:collectRows('tomorrow-body'),
    captions:Array.from({length: photoCount}, (_, idx)=>{const el=ge('pc'+(idx+1));return el?el.value:''}),
    emails:[...emails]
  };
}

// ─── PREVIEW ──────────────────────────────────────────────
function updatePreview(){
  const d=collectData();
  ge('preview-summary').innerHTML=[
    ['Project',d.header.proj_name||'—'],['Date / Shift',(d.header.proj_date||'—')+' · '+d.header.proj_shift],
    ['Location',d.header.proj_loc||'—'],['Client',d.header.client||'—'],['Prepared by',d.header.prepared_by||'—'],
    ['Manpower rows',document.querySelectorAll('#manpower-body tr').length],
    ['Progress rows',document.querySelectorAll('#progress-body tr').length],
    ['Issues / risks',document.querySelectorAll('#issues-body tr').length],
    ["Tomorrow's tasks",document.querySelectorAll('#tomorrow-body tr').length],
    ['Photos attached',Object.keys(photoData).length],
    ['Distribution',emails.length+' email'+(emails.length!==1?'s':'')],
  ].map(([k,v])=>`<div class="preview-row"><span>${k}</span><span class="preview-val">${v}</span></div>`).join('');
}

// ─── MODAL HELPERS ────────────────────────────────────────
function showModal(id){ge(id).classList.remove('hidden')}
function closeModal(id){ge(id).classList.add('hidden')}

// ─── PROJECT PLAN ─────────────────────────────────────────
function openProjectPlan(){
  closeModal('modal-history');
  activePid=viewPid;
  const proj=lp().find(p=>p.id===activePid);
  document.getElementById('plan-topbar-sub').textContent=proj?proj.name:'';
  document.getElementById('screen-home').classList.remove('active');
  document.getElementById('screen-dsr').classList.remove('active');
  document.getElementById('screen-plan').classList.add('active');
  ge('plan-body').innerHTML='';
  if(proj && proj.plan && proj.plan.length){
    proj.plan.forEach(r=>addRowWithData('plan',r));
  }else{
    addRow('plan'); addRow('plan'); addRow('plan');
  }
}
function saveProjectPlan(){
  const rows = collectRows('plan-body');
  const arr = lp();
  const idx = arr.findIndex(p=>p.id===activePid);
  if(idx>=0){
    arr[idx].plan = rows;
    sp(arr);
    toast('Project plan saved ✓');
  }
}
function addPlanRow(){addRow('plan')}
function importPlanExcel(e){
  const file = e.target.files[0];
  if(!file)return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const data = evt.target.result;
    const wb = XLSX.read(data, {type: 'binary'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, {header:1, raw:false, dateNF:'yyyy-mm-dd'});
    if(json.length > 1){
      ge('plan-body').innerHTML='';
      for(let i=1; i<json.length; i++){
        const row = json[i];
        if(!row.length) continue;
        const vals = [row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'Not Started', row[5]||'', row[6]||''];
        addRowWithData('plan', vals);
      }
      toast('Imported '+ (json.length-1) +' tasks');
    }
  };
  reader.readAsBinaryString(file);
  e.target.value = '';
}
function exportPlanExcel(){
  try {
    const proj = lp().find(p=>p.id===activePid);
    const rows = collectRows('plan-body');
    const wb = XLSX.utils.book_new();
    const data = [['Task Name', 'Assignee', 'Start Date', 'End Date', 'Status', 'Progress (%)', 'Notes']];
    rows.forEach(r=>data.push(r));
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols']=[25,15,15,15,15,15,30].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws, 'Project Plan');
    XLSX.writeFile(wb, 'Plan_' + (proj?proj.name:'Project') + '.xlsx');
    toast('Excel downloaded');
  } catch(e) {
    console.error(e); toast('Export failed');
  }
}

// ─── EXPORT: EXCEL ────────────────────────────────────────
function exportExcel(){
  try{
    const d=collectData(),wb=XLSX.utils.book_new();
    const navy='000000';
    const H=t=>({v:String(t).toUpperCase(),t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}},alignment:{horizontal:'center'}}});
    const T=t=>({v:t||'',t:'s'});const B=t=>({v:t||'',t:'s',s:{font:{bold:true}}});
    const rows=[];
    rows.push([{v:`${getCompany().toUpperCase()} — DAILY SITE REPORT (DSR)`,t:'s',s:{font:{bold:true,sz:13,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}},alignment:{horizontal:'center'}}},'','','','','','','']);
    rows.push([B('Project Name/ID'),T(d.header.proj_name),'',B('Location / Zone'),T(d.header.proj_loc),'',B('Date'),T(d.header.proj_date)]);
    rows.push([B('Client'),T(d.header.client),'',B('Consultant'),T(d.header.consultant),'',B('Shift'),T(d.header.proj_shift)]);
    rows.push([B('Contractor'),T(d.header.contractor),'',B('Weather'),T(d.header.weather),'',B('Working Hours'),T(d.header.hours)]);
    rows.push([B('Prepared By'),T(d.header.prepared_by),'',B('Reviewed By'),T(d.header.reviewed_by),'',B('Distribution'),T(d.header.distribution)]);
    rows.push([B('Doc. Ref #'),T(d.header.doc_ref),'','','','','','']);rows.push([]);
    rows.push([{v:'EXECUTIVE SUMMARY',t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}}}}]);
    rows.push([B('1) Key achieved today'),T(d.summary.exec1)]);rows.push([B('2) Main blocker / delay'),T(d.summary.exec2)]);rows.push([B('3) Critical note / escalation'),T(d.summary.exec3)]);rows.push([]);
    rows.push([{v:'MANPOWER & PLANT',t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}}}}]);
    rows.push(['Trade / Company','Planned','Actual','Area/Zone','OT Hours','Notes','Equipment','Qty','Area/Zone','Downtime'].map(H));
    const mm=Math.max(d.manpower.length,d.equipment.length);
    for(let i=0;i<mm;i++){const mp=d.manpower[i]||['','','','','',''];const eq=d.equipment[i]||['','','',''];rows.push([T(mp[0]),T(mp[1]),T(mp[2]),T(mp[3]),T(mp[4]),T(mp[5]),T(eq[0]),T(eq[1]),T(eq[2]),T(eq[3])]);}
    rows.push([]);
    rows.push([{v:'WORK PROGRESS TODAY',t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}}}}]);
    rows.push(['Area/Zone','Activity','Planned Today','Actual Today','Remarks'].map(H));
    d.progress.forEach(r=>rows.push(r.map(T)));rows.push([]);
    rows.push([{v:'MATERIALS / DELIVERIES',t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}}}}]);
    rows.push(['Item','Required For','Expected Date','Delivered','Status','Impact if Delayed','Owner'].map(H));
    d.materials.forEach(r=>rows.push(r.map(T)));rows.push([]);
    rows.push([{v:'ISSUES / RISKS / ACTIONS (RAID LOG)',t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}}}}]);
    rows.push(['Type','Description','Impact','Owner','Due Date','Status'].map(H));
    d.issues.forEach(r=>rows.push(r.map(T)));rows.push([]);
    rows.push([{v:'PLAN FOR TOMORROW',t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}}}}]);
    rows.push(['Area/Zone','Activity','Target Qty/Output','Crew/Trade','Notes'].map(H));
    d.tomorrow.forEach(r=>rows.push(r.map(T)));rows.push([]);
    rows.push([{v:'PHOTOS / EVIDENCE',t:'s',s:{font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:navy}}}}]);
    for(let i=0; i<d.captions.length; i+=2){
      const c1 = d.captions[i] || '';
      const c2 = d.captions[i+1] || '';
      rows.push([B('Photo '+(i+1)+' Caption'),T(c1),'', i+1<d.captions.length ? B('Photo '+(i+2)+' Caption') : '', i+1<d.captions.length ? T(c2) : '']);
    }
    const ws=XLSX.utils.aoa_to_sheet(rows);
    ws['!cols']=[20,18,18,18,18,20,20,8,18,22].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws,'Daily Site Report');
    XLSX.writeFile(wb,'DSR_'+(d.header.proj_date||today())+'.xlsx');
    toast('Excel downloaded');
  }catch(e){console.error(e);toast('Export failed')}
}

// ─── EXPORT: PDF ──────────────────────────────────────────
function exportPDF(){
  try{
    const {jsPDF}=window.jspdf,d=collectData();
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const PW=210,PH=297,M=10;let y=M;
    const navy=[0,0,0],accent=[0,0,0],lb=[255,255,255];
    doc.setFillColor(...navy);doc.rect(M,y,PW-2*M,12,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(255,255,255);
    doc.text('ALPAGO DESIGN & BUILD — DAILY SITE REPORT (DSR)',PW/2,y+8,{align:'center'});y+=15;
    doc.setFillColor(...accent);doc.rect(M,y,PW-2*M,1.5,'F');y+=5;
    const info=[['Project Name/ID',d.header.proj_name,'Location / Zone',d.header.proj_loc],['Client',d.header.client,'Consultant',d.header.consultant],['Main Contractor',d.header.contractor,'Date',d.header.proj_date+' · '+d.header.proj_shift],['Weather',d.header.weather,'Working Hours',d.header.hours],['Prepared By',d.header.prepared_by,'Reviewed By',d.header.reviewed_by],['Distribution',d.header.distribution,'Doc. Ref #',d.header.doc_ref]];
    doc.setFontSize(7.5);
    info.forEach(row=>{
      doc.setFillColor(...lb);doc.rect(M,y,(PW-2*M)/2-2,6,'F');doc.rect(PW/2+2,y,(PW-2*M)/2-2,6,'F');
      doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.text(row[0]+':',M+2,y+4);
      doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');doc.text(String(row[1]||''),M+40,y+4);
      doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.text(row[2]+':',PW/2+4,y+4);
      doc.setTextColor(0,0,0);doc.setFont('helvetica','normal');doc.text(String(row[3]||''),PW/2+40,y+4);
      y+=7;
    });y+=3;
    function sh(title){if(y>PH-40){doc.addPage();y=M;}doc.setFillColor(...navy);doc.rect(M,y,PW-2*M,7,'F');doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(255,255,255);doc.text(title.toUpperCase(),M+3,y+5);y+=9;doc.setTextColor(0,0,0);}
    sh('EXECUTIVE SUMMARY');
    doc.setFontSize(8);doc.setFont('helvetica','normal');
    [['1) Key achieved today',d.summary.exec1],['2) Main blocker / delay',d.summary.exec2],['3) Critical note / escalation',d.summary.exec3]].forEach(([k,v])=>{if(!v)return;doc.setFont('helvetica','bold');doc.setTextColor(...navy);doc.text(k+':',M+2,y);y+=5;doc.setFont('helvetica','normal');doc.setTextColor(0,0,0);doc.splitTextToSize(v,PW-2*M-4).forEach(l=>{doc.text(l,M+4,y);y+=4.5;});y+=2;});
    sh('MANPOWER & PLANT');
    if(d.manpower.length){doc.autoTable({startY:y,head:[['Trade / Company','Planned','Actual','Area/Zone','OT Hours','Notes'].map(x=>x.toUpperCase())],body:d.manpower.map(r=>[r[0],r[1],r[2],r[3],r[4],r[5]]),styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[0,0,0],textColor:[255,255,255],fontStyle:'bold'},margin:{left:M,right:M},theme:'grid'});y=doc.lastAutoTable.finalY+3;}
    if(d.equipment.length){doc.autoTable({startY:y,head:[['Equipment','Qty','Area/Zone','Downtime / Issue'].map(x=>x.toUpperCase())],body:d.equipment.map(r=>[r[0],r[1],r[2],r[3]]),styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[0,0,0],textColor:[255,255,255],fontStyle:'bold'},margin:{left:M,right:M},theme:'grid'});y=doc.lastAutoTable.finalY+5;}
    sh('WORK PROGRESS TODAY (MEASURED)');
    if(d.progress.length){doc.autoTable({startY:y,head:[['Area/Zone','Activity','Planned Today','Actual Today','Remarks'].map(x=>x.toUpperCase())],body:d.progress.map(r=>[r[0],r[1],r[2],r[3],r[4]]),styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[0,0,0],textColor:[255,255,255],fontStyle:'bold'},margin:{left:M,right:M},theme:'grid'});y=doc.lastAutoTable.finalY+5;}
    sh('MATERIALS / DELIVERIES');
    if(d.materials.length){doc.autoTable({startY:y,head:[['Item','Required For','Expected Date','Delivered','Status','Impact if Delayed','Owner'].map(x=>x.toUpperCase())],body:d.materials.map(r=>[r[0],r[1],r[2],r[3],r[4],r[5],r[6]]),styles:{fontSize:6.5,cellPadding:2},headStyles:{fillColor:[0,0,0],textColor:[255,255,255],fontStyle:'bold'},margin:{left:M,right:M},theme:'grid'});y=doc.lastAutoTable.finalY+5;}
    sh('ISSUES / RISKS / ACTIONS (RAID LOG)');
    if(d.issues.length){doc.autoTable({startY:y,head:[['Type','Description','Impact','Owner','Due Date','Status'].map(x=>x.toUpperCase())],body:d.issues.map(r=>[r[0],r[1],r[2],r[3],r[4],r[5]]),styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[0,0,0],textColor:[255,255,255],fontStyle:'bold'},margin:{left:M,right:M},theme:'grid'});y=doc.lastAutoTable.finalY+5;}
    sh('PLAN FOR TOMORROW (CLEAR TASKS)');
    if(d.tomorrow.length){doc.autoTable({startY:y,head:[['Area/Zone','Activity','Target Qty/Output','Crew/Trade','Notes'].map(x=>x.toUpperCase())],body:d.tomorrow.map(r=>[r[0],r[1],r[2],r[3],r[4]]),styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[0,0,0],textColor:[255,255,255],fontStyle:'bold'},margin:{left:M,right:M},theme:'grid'});y=doc.lastAutoTable.finalY+5;}
    sh('PHOTOS / EVIDENCE');
    const pkeys=Object.keys(photoData);
    if(pkeys.length){const iw=(PW-2*M-5)/2,ih=iw*0.75;let px=M,py=y;pkeys.forEach((num,idx)=>{if(py+ih+15>PH-M){doc.addPage();py=M;}try{doc.addImage(photoData[num],'JPEG',px,py,iw,ih);}catch(e){}doc.setFontSize(7);doc.setFont('helvetica','italic');doc.setTextColor(80,80,80);doc.text('Photo '+num+': '+(ge('pc'+num)?.value||''),px,py+ih+4);if(idx%2===0){px=M+iw+5;}else{px=M;py+=ih+14;}});y=py+(pkeys.length%2!==0?ih+14:5);}else{doc.setFontSize(8);doc.setTextColor(150,150,150);doc.setFont('helvetica','italic');doc.text('No photos attached.',M+2,y+5);}
    const pc=doc.internal.getNumberOfPages();
    for(let i=1;i<=pc;i++){doc.setPage(i);doc.setFillColor(...navy);doc.rect(M,PH-10,PW-2*M,6,'F');doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(255,255,255);doc.text(`${getCompany().toUpperCase()} — DAILY SITE REPORT`,M+3,PH-6);doc.text('Page '+i+' of '+pc,PW-M-3,PH-6,{align:'right'});doc.text(d.header.proj_date||'',PW/2,PH-6,{align:'center'});}
    doc.save('DSR_'+(d.header.proj_date||today())+'.pdf');toast('PDF downloaded');
  }catch(e){console.error(e);toast('PDF export failed')}
}

// ─── EMAIL ────────────────────────────────────────────────
function sendEmail(){
  if(!emails.length){toast('Add at least one email first');return}
  const d=collectData();
  const sub=encodeURIComponent('Daily Site Report - '+(d.header.proj_name||'Project')+' - '+(d.header.proj_date||''));
  const body=encodeURIComponent('Please find attached the Daily Site Report.\n\nProject: '+(d.header.proj_name||'')+'\nDate: '+(d.header.proj_date||'')+' - '+(d.header.proj_shift||'')+' shift\nLocation: '+(d.header.proj_loc||'')+'\nPrepared by: '+(d.header.prepared_by||'')+'\n\nSummary:\n1) '+(d.summary.exec1||'-')+'\n2) '+(d.summary.exec2||'-')+'\n3) '+(d.summary.exec3||'-')+'\n\nPlease attach the exported Excel / PDF file.\n\nRegards,\n'+(d.header.prepared_by||'Site Team'));
  window.location.href='mailto:'+emails.join(',')+'?subject='+sub+'&body='+body;
  toast('Opening email client...');
}

// ─── SERVICE WORKER ───────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  });
}

// ─── EXPORT & DASHBOARD LOGIC ────────────────────────────────
function exportLogsCSV(pid){
  const reports = getProjReports(pid).reverse();
  if(!reports.length){ toast('No reports to export'); return; }
  let csv = 'Date,Type,Item / Trade,Planned,Actual / Qty,Area / Zone,OT Hrs,Notes / Issues\n';
  reports.forEach(r => {
    const d = r.date;
    (r.data.manpower||[]).forEach(row => {
      csv += `"${d}","Manpower","${row[0]||''}","${row[1]||''}","${row[2]||''}","${row[3]||''}","${row[4]||''}","${row[5]||''}"\n`;
    });
    (r.data.equipment||[]).forEach(row => {
      csv += `"${d}","Equipment","${row[0]||''}","","${row[1]||''}","${row[2]||''}","","${row[3]||''}"\n`;
    });
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Logs_${pid}.csv`;
  a.click();
}

function exportLogsPDF(pid){
  const reports = getProjReports(pid).reverse();
  if(!reports.length){ toast('No reports to export'); return; }
  let html = `<html><head><title>Logs - ${pid}</title><style>
    body{font-family:sans-serif;padding:20px;color:#333}
    h1{font-size:20px;border-bottom:2px solid #000;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#f5f5f5}
    .type-mp{background:#e8f4f8}
    .type-eq{background:#fdf2e9}
  </style></head><body>`;
  html += `<h1>Resource Logs</h1>`;
  html += `<table><thead><tr><th>Date</th><th>Type</th><th>Item / Trade</th><th>Planned</th><th>Actual / Qty</th><th>Zone</th><th>OT Hrs</th><th>Notes</th></tr></thead><tbody>`;
  
  reports.forEach(r => {
    const d = r.date;
    (r.data.manpower||[]).forEach(row => {
      html += `<tr class="type-mp"><td>${d}</td><td>Manpower</td><td>${row[0]||''}</td><td>${row[1]||''}</td><td>${row[2]||''}</td><td>${row[3]||''}</td><td>${row[4]||''}</td><td>${row[5]||''}</td></tr>`;
    });
    (r.data.equipment||[]).forEach(row => {
      html += `<tr class="type-eq"><td>${d}</td><td>Equipment</td><td>${row[0]||''}</td><td></td><td>${row[1]||''}</td><td>${row[2]||''}</td><td></td><td>${row[3]||''}</td></tr>`;
    });
  });
  html += `</tbody></table><script>setTimeout(()=>window.print(),500);<\/script></body></html>`;
  
  const w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
}

let dashChartObj = null;

function renderGlobalDashboard(){
  const projects = lp();
  const allReports = lr();
  
  const ctx = document.getElementById('dash-chart');
  if(!ctx) return;
  
  document.getElementById('dash-active-proj').textContent = projects.length;
  
  let totalActual = 0;
  let totalPlanned = 0;
  let contractorData = {}; // { 'Contractor Name': actualCount }
  
  projects.forEach(p => {
    const rpts = allReports[p.id] || [];
    rpts.forEach(r => {
      (r.data.manpower||[]).forEach(row => {
        let planned = Number(row[1]) || 0;
        let actual = Number(row[2]) || 0;
        let contractor = row[0] ? String(row[0]).trim() : 'Unknown';
        if(contractor === '') contractor = 'Unknown';
        
        totalPlanned += planned;
        totalActual += actual;
        
        if(!contractorData[contractor]) contractorData[contractor] = 0;
        contractorData[contractor] += actual;
      });
    });
  });
  
  document.getElementById('dash-total-res').textContent = totalActual.toLocaleString();
  
  let efficiency = 0;
  if (totalPlanned > 0) {
    efficiency = Math.round((totalActual / totalPlanned) * 100);
  }
  document.getElementById('dash-efficiency').textContent = efficiency + '%';
  
  // Render Chart
  if(!window.Chart){
    ctx.outerHTML = '<div id="dash-chart" style="padding:20px;text-align:center;color:red">Failed to load charting library. Please check your connection.</div>';
    return;
  }
  
  if(dashChartObj) {
    dashChartObj.destroy();
  }
  
  const labels = Object.keys(contractorData);
  const data = Object.values(contractorData);
  const bgColors = labels.map((l,i) => `hsl(${(i*137.5)%360}, 70%, 50%)`);
  
  dashChartObj = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [{
        label: 'Total Manpower',
        data: data.length ? data : [0],
        backgroundColor: bgColors,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
        x: { grid: { display: false } }
      }
    }
  });
}
