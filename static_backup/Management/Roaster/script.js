/* ============================================================
   Roaster Manager
   - Header/Footer injection with robust ROOT detection
   - Seeds demo data if localStorage empty (key: "tsr_rosters")
   - Filters: date, supervisor, client, worker, shift
   - Clear filters & Add Roaster navigation
   - Table rendering with worker counts and Edit action
   ============================================================ */

/* ---------- Compute site root (".../TSR_Web/") ---------- */
function getRoot() {
  const path = location.pathname.replace(/\\/g, "/");
  const m = path.match(/^(.*?\/TSR_Web\/)/i);
  return m ? m[1] : path.replace(/[^/]*$/, "");
}
const ROOT = getRoot();

/* ---------- Routes ---------- */
const ROUTES = {
  home:       ROOT + "index.html",
  member:     ROOT + "Member/index.html",
  management: ROOT + "Management/index.html",
  dashboard:  ROOT + "Dashboard/index.html",
  addRoaster: ROOT + "add-roaster.html"
};

/* ---------- Header/Footer ---------- */
function injectHeader(){
  const H = document.getElementById('site-header');
  if (!H) return;
  H.innerHTML = `
    <header class="main-header">
      <a class="brand" href="${ROUTES.home}">
        <img class="logo" src="${ROOT}logo.png" alt="Logo"/>
        <div class="col"><span class="title">TSR</span><span class="sub">Supervisor Portal</span></div>
      </a>
      <div class="h-icons">
        <button class="icon-btn" aria-label="Notifications">🔔<span class="icon-badge">1</span></button>
        <img class="avatar" src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile"/>
      </div>
    </header>`;
}
function injectFooter(){
  const F = document.getElementById('site-footer');
  if (!F) return;
  F.innerHTML = `
    <nav class="bottom-nav" aria-label="Primary">
      <a class="nav-link" data-k="home" href="${ROUTES.home}">
        <svg viewBox="0 0 256 256"><path d="M213.38,109.62l-80-80a8,8,0,0,0-10.76,0l-80,80a8,8,0,0,0-1.7,11.87A8,8,0,0,0,48,124H64v80a16,16,0,0,0,16,16h80a16,16,0,0,0,16-16V124h16a8,8,0,0,0,6.68-12.51Z"/></svg>
        <span>Home</span>
      </a>
      <a class="nav-link" data-k="member" href="${ROUTES.member}">
        <svg viewBox="0 0 256 256"><path d="M234.38,210a112.33,112.33,0,0,0-212.76,0a8,8,0,1,0,13.76,8a96.34,96.34,0,0,1,185.24,0a8,8,0,1,0,13.76-8Z"/></svg>
        <span>Member</span>
      </a>
      <a class="nav-link" data-k="management" href="${ROUTES.management}">
        <svg viewBox="0 0 256 256"><path d="M224,64H176V56a24,24,0,0,0-24-24H104A24,24,0,0,0,80,56v8H32A16,16,0,0,0,16,80V208a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16Z"/></svg>
        <span>Management</span>
      </a>
      <a class="nav-link" data-k="dashboard" href="${ROUTES.dashboard}">
        <svg viewBox="0 0 256 256"><path d="M240,200V48a16,16,0,0,0-16-16H32A16,16,0,0,0,16,48V200a16,16,0,0,0,16,16H224A16,16,0,0,0,240,200Z"/></svg>
        <span>Dashboard</span>
      </a>
    </nav>`;
  const p = location.pathname.replace(/\\/g,'/').toLowerCase();
  const mark = (k)=>F.querySelector(`[data-k="${k}"]`)?.classList.add('active');
  if (p.includes('/member/')) mark('member');
  else if (p.includes('/management/')) mark('management');
  else if (p.includes('/dashboard/')) mark('dashboard');
  else mark('home');
}

/* ---------- Storage helpers ---------- */
const KEY = 'tsr_rosters';

