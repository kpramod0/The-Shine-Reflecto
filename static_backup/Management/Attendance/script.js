document.addEventListener('DOMContentLoaded', () => {
  /* Header */
  const H = document.getElementById('site-header');
  if (H){
    H.innerHTML = `
      <header class="main-header">
        <a class="brand" href="../../index.html">
          <img class="logo" src="../../logo.png" alt="Logo" />
          <div class="col">
            <span class="title">TSR</span>
            <span class="sub">Supervisor Portal</span>
          </div>
        </a>
        <div class="h-icons">
          <button class="icon-btn" aria-label="Notifications">🔔<span class="icon-badge">1</span></button>
          <img class="avatar" src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile" />
        </div>
      </header>`;
  }

  /* Footer */
  const F = document.getElementById('site-footer');
  if (F){
    F.innerHTML = `
      <nav class="bottom-nav" aria-label="Primary">
        <a class="nav-link" data-k="home" href="../../index.html">
          <svg viewBox="0 0 256 256"><path d="M213.38,109.62l-80-80a8,8,0,0,0-10.76,0l-80,80a8,8,0,0,0-1.7,11.87A8,8,0,0,0,48,124H64v80a16,16,0,0,0,16,16h80a16,16,0,0,0,16-16V124h16a8,8,0,0,0,6.68-12.51Z"/></svg>
          <span>Home</span>
        </a>
        <a class="nav-link" data-k="member" href="../../Member/index.html">
          <svg viewBox="0 0 256 256"><path d="M234.38,210a112.33,112.33,0,0,0-212.76,0a8,8,0,1,0,13.76,8a96.34,96.34,0,0,1,185.24,0a8,8,0,1,0,13.76-8Z"/></svg>
          <span>Member</span>
        </a>
        <a class="nav-link" data-k="management" href="../index.html">
          <svg viewBox="0 0 256 256"><path d="M224,64H176V56a24,24,0,0,0-24-24H104A24,24,0,0,0,80,56v8H32A16,16,0,0,0,16,80V208a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16Z"/></svg>
          <span>Management</span>
        </a>
        <a class="nav-link" data-k="dashboard" href="../../Dashboard/index.html">
          <svg viewBox="0 0 256 256"><path d="M240,200V48a16,16,0,0,0-16-16H32A16,16,0,0,0,16,48V200a16,16,0,0,0,16,16H224A16,16,0,0,0,240,200Z"/></svg>
          <span>Dashboard</span>
        </a>
      </nav>`;
    const p = location.pathname.replace(/\\/g,'/').toLowerCase();
    F.querySelectorAll('.nav-link').forEach(a=>a.classList.remove('active'));
    if (p.includes('/member/')) F.querySelector('[data-k="member"]')?.classList.add('active');
    else if (p.includes('/management/')) F.querySelector('[data-k="management"]')?.classList.add('active');
    else if (p.includes('/dashboard/')) F.querySelector('[data-k="dashboard"]')?.classList.add('active');
    else F.querySelector('[data-k="home"]')?.classList.add('active');
  }

  /* Demo dataset (rows = worker × shift entries) */
  const DATA = [
    {date:'2025-02-01', worker:'Parmeshwar', client:'Client A', in:'09:10 AM', out:'06:00 PM', hours:'8h 50m', shift:'Day',   status:'present',   notes:'On time'},
    {date:'2025-02-01', worker:'Ravi',       client:'Client A', in:'09:15 AM', out:'06:20 PM', hours:'9h 05m', shift:'Day',   status:'present',   notes:'—'},
    {date:'2025-02-01', worker:'Leena',      client:'Client A', in:'—',        out:'—',        hours:'0h',     shift:'Night', status:'official',  notes:'Approved'},
    {date:'2025-02-02', worker:'Parmeshwar', client:'Client B', in:'09:00 AM', out:'06:10 PM', hours:'9h 10m', shift:'Day',   status:'present',   notes:'OT 10m'},
    {date:'2025-02-02', worker:'Ashwini',    client:'Client B', in:'—',        out:'—',        hours:'0h',     shift:'Night', status:'unofficial',notes:'No show'},
    {date:'2025-02-03', worker:'Ashwini',    client:'Client A', in:'—',        out:'—',        hours:'0h',     shift:'Day',   status:'official',  notes:'Festival leave'},
    {date:'2025-02-04', worker:'Ashwini',    client:'Client C', in:'08:58 AM', out:'06:02 PM', hours:'9h 04m', shift:'Day',   status:'present',   notes:'Good'},
    {date:'2025-02-05', worker:'Ravi',       client:'Client B', in:'—',        out:'—',        hours:'0h',     shift:'Day',   status:'unofficial',notes:'No show'},
    {date:'2025-02-06', worker:'Ravi',       client:'Client C', in:'09:20 AM', out:'06:05 PM', hours:'8h 45m', shift:'Day',   status:'present',   notes:'Late in'},
    {date:'2025-02-07', worker:'Leena',      client:'Client A', in:'09:00 AM', out:'06:00 PM', hours:'9h 00m', shift:'Day',   status:'present',   notes:'—'},
    {date:'2025-02-08', worker:'Leena',      client:'Client B', in:'—',        out:'—',        hours:'0h',     shift:'Night', status:'official',  notes:'Approved leave'},
    {date:'2025-02-09', worker:'Parmeshwar', client:'Client C', in:'09:05 AM', out:'06:00 PM', hours:'8h 55m', shift:'Day',   status:'present',   notes:'—'},
    {date:'2025-02-10', worker:'Ashwini',    client:'Client B', in:'09:02 AM', out:'06:01 PM', hours:'8h 59m', shift:'Night', status:'present',   notes:'—'},
  ];

  /* Utils */
  const uniq = (arr) => [...new Set(arr)].sort((a,b)=>a.localeCompare(b));
  const parseMin = (hrs) => {
    const h = +(hrs.match(/(\d+)\s*h/)?.[1] || 0);
    const m = +(hrs.match(/(\d+)\s*m/)?.[1] || 0);
    return h*60 + m;
  };
  const fmtHrs = (mins) => `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}m`;
  const fmtDate = (iso) => new Date(iso+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'2-digit',year:'numeric'});
  const badge = (s) => s==='present' ? `<span class="badge b-ok">● Present</span>`
                     : s==='official' ? `<span class="badge b-info">● Official</span>`
                     : `<span class="badge b-warn">▲ Unofficial</span>`;
  const groupBy = (arr, keyFn) => arr.reduce((acc,cur)=>((acc[keyFn(cur)] ||= []).push(cur),acc),{});

  /* Elements */
  const modeWorker = document.getElementById('modeWorker');
  const modeClient = document.getElementById('modeClient');

  // Worker mode
  const wmOnly = document.querySelectorAll('.wm-only');
  const wmWorkerSel = document.getElementById('wmWorkerSel');
  const wmClientSel = document.getElementById('wmClientSel');
  const wmViewSel   = document.getElementById('wmViewSel');

  // Client mode
  const cmOnly = document.querySelectorAll('.cm-only');
  const cmClientInp = document.getElementById('cmClientInp');
  const cmClientList = document.getElementById('cmClientList');
  const cmWorkerInp = document.getElementById('cmWorkerInp');
  const cmWorkerList = document.getElementById('cmWorkerList');

  // Common filters
  const fromEl = document.getElementById('fromDate');
  const toEl   = document.getElementById('toDate');
  const shiftEl = document.getElementById('shiftSel');
  const statusEl = document.getElementById('statusSel');
  const searchEl = document.getElementById('searchText');

  const applyBtn = document.getElementById('applyBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Output
  const kpiRow = document.getElementById('kpiRow');
  const thead = document.getElementById('thead');
  const tbody = document.getElementById('tbody');
  const mobileList = document.getElementById('mobileList');
  const emptyState = document.getElementById('emptyState');
  const resultTitle = document.getElementById('resultTitle');
  const resultSub = document.getElementById('resultSub');

  /* Populate pickers */
  function fillPickers(){
    wmWorkerSel.innerHTML = ['<option value="__all__">All Workers</option>']
      .concat(uniq(DATA.map(r=>r.worker)).map(n => `<option value="${n}">${n}</option>`)).join('');
    wmClientSel.innerHTML = ['<option value="__all__">All Clients</option>']
      .concat(uniq(DATA.map(r=>r.client)).map(n => `<option value="${n}">${n}</option>`)).join('');

    cmClientList.innerHTML = uniq(DATA.map(r=>r.client)).map(n=>`<option value="${n}"></option>`).join('');
    cmWorkerList.innerHTML = uniq(DATA.map(r=>r.worker)).map(n=>`<option value="${n}"></option>`).join('');
  }
  fillPickers();

  // Seed dates from dataset
  const minDate = DATA.reduce((a,b)=>a.date<b.date?a:b).date;
  const maxDate = DATA.reduce((a,b)=>a.date>b.date?a:b).date;
  fromEl.value = minDate; toEl.value = maxDate;

  /* Mode UI */
  function applyModeUI(){
    const isWorker = modeWorker.checked;
    wmOnly.forEach(el => el.hidden = !isWorker);
    cmOnly.forEach(el => el.hidden = isWorker);
  }
  modeWorker.addEventListener('change', applyModeUI);
  modeClient.addEventListener('change', applyModeUI);
  applyModeUI();

  /* Filters */
  const matchShift  = (r)=> shiftEl.value==='all' || r.shift===shiftEl.value;
  const matchStatus = (r)=> statusEl.value==='all' || r.status===statusEl.value;
  function matchDate(r){
    const f = fromEl.value || '0000-01-01';
    const t = toEl.value   || '9999-12-31';
    return r.date >= f && r.date <= t;
  }
  function matchSearch(r){
    const q = searchEl.value.trim().toLowerCase();
    if (!q) return true;
    return `${r.date} ${r.notes||''} ${r.client||''} ${r.worker||''}`.toLowerCase().includes(q);
  }
  function filterRows(){
    const base = DATA.filter(r => matchDate(r) && matchShift(r) && matchStatus(r) && matchSearch(r));
    if (modeWorker.checked){
      const w = wmWorkerSel.value;   // "__all__" or name
      const c = wmClientSel.value;   // "__all__" or name
      return base.filter(r => (w==='__all__' || r.worker===w) && (c==='__all__' || r.client===c));
    } else {
      const cName = cmClientInp.value.trim();
      const wName = cmWorkerInp.value.trim(); // empty = all
      return base.filter(r => (cName ? r.client===cName : true) && (wName ? r.worker===wName : true));
    }
  }

  /* KPI helpers */
  function kpiTile(cls, title, sub, val){
    return `
      <div class="kpi ${cls}">
        <div class="k-left">
          <div class="k-title">${title}</div>
          <div class="k-sub">${sub}</div>
        </div>
        <div class="k-val">${val}</div>
      </div>`;
  }

  function computeMetrics(rows){
    const present = rows.filter(r=>r.status==='present').length;
    const official = rows.filter(r=>r.status==='official').length;
    const unofficial = rows.filter(r=>r.status==='unofficial').length;
    const minutesWorked = rows.reduce((acc,r)=>acc + parseMin(r.hours||'0h'), 0);
    const positiveShifts = rows.filter(r => parseMin(r.hours||'0h')>0).length;
    const avgPerShift = positiveShifts ? Math.round(minutesWorked/positiveShifts) : 0;
    const punct = (present + unofficial) ? Math.round((present/(present+unofficial))*100) : 0;
    return {present, official, unofficial, minutesWorked, avgPerShift, punct};
  }

  function buildKPIsCommon(rows, label){
    const {present, official, unofficial, minutesWorked, avgPerShift, punct} = computeMetrics(rows);
    kpiRow.innerHTML =
      kpiTile('k-green','Total no. of worked done', label, String(present)) +
      kpiTile('k-blue','Official absent', label, String(official)) +
      kpiTile('k-amber','Unofficial absent', label, String(unofficial)) +
      kpiTile('k-lite','Average hr/shift','Total hrs ÷ #present shifts', fmtHrs(avgPerShift)) +
      kpiTile('k-blue','Punctuality score','Present vs Unofficial', `${punct}%`) +
      kpiTile('k-lite','Total hours','Sum of all workers', fmtHrs(minutesWorked));
    return {present, official, unofficial, minutesWorked, avgPerShift, punct};
  }

  /* ---------- Mobile list rendering ---------- */
  function statusSymbol(s){
    return s==='present' ? '●' : (s==='official' ? '●' : '▲');
  }
  function statusClass(s){
    return s==='present' ? 'b-ok' : (s==='official' ? 'b-info' : 'b-warn');
  }

  // mode: 'worker-details' | 'client'
  function renderMobileList(rows, mode){
    if (!rows.length){ mobileList.innerHTML = ''; return; }

    // For the special requirement:
    // In worker-details & scope All workers + All clients on mobile,
    // show Date, Client, status (symbol), Notes in the head, and the rest in expandable section.
    // We’ll also make it look great for client mode (shows Date, Worker, status, Notes).
    const html = rows.map((r, idx) => {
      const headPrimary = mode==='worker-details'
        ? `${fmtDate(r.date)} • ${r.client}`
        : `${fmtDate(r.date)} • ${r.worker}`;
      const headStatus = `<span class="badge ${statusClass(r.status)} m-badge">${statusSymbol(r.status)} ${r.status[0].toUpperCase()+r.status.slice(1)}</span>`;
      const note = r.notes ? r.notes : '—';

      // Details grid differs slightly per mode
      const kv = (mode==='worker-details')
        ? `
          <div class="kv">
            <label>Worker</label><div>${r.worker}</div>
            <label>Check In</label><div>${r.in}</div>
            <label>Check Out</label><div>${r.out}</div>
            <label>Total Hours</label><div>${r.hours}</div>
            <label>Shift</label><div>${r.shift}</div>
          </div>`
        : `
          <div class="kv">
            <label>Client</label><div>${r.client}</div>
            <label>Check In</label><div>${r.in}</div>
            <label>Check Out</label><div>${r.out}</div>
            <label>Total Hours</label><div>${r.hours}</div>
            <label>Shift</label><div>${r.shift}</div>
          </div>`;

      return `
        <div class="m-item" data-i="${idx}" aria-expanded="false">
          <div class="m-head">
            <div class="m-left">
              <div class="m-title">${headPrimary}</div>
              <div class="m-sub">${headStatus}</div>
              <div class="m-note"><strong>Notes:</strong> ${note}</div>
            </div>
            <button class="m-arrow" aria-label="Expand">▸</button>
          </div>
          <div class="m-extra">
            ${kv}
          </div>
        </div>`;
    }).join('');

    mobileList.innerHTML = html;

    // Wire expand/collapse
    mobileList.querySelectorAll('.m-arrow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.currentTarget.closest('.m-item');
        const open = item.getAttribute('aria-expanded') === 'true';
        item.setAttribute('aria-expanded', String(!open));
        e.currentTarget.textContent = open ? '▸' : '▾';
        const extra = item.querySelector('.m-extra');
        extra.style.display = open ? 'none' : 'block';
      });
    });
  }

  /* ---------- Tables ---------- */
  const theadClient = `
    <tr>
      <th>Date</th><th>Worker</th><th>Check In</th><th>Check Out</th>
      <th>Total Hours</th><th>Shift</th><th>Status</th><th>Notes</th>
    </tr>`;
  const theadWorkerDetails = `
    <tr>
      <th>Date</th><th>Client</th><th>Check In</th><th>Check Out</th>
      <th>Total Hours</th><th>Shift</th><th>Status</th><th>Notes</th>
    </tr>`;

  function renderClientTable(rows, clientName, workerName){
    thead.innerHTML = theadClient;
    tbody.innerHTML = rows.map(r=>`
      <tr>
        <td>${fmtDate(r.date)}</td>
        <td>${r.worker}</td>
        <td>${r.in}</td>
        <td>${r.out}</td>
        <td>${r.hours}</td>
        <td>${r.shift}</td>
        <td>${badge(r.status)}</td>
        <td>${r.notes||'—'}</td>
      </tr>`).join('');
    emptyState.style.display = rows.length ? 'none' : 'block';
    const who = workerName ? ` • Worker: ${workerName}` : ' • Workers: All';
    resultTitle.textContent = clientName ? `Client: ${clientName}${who}` : `All Clients${who}`;
    resultSub.textContent = `${rows.length} record(s)`;

    // Also render mobile list version for client mode
    renderMobileList(rows, 'client');
  }

  function renderWorkerDetails(rows, workerSel, clientSel){
    thead.innerHTML = theadWorkerDetails;
    tbody.innerHTML = rows.map(r=>`
      <tr>
        <td>${fmtDate(r.date)}</td>
        <td>${r.client}</td>
        <td>${r.in}</td>
        <td>${r.out}</td>
        <td>${r.hours}</td>
        <td>${r.shift}</td>
        <td>${badge(r.status)}</td>
        <td>${r.notes||'—'}</td>
      </tr>`).join('');
    emptyState.style.display = rows.length ? 'none' : 'block';
    const w = workerSel==='__all__' ? 'All workers' : workerSel;
    const c = clientSel==='__all__' ? 'All clients' : clientSel;
    resultTitle.textContent = `Worker: ${w} • Client: ${c}`;
    resultSub.textContent = `${rows.length} record(s)`;

    // Mobile list for worker details
    renderMobileList(rows, 'worker-details');
  }

  function renderWorkerDaysOnly(rows, workerSel){
    mobileList.innerHTML = ''; // not used for days-only
    if (workerSel==='__all__'){
      const byWorker = groupBy(rows, r=>r.worker);
      const lines = Object.keys(byWorker).sort().map(w=>{
        const list = byWorker[w];
        const worked = list.filter(r=>r.status==='present').length;
        const off = list.filter(r=>r.status==='official').length;
        const unoff = list.filter(r=>r.status==='unofficial').length;
        return `<tr><td>${w}</td><td>${worked}</td><td>${off}</td><td>${unoff}</td></tr>`;
      }).join('');
      thead.innerHTML = `<tr><th>Worker</th><th>Days Worked</th><th>Official Absent</th><th>Unofficial Absent</th></tr>`;
      tbody.innerHTML = lines || '';
      emptyState.style.display = lines ? 'none' : 'block';
      resultTitle.textContent = 'Workers (days summary)';
      resultSub.textContent = `${Object.keys(byWorker).length} worker(s) listed`;
    } else {
      const worked = rows.filter(r=>r.status==='present').length;
      const off = rows.filter(r=>r.status==='official').length;
      const unoff = rows.filter(r=>r.status==='unofficial').length;
      thead.innerHTML = `<tr><th>Metric</th><th>Count</th></tr>`;
      tbody.innerHTML = `
        <tr><td>Days Worked</td><td>${worked}</td></tr>
        <tr><td>Official Absent</td><td>${off}</td></tr>
        <tr><td>Unofficial Absent</td><td>${unoff}</td></tr>`;
      emptyState.style.display = 'none';
      resultTitle.textContent = `Worker: ${workerSel} (days summary)`;
      resultSub.textContent = `3 metrics`;
    }
  }

  /* Apply & Clear */
  function apply(){
    const rows = filterRows().sort((a,b)=>a.date<b.date?1:-1);

    if (modeClient.checked){
      const metrics = buildKPIsCommon(rows, 'Selected scope');
      renderClientTable(rows, cmClientInp.value.trim(), cmWorkerInp.value.trim());
      apply._lastMetrics = {mode:'client', rows, metrics};
      return;
    }

    const metrics = buildKPIsCommon(rows, wmWorkerSel.value==='__all__' ? 'All workers' : wmWorkerSel.value);
    const view = wmViewSel.value; // details | days
    if (view === 'details'){
      renderWorkerDetails(rows, wmWorkerSel.value, wmClientSel.value);
      apply._lastMetrics = {mode:'worker-details', rows, metrics};
    } else {
      renderWorkerDaysOnly(rows, wmWorkerSel.value);
      apply._lastMetrics = {mode:'worker-days', rows, metrics};
    }
  }

  function clearFilters(){
    fromEl.value = minDate; toEl.value = maxDate;
    shiftEl.value = 'all';
    statusEl.value = 'all';
    searchEl.value = '';
    if (modeWorker.checked){
      wmWorkerSel.value = '__all__';
      wmClientSel.value = '__all__';
      wmViewSel.value = 'details';
    } else {
      cmClientInp.value = '';
      cmWorkerInp.value = '';
    }
    kpiRow.innerHTML = '';
    thead.innerHTML = '';
    tbody.innerHTML = '';
    mobileList.innerHTML = '';
    emptyState.style.display = 'block';
    resultTitle.textContent = 'Showing: —';
    resultSub.textContent = 'Use filters and click Apply.';
    apply._lastMetrics = null;
  }

  document.getElementById('applyBtn').addEventListener('click', apply);
  document.getElementById('clearBtn').addEventListener('click', clearFilters);

  /* Exports */
  function download(filename, blob){
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1200);
  }

  function exportCsv(){
    const rows = filterRows().sort((a,b)=>a.date<b.date?1:-1);
    if (!rows.length){ alert('No data to export for the selected filters.'); return; }

    let head, lines;
    if (modeClient.checked){
      head = ['Date','Worker','Check In','Check Out','Total Hours','Shift','Status','Notes'];
      lines = rows.map(r => [
        fmtDate(r.date), r.worker, r.in, r.out, r.hours, r.shift, r.status, r.notes||''
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    } else {
      if (wmViewSel.value === 'details'){
        head = ['Date','Client','Check In','Check Out','Total Hours','Shift','Status','Notes'];
        lines = rows.map(r => [
          fmtDate(r.date), r.client, r.in, r.out, r.hours, r.shift, r.status, r.notes||''
        ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
      } else {
        if (wmWorkerSel.value==='__all__'){
          head = ['Worker','Days Worked','Official Absent','Unofficial Absent'];
          const byWorker = groupBy(rows, r=>r.worker);
          lines = Object.keys(byWorker).sort().map(w=>{
            const list = byWorker[w];
            const worked = list.filter(r=>r.status==='present').length;
            const off    = list.filter(r=>r.status==='official').length;
            const unoff  = list.filter(r=>r.status==='unofficial').length;
            return [w, worked, off, unoff].map(v=>`"${v}"`).join(',');
          });
        } else {
          head = ['Metric','Count'];
          const worked = rows.filter(r=>r.status==='present').length;
          const off    = rows.filter(r=>r.status==='official').length;
          const unoff  = rows.filter(r=>r.status==='unofficial').length;
          lines = [
            `\"Days Worked\",\"${worked}\"`,
            `\"Official Absent\",\"${off}\"`,
            `\"Unofficial Absent\",\"${unoff}\"`
          ];
        }
      }
    }

    const csv = [head.join(',')].concat(lines).join('\r\n');
    download('attendance_export.csv', new Blob([csv], {type:'text/csv;charset=utf-8;'}));
  }

  function exportPdf(){
    const applied = apply._lastMetrics || {mode: (modeClient.checked?'client':(wmViewSel.value==='details'?'worker-details':'worker-days')), rows: filterRows()};
    const rows = applied.rows.sort((a,b)=>a.date<b.date?1:-1);
    if (!rows.length){ alert('No data to export for the selected filters.'); return; }

    const M = applied.metrics || computeMetrics(rows);
    const nowStr = new Date().toLocaleString();
    const dateRange = `${fromEl.value || '—'} to ${toEl.value || '—'}`;

    let headerTitle = 'Attendance Export';
    let headerMeta = '';
    if (applied.mode === 'client'){
      const clientName = cmClientInp.value.trim() || 'All Clients';
      const workerName = cmWorkerInp.value.trim() || 'All Workers';
      headerTitle = `Client Report — ${clientName}`;
      headerMeta = `
        <div><b>Client:</b> ${clientName}</div>
        <div><b>Worker:</b> ${workerName}</div>`;
    } else if (applied.mode === 'worker-details'){
      const w = wmWorkerSel.value==='__all__' ? 'All Workers' : wmWorkerSel.value;
      const c = wmClientSel.value==='__all__' ? 'All Clients' : wmClientSel.value;
      headerTitle = `Worker Report — ${w}`;
      headerMeta = `
        <div><b>Worker:</b> ${w}</div>
        <div><b>Client:</b> ${c}</div>`;
    } else {
      const w = wmWorkerSel.value==='__all__' ? 'All Workers' : wmWorkerSel.value;
      headerTitle = `Working Days — ${w}`;
      headerMeta = `<div><b>Worker Scope:</b> ${w}</div>`;
    }

    const kpiHtml = (applied.mode !== 'worker-days') ? `
      <div class="box">
        <b>Summary</b><br/>
        Total no. of worked done: ${M.present} &nbsp; | &nbsp;
        Official absent: ${M.official} &nbsp; | &nbsp;
        Unofficial absent: ${M.unofficial} &nbsp; | &nbsp;
        Average hr/shift: ${fmtHrs(M.avgPerShift)} &nbsp; | &nbsp;
        Punctuality score: ${M.punct}% &nbsp; | &nbsp;
        Total hours: ${fmtHrs(M.minutesWorked)}
      </div>` : '';

    let headHtml = '', bodyHtml = '';
    if (applied.mode === 'client'){
      headHtml = '<tr><th>Date</th><th>Worker</th><th>Check In</th><th>Check Out</th><th>Total Hours</th><th>Shift</th><th>Status</th><th>Notes</th></tr>';
      bodyHtml = rows.map(r=>`
        <tr><td>${fmtDate(r.date)}</td><td>${r.worker}</td><td>${r.in}</td><td>${r.out}</td><td>${r.hours}</td><td>${r.shift}</td><td>${r.status}</td><td>${r.notes||''}</td></tr>`
      ).join('');
    } else if (applied.mode === 'worker-details'){
      headHtml = '<tr><th>Date</th><th>Client</th><th>Check In</th><th>Check Out</th><th>Total Hours</th><th>Shift</th><th>Status</th><th>Notes</th></tr>';
      bodyHtml = rows.map(r=>`
        <tr><td>${fmtDate(r.date)}</td><td>${r.client}</td><td>${r.in}</td><td>${r.out}</td><td>${r.hours}</td><td>${r.shift}</td><td>${r.status}</td><td>${r.notes||''}</td></tr>`
      ).join('');
    } else {
      if (wmWorkerSel.value==='__all__'){
        headHtml = '<tr><th>Worker</th><th>Days Worked</th><th>Official Absent</th><th>Unofficial Absent</th></tr>';
        const byWorker = groupBy(rows, r=>r.worker);
        bodyHtml = Object.keys(byWorker).sort().map(w=>{
          const list = byWorker[w];
          const worked = list.filter(r=>r.status==='present').length;
          const off    = list.filter(r=>r.status==='official').length;
          const unoff  = list.filter(r=>r.status==='unofficial').length;
          return `<tr><td>${w}</td><td>${worked}</td><td>${off}</td><td>${unoff}</td></tr>`;
        }).join('');
      } else {
        headHtml = '<tr><th>Metric</th><th>Count</th></tr>';
        const worked = rows.filter(r=>r.status==='present').length;
        const off    = rows.filter(r=>r.status==='official').length;
        const unoff  = rows.filter(r=>r.status==='unofficial').length;
        bodyHtml = `
          <tr><td>Days Worked</td><td>${worked}</td></tr>
          <tr><td>Official Absent</td><td>${off}</td></tr>
          <tr><td>Unofficial Absent</td><td>${unoff}</td></tr>`;
      }
    }

    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>${headerTitle}</title>
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
        <h1>${headerTitle}</h1>
        <div class="grid">
          ${headerMeta}
          <div><b>Date range:</b> ${dateRange}</div>
          <div><b>Exported on:</b> ${nowStr}</div>
        </div>
        ${kpiHtml}
        <table><thead>${headHtml}</thead><tbody>${bodyHtml}</tbody></table>
        <script>window.print();<\/script>
      </body></html>`);
    w.document.close();
  }

  document.getElementById('exportCsv').addEventListener('click', exportCsv);
  document.getElementById('exportPdf').addEventListener('click', exportPdf);

  /* Initial state: clear prompt */
  // (You can auto-apply if you want: apply();)
});
