// ============ Header & Footer (Home-style, root-aware) + Attendance logic ============
document.addEventListener('DOMContentLoaded', () => {
  // ----- Root helpers so links work from /Dashboard/Attendance/ too -----
  function getRoot() {
    const path = location.pathname.replace(/\\/g, "/");
    const m = path.match(/^(.*?\/TSR_Web\/)/i);
    return m ? m[1] : path.replace(/[^/]*$/, "");
  }
  const ROOT = getRoot();
  const ROUTES = {
    home:       ROOT + "index.html",
    member:     ROOT + "Member/index.html",
    management: ROOT + "Management/index.html",
    dashboard:  ROOT + "Dashboard/index.html"
  };

  // ----- Header (EXACT like Home) -----
  const h = document.getElementById('site-header');
  if (h){
    h.innerHTML = `
      <header class="main-header">
        <a class="brand" href="${ROUTES.home}">
          <img class="logo" src="${ROOT}logo.png" alt="Logo" />
          <div class="company-info">
            <span class="company-name">TSR</span>
            <span class="portal-name">Supervisor Portal</span>
          </div>
        </a>
        <div class="h-icons">
          <button class="icon-btn" aria-label="Notifications" title="Notifications">
            <span class="icon-badge">1</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/></svg>
          </button>

          <img class="avatar" src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile" />

          <div class="user-dropdown">
            <button class="dropdown-btn" id="userMenuBtn" aria-haspopup="true" aria-controls="userDropdown" aria-expanded="false">
              John Smith ▼
            </button>
            <nav class="dropdown-content" id="userDropdown" role="menu">
              <a href="#">Profile</a>
              <a href="#">Settings</a>
              <a href="${ROUTES.home}">Logout</a>
            </nav>
          </div>
        </div>
      </header>`;
    // dropdown wiring
    const btn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userDropdown');
    if (btn && menu){
      const close = () => { btn.setAttribute('aria-expanded','false'); menu.style.display='none'; };
      btn.addEventListener('click', (e)=>{
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        menu.style.display = open ? 'none' : 'block';
        e.stopPropagation();
      });
      document.addEventListener('click', (e)=>{
        if (!menu.contains(e.target) && !btn.contains(e.target)) close();
      });
      document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') close(); });
    }
  }

  // ----- Footer (emoji bottom nav, active-state like Home) -----
  const f = document.getElementById('site-footer');
  if (f){
    f.innerHTML = `
      <nav class="bottom-nav" aria-label="Primary">
        <a class="nav-link" data-k="home" href="${ROUTES.home}">🏠<span>Home</span></a>
        <a class="nav-link" data-k="member" href="${ROUTES.member}">👥<span>Member</span></a>
        <a class="nav-link" data-k="management" href="${ROUTES.management}">📋<span>Management</span></a>
        <a class="nav-link" data-k="dashboard" href="${ROUTES.dashboard}">📊<span>Dashboard</span></a>
      </nav>`;
    const p = (location.pathname || '').replace(/\\/g,'/').toLowerCase();
    const mark = k => f.querySelector(`[data-k="${k}"]`)?.classList.add('active');
    if (p.includes('/member/')) mark('member');
    else if (p.includes('/management/')) mark('management');
    else if (p.includes('/dashboard/')) mark('dashboard');
    else mark('home');
  }

  // ======== Calendar data (demo) ========
  const DATA = {
    "2025-09": {
      official: new Set([8]),
      unofficial: new Set([15]),
      details: {
        "2025-09-01": { status:"Present", in:"09:10 AM", out:"06:00 PM", hours:"8h 50m", shift:"Day", notes:"On time" },
        "2025-09-08": { status:"Official Leave", in:"—", out:"—", hours:"0h", shift:"—", notes:"Festival holiday" },
        "2025-09-15": { status:"Unofficial Absence", in:"—", out:"—", hours:"0h", shift:"—", notes:"Absent without notice" }
      }
    }
  };

  // ======== Helpers ========
  const pad = n => String(n).padStart(2,'0');
  const ymKey = (y,m)=>`${y}-${pad(m+1)}`;
  const monthLabel = (y,m)=>new Date(y,m,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const dayLabel = (y,m,d)=>new Date(y,m,d).toLocaleDateString(undefined,{weekday:'long', day:'numeric', month:'long', year:'numeric'});
  const isWeekend = d => [0,6].includes(d.getDay());
  const workingDays = (y,m)=>{ let c=0; const days=new Date(y,m+1,0).getDate(); for(let i=1;i<=days;i++){ const dt=new Date(y,m,i); if(!isWeekend(dt)) c++; } return c; };
  const toMinutes = (hStr) => {
    if (!hStr) return 0;
    const h = +(hStr.match(/(\d+)\s*h/)?.[1] || 0);
    const m = +(hStr.match(/(\d+)\s*m/)?.[1] || 0);
    return h*60 + m;
  };
  const fmtHrs = (mins) => `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}m`;

  // ======== Populate month/year pickers ========
  const monthSel = document.getElementById('monthSel');
  const yearSel  = document.getElementById('yearSel');
  const now = new Date();
  const YEARS = [now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1];
  const MONTHS = Array.from({length:12},(_,i)=>new Date(2000,i,1).toLocaleDateString(undefined,{month:'long'}));
  MONTHS.forEach((name,i)=>{ const o=document.createElement('option');o.value=i;o.textContent=name;monthSel.appendChild(o);});
  YEARS.forEach(y=>{ const o=document.createElement('option');o.value=y;o.textContent=y;yearSel.appendChild(o);});
  monthSel.value = String(now.getMonth()); yearSel.value = String(now.getFullYear());

  // ======== Calendar render ========
  const calCard = document.getElementById('calCard');
  const calTitle = document.getElementById('calTitle');
  const calDays  = document.getElementById('calDays');
  const sumTitle = document.getElementById('sumTitle');
  const kpiWorked = document.getElementById('kpiWorked');
  const kpiOfficial = document.getElementById('kpiOfficial');
  const kpiUnofficial = document.getElementById('kpiUnofficial');
  const kpiTotHrs = document.getElementById('kpiTotHrs');
  const kpiAvgHrs = document.getElementById('kpiAvgHrs');
  const kpiPunct  = document.getElementById('kpiPunct');
  const sumFoot = document.getElementById('sumFoot');

  // ---- Day Modal Elements
  const dayModal = document.getElementById('dayModal');
  const dayModalClose = document.getElementById('dayModalClose');
  const mDate = document.getElementById('mDate');
  const mStatus = document.getElementById('mStatus');
  const mIn = document.getElementById('mIn');
  const mOut = document.getElementById('mOut');
  const mHours = document.getElementById('mHours');
  const mShift = document.getElementById('mShift');
  const mNotes = document.getElementById('mNotes');

  function openDayModal({dateStr, status, In, Out, Hrs, Shift, Notes}){
    mDate.textContent = dateStr;
    mStatus.textContent = status;
    mIn.textContent = In;
    mOut.textContent = Out;
    mHours.textContent = Hrs;
    mShift.textContent = Shift;
    mNotes.textContent = Notes;
    dayModal.classList.add('show');
    dayModal.setAttribute('aria-hidden','false');
    dayModal.querySelector('.day-modal-close').focus();
  }
  function closeDayModal(){
    dayModal.classList.remove('show');
    dayModal.setAttribute('aria-hidden','true');
  }
  dayModalClose.addEventListener('click', closeDayModal);
  dayModal.addEventListener('click', (e)=>{ if (e.target === dayModal) closeDayModal(); });
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && dayModal.classList.contains('show')) closeDayModal(); });

  function renderCalendar(y,m){
    const key = ymKey(y,m);
    const conf = DATA[key] || {official:new Set(), unofficial:new Set(), details:{}};
    const days = new Date(y,m+1,0).getDate();
    const startDow = new Date(y,m,1).getDay();

    calDays.innerHTML = '';
    calTitle.textContent = monthLabel(y,m);
    sumTitle.textContent = `${monthLabel(y,m)} Summary`;

    // leading blanks
    for(let i=0; i<startDow; i++){
      const b=document.createElement('div'); b.className='day day--muted'; calDays.appendChild(b);
    }

    let present=0, official=0, unofficial=0, monthMinutes=0;
    for(let d=1; d<=days; d++){
      const cell = document.createElement('div');
      cell.className = 'day';
      cell.textContent = d;

      const dateObj = new Date(y,m,d);
      const weekend = isWeekend(dateObj);
      let status = 'Weekend';

      if (weekend) cell.classList.add('day--weekend');
      if (conf.official.has(d)){ cell.classList.add('day--official'); status='Official Leave'; official++; }
      else if (conf.unofficial.has(d)){ cell.classList.add('day--unofficial'); status='Unofficial Absence'; unofficial++; }
      else if (!weekend){ cell.classList.add('day--present'); status='Present'; present++;
        const dk = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const det = conf.details[dk];
        monthMinutes += det ? toMinutes(det.hours) : 9*60;
      }

      // click -> modal with details
      cell.addEventListener('click', ()=>{
        const dk = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const det = conf.details[dk];
        const s = det?.status || status;
        const In  = det?.in     || (s==='Present' ? '09:00 AM' : '—');
        const Out = det?.out    || (s==='Present' ? '06:00 PM' : '—');
        const Hrs = det?.hours  || (s==='Present' ? '9h 00m' : '0h');
        const Shift = det?.shift|| (s==='Present' ? 'Day' : '—');
        const Notes = det?.notes|| (s==='Present' ? '—' : s);
        openDayModal({
          dateStr: dayLabel(y,m,d),
          status: s, In, Out, Hrs, Shift, Notes
        });
      });

      calDays.appendChild(cell);
    }

    // trailing blanks to fill grid
    const used = startDow + days;
    const tail = (7 - (used % 7)) % 7;
    for(let i=0;i<tail;i++){ const b=document.createElement('div'); b.className='day day--muted'; calDays.appendChild(b); }

    // KPIs
    kpiWorked.textContent    = present;
    kpiOfficial.textContent  = official;
    kpiUnofficial.textContent= unofficial;
    sumFoot.textContent = `out of ${workingDays(y,m)} working days`;
    kpiTotHrs.textContent = fmtHrs(monthMinutes);
    kpiAvgHrs.textContent = present ? `${(monthMinutes/60/present).toFixed(1)}h` : '0.0h';
    const punct = (present + unofficial) ? Math.round((present/(present+unofficial))*100) : 0;
    kpiPunct.textContent = `${punct}%`;
  }

  // initial
  renderCalendar(now.getFullYear(), now.getMonth());

  // month navigation
  function rerender(){ renderCalendar(parseInt(yearSel.value,10), parseInt(monthSel.value,10)); }
  monthSel.onchange = rerender;
  yearSel.onchange = rerender;
  document.getElementById('monthPrev').onclick = () => {
    let y = +yearSel.value, m = +monthSel.value - 1;
    if (m < 0){ m = 11; y -= 1; }
    monthSel.value = m; yearSel.value = y; rerender();
  };
  document.getElementById('monthNext').onclick = () => {
    let y = +yearSel.value, m = +monthSel.value + 1;
    if (m > 11){ m = 0; y += 1; }
    monthSel.value = m; yearSel.value = y; rerender();
  };

  // ======= Hide / Unhide calendar grid (NOT the whole card) =======
  const calWrap     = document.getElementById('calWrap');
  const calHideBtn  = document.getElementById('calHideBtn');
  const calShowBtn  = document.getElementById('calShowBtn');
  const calCollapse = document.getElementById('calCollapse');

  function setCalVisible(visible){
    calWrap.hidden = !visible;
    calCollapse.setAttribute('aria-expanded', String(visible));
    calHideBtn.hidden = !visible;
    calShowBtn.hidden = visible;
  }
  calHideBtn.addEventListener('click', ()=>setCalVisible(false));
  calShowBtn.addEventListener('click', ()=>setCalVisible(true));

  // ======= Generic arrow toggles (Summary + Calendar arrow) =======
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.chev[data-target]');
    if (!btn) return;
    const targetSel = btn.getAttribute('data-target');
    const panel = document.querySelector(targetSel);
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if (panel) panel.hidden = expanded;

    // keep Hide/Unhide buttons in sync when calendar arrow is used
    if (targetSel === '#calWrap'){
      const nowVisible = !expanded;
      calHideBtn.hidden = !nowVisible;
      calShowBtn.hidden =  nowVisible;
    }
  });

  // ======== Detailed records (filters/demo data) ========
  const DETAILED = [
    {date:'2025-01-31', status:'present',   in:'09:15 AM', out:'06:30 PM', hours:'9h 15m', shift:'Day',  notes:'Regular workday',   client:'Client A'},
    {date:'2025-01-30', status:'present',   in:'09:00 AM', out:'06:00 PM', hours:'9h 00m', shift:'Day',  notes:'On time arrival',  client:'Client B'},
    {date:'2025-01-29', status:'present',   in:'08:45 AM', out:'05:45 PM', hours:'9h 00m', shift:'Day',  notes:'Early arrival',    client:'Client C'},
    {date:'2025-01-28', status:'present',   in:'09:10 AM', out:'06:15 PM', hours:'9h 05m', shift:'Day',  notes:'Regular workday',  client:'Client A'},
    {date:'2025-01-15', status:'unofficial',in:'—',       out:'—',        hours:'0h 00m', shift:'—',    notes:'Personal emergency', client:'Client A'},
    {date:'2025-01-08', status:'official',  in:'—',       out:'—',        hours:'0h 00m', shift:'—',    notes:'Annual leave',     client:'Client D'}
  ];

  const tbody = document.getElementById('tbody');
  const mlist = document.getElementById('mobileList');
  const empty = document.getElementById('emptyState');
  const fromEl = document.getElementById('fromDate');
  const toEl   = document.getElementById('toDate');
  const statEl = document.getElementById('statusSel');
  const qEl    = document.getElementById('searchText');

  const fmtDate = iso => new Date(iso+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'2-digit',year:'numeric'});
  const badge = s => s==='present' ? '<span class="badge b-ok">● Present</span>'
                  : s==='official' ? '<span class="badge b-info">● Official</span>'
                                   : '<span class="badge b-warn">▲ Unofficial</span>';

  function renderRows(rows){
    // Desktop table
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${fmtDate(r.date)}</td>
        <td>${r.client || '—'}</td>
        <td>${r.in}</td>
        <td>${r.out}</td>
        <td>${r.hours}</td>
        <td>${r.shift || '—'}</td>
        <td>${badge(r.status)}</td>
        <td>${r.notes}</td>
      </tr>`).join('');

    // Mobile list
    mlist.innerHTML = rows.map((r,i) => `
      <div class="mrow" data-i="${i}">
        <div class="meta">
          <strong>${fmtDate(r.date)}</strong>
          <span>${r.client || '—'}</span>
          ${badge(r.status)}
          <button aria-label="Show details">›</button>
        </div>
        <div class="details">
          <div><b>In:</b> ${r.in} &nbsp; <b>Out:</b> ${r.out}</div>
          <div><b>Total:</b> ${r.hours} &nbsp; <b>Shift:</b> ${r.shift || '—'}</div>
          <div><b>Status:</b> ${r.status}</div>
          <div><b>Notes:</b> ${r.notes}</div>
        </div>
      </div>`).join('');

    mlist.querySelectorAll('.mrow button').forEach((btn)=>btn.addEventListener('click',()=>btn.closest('.mrow').classList.toggle('open')));

    empty.hidden = rows.length > 0;

    // Range KPIs
    document.getElementById('rkWorked').textContent    = rows.filter(r=>r.status==='present').length;
    document.getElementById('rkOfficial').textContent  = rows.filter(r=>r.status==='official').length;
    document.getElementById('rkUnofficial').textContent= rows.filter(r=>r.status==='unofficial').length;
  }

  function applyFilters(){
    const from = fromEl.value, to = toEl.value, s = statEl.value, q = qEl.value.trim().toLowerCase();
    let out = [...DETAILED];
    if (from) out = out.filter(r => r.date >= from);
    if (to)   out = out.filter(r => r.date <= to);
    if (s !== 'all') out = out.filter(r => r.status === s);
    if (q) out = out.filter(r => (r.notes + ' ' + fmtDate(r.date) + ' ' + (r.client||'')).toLowerCase().includes(q));
    renderRows(out); return out;
  }

  // seed dates
  const min = DETAILED.reduce((a,b)=>a.date<b.date?a:b).date;
  const max = DETAILED.reduce((a,b)=>a.date>b.date?a:b).date;
  fromEl.value = min; toEl.value = max;
  applyFilters();
  document.getElementById('applyBtn').addEventListener('click', applyFilters);

  // ======== Exports (with Shift) ========
  function download(filename, blob){
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1200);
  }
  function exportCsv(rows){
    const head=['Date','Client','Check In','Check Out','Total Hours','Shift','Status','Notes'];
    const lines = rows.map(r => [
      fmtDate(r.date), r.client||'', r.in, r.out, r.hours, r.shift||'', r.status, r.notes
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    download('attendance.csv', new Blob([[head.join(',')].concat(lines).join('\r\n')], {type:'text/csv;charset=utf-8;'}));
  }
  function exportPdf(rows){
    const worker = (document.getElementById('workerName')?.value || '—').trim();
    const from = document.getElementById('fromDate').value || '—';
    const to   = document.getElementById('toDate').value   || '—';
    const nowStr = new Date().toLocaleString();
    const worked = rows.filter(r => r.status==='present').length;
    const off    = rows.filter(r => r.status==='official').length;
    const unoff  = rows.filter(r => r.status==='unofficial').length;
    const tr = rows.map(r => `<tr>
      <td>${fmtDate(r.date)}</td><td>${r.client||''}</td><td>${r.in}</td><td>${r.out}</td><td>${r.hours}</td><td>${r.shift||''}</td><td>${r.status}</td><td>${r.notes}</td>
    </tr>`).join('');
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Attendance Scan Report</title>
        <style>
          body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:24px}
          h1{font-size:22px;margin:0 0 12px}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;margin-bottom:14px}
          .box{border:1px solid #ddd;border-radius:10px;padding:10px 12px;margin:12px 0;background:#fafafa}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border:1px solid #ccc;padding:8px 10px;text-align:left;font-size:12px}
          th{background:#f3f4f6}
        </style>
      </head>
      <body>
        <h1>Attendance Scan Report</h1>
        <div class="grid">
          <div><b>Employee Name:</b> ${worker}</div>
          <div><b>Exported at:</b> ${nowStr}</div>
          <div><b>From Date:</b> ${from}</div>
          <div><b>To Date:</b> ${to}</div>
        </div>
        <div class="box">
          <b>Summary (selected range)</b><br/>
          Days Worked: ${worked} &nbsp; | &nbsp; Official Leaves: ${off} &nbsp; | &nbsp; Unofficial Absences: ${unoff}
        </div>
        <table>
          <thead><tr><th>Date</th><th>Client</th><th>Check In</th><th>Check Out</th><th>Total Hours</th><th>Shift</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>${tr}</tbody>
        </table>
        <script>window.print();<\/script>
      </body></html>`);
    w.document.close();
  }
  document.getElementById('exportCsv').addEventListener('click', ()=>exportCsv(applyFilters()));
  document.getElementById('exportPdf').addEventListener('click', ()=>exportPdf(applyFilters()));

  // small toast
  const toast = document.getElementById('toast');
  const showToast = (msg) => { toast.textContent = msg; toast.classList.add('show');
    clearTimeout(showToast._t); showToast._t = setTimeout(()=>toast.classList.remove('show'), 1400); };
  document.querySelectorAll('.js-soon').forEach(b => b.addEventListener('click', ()=>showToast('Coming soon')));
});