function seedDemoIfEmpty(){
  const has = localStorage.getItem(KEY);
  if (has) return;

  const now = new Date();
  const iso = (d)=>d.toISOString();
  const d = (yy,mm,dd)=>`${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;

  const demo = [
    {
      id:'r1',
      rosterDate:d(2025,10,4),
      shift:'Day',
      name:'Day Shift',
      createdAt:iso(new Date(now.getTime()-3600e3)),
      createdBy:'ANIL S/o Mattar',
      clients:['Renaissance Bengaluru Race Course Hotel'],
      supervisor:'ANIL S/o Mattar (9766123961)',
      workers:[
        {name:'SHIVKARAN', phone:'9580916481'}
      ]
    },
    {
      id:'r2',
      rosterDate:d(2025,10,4),
      shift:'Day',
      name:'Day Shift',
      createdAt:iso(new Date(now.getTime()-2*3600e3)),
      createdBy:'ANIL S/o Mattar',
      clients:['Holiday Inn Express Bengaluru Whitefield Itpl, an IHG Hotel'],
      supervisor:'ANIL S/o Mattar (9766123961)',
      workers:[
        {name:'Shidharth', phone:'9880438510'}
      ]
    },
    {
      id:'r3',
      rosterDate:d(2025,10,4),
      shift:'Day',
      name:'Day Shift',
      createdAt:iso(new Date(now.getTime()-3*3600e3)),
      createdBy:'MOHIT S/o PRAMLAL',
      clients:['JW Marriott Hotel Kolkata'],
      supervisor:'MOHIT S/o PRAMLAL (9305200273)',
      workers:[
        {name:'SURJEET', phone:'7439971566'},
        {name:'MANISH KUMAR', phone:'8252259573'},
        {name:'BRIJENDRA .', phone:'9975801468'}
      ]
    }
  ];
  localStorage.setItem(KEY, JSON.stringify(demo));
}

function loadRosters(){
  try{
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  }catch(e){ return []; }
}

/* ---------- Filter state ---------- */
const state = {
  date: '',
  supervisor: '__all__',
  client: '__all__',
  worker: '__all__',
  shift: '__all__'
};

function setUpFilters(rosters){
  const supSel = document.getElementById('fSupervisor');
  const cliSel = document.getElementById('fClient');
  const wrkSel = document.getElementById('fWorker');

  const supers = [...new Set(rosters.map(r=>r.supervisor))].sort();
  const clients = [...new Set(rosters.flatMap(r=>r.clients||[]))].sort();
  const workers = [...new Set(rosters.flatMap(r=>(r.workers||[]).map(w=>`${w.name} ${w.phone?`(${w.phone})`:''}`)))].sort();

  supSel.innerHTML = `<option value="__all__">All</option>${supers.map(s=>`<option>${s}</option>`).join('')}`;
  cliSel.innerHTML = `<option value="__all__">All</option>${clients.map(c=>`<option>${c}</option>`).join('')}`;
  wrkSel.innerHTML = `<option value="__all__">All</option>${workers.map(w=>`<option>${w}</option>`).join('')}`;

  // wire change
  const f = () => { 
    state.date = document.getElementById('fDate').value;
    state.supervisor = supSel.value;
    state.client = cliSel.value;
    state.worker = wrkSel.value;
    state.shift = document.getElementById('fShift').value;
    render();
  };
  document.getElementById('fDate').addEventListener('change', f);
  supSel.addEventListener('change', f);
  cliSel.addEventListener('change', f);
  wrkSel.addEventListener('change', f);
  document.getElementById('fShift').addEventListener('change', f);

  // Clear
  document.getElementById('clearFilters').addEventListener('click', ()=>{
    document.getElementById('fDate').value = '';
    supSel.value='__all__'; cliSel.value='__all__'; wrkSel.value='__all__';
    document.getElementById('fShift').value='__all__';
    state.date=''; state.supervisor='__all__'; state.client='__all__'; state.worker='__all__'; state.shift='__all__';
    render();
  });

  // Add Roaster link
  const add = document.getElementById('addRoasterBtn');
  add.href = ROUTES.addRoaster;
}

/* ---------- Rendering ---------- */
function fmtDate(iso){ 
  if (!iso) return '—';
  const d = new Date(iso);
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function fmtDT(iso){
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
}

function applyFilters(list){
  return list.filter(r=>{
    if (state.date && r.rosterDate !== state.date) return false;
    if (state.supervisor !== '__all__' && r.supervisor !== state.supervisor) return false;
    if (state.client !== '__all__' && !(r.clients||[]).includes(state.client)) return false;
    if (state.worker !== '__all__') {
      const nameWithPhone = (w)=>`${w.name} ${w.phone?`(${w.phone})`:''}`;
      const hit = (r.workers||[]).some(w => nameWithPhone(w) === state.worker);
      if (!hit) return false;
    }
    if (state.shift !== '__all__' && r.shift !== state.shift) return false;
    return true;
  });
}

let DATA = [];
function render(){
  const list = applyFilters(DATA).sort((a,b)=> (a.rosterDate===b.rosterDate ? (a.createdAt<b.createdAt?1:-1) : (a.rosterDate<b.rosterDate?1:-1)));

  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('empty');
  const stats = document.getElementById('stats');

  tbody.innerHTML = list.map(r=>{
    const workers = r.workers || [];
    const count = workers.length;
    const wLines = workers.map(w=>`<div>• <span class="bullet"></span> ${w.name}${w.phone?` (${w.phone})`:''}</div>`).join('');
    const clients = (r.clients||[]).map(c=>`<div>• ${c}</div>`).join('');

    return `
      <tr>
        <td>${r.rosterDate}</td>
        <td>${fmtDT(r.createdAt)}</td>
        <td>${r.createdBy || '—'}</td>
        <td>${r.name || '—'}<div class="badge" style="margin-top:6px">${r.shift||'—'}</div></td>
        <td class="wrap-col">${clients || '—'}</td>
        <td class="wrap-col">${r.supervisor || '—'}</td>
        <td class="wrap-col">
          <div class="badge" style="margin-bottom:6px">${count} worker${count===1?'':'s'}</div>
          ${wLines || '—'}
        </td>
        <td><a class="action-link" href="${ROUTES.addRoaster}?edit=${encodeURIComponent(r.id)}">Edit</a></td>
      </tr>
    `;
  }).join('');

  empty.style.display = list.length ? 'none' : 'block';
  stats.textContent = `${list.length} roster${list.length===1?'':'s'} shown`;
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  injectHeader();
  injectFooter();
  seedDemoIfEmpty();
  DATA = loadRosters();
  setUpFilters(DATA);
  render();
});
