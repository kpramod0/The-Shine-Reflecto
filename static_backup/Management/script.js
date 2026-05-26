document.addEventListener('DOMContentLoaded', () => {
  /* === Member-style header: user dropdown === */
  const menuBtn = document.getElementById('userMenuBtn');
  const menuDrop = document.getElementById('userDropdown');
  if (menuBtn && menuDrop) {
    menuBtn.addEventListener('click', (e) => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      menuDrop.hidden = open;
      e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
      if (!menuDrop.contains(e.target) && !menuBtn.contains(e.target)) {
        menuDrop.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* === Footer active state (Dashboard footer style) === */
  const path = location.pathname.toLowerCase();
  document.querySelectorAll('.bottom-nav .nav-link').forEach(a => a.classList.remove('active'));
  if (path.includes('/management/')) {
    document.querySelector('.bottom-nav [data-key="management"]')?.classList.add('active');
  } else if (path.includes('/member/')) {
    document.querySelector('.bottom-nav [data-key="member"]')?.classList.add('active');
  } else if (path.includes('/dashboard/')) {
    document.querySelector('.bottom-nav [data-key="dashboard"]')?.classList.add('active');
  } else {
    document.querySelector('.bottom-nav [data-key="home"]')?.classList.add('active');
  }

  /* ===== Your original data + UI behavior (unchanged) ===== */
  const DATA = [
    { title:'Quarterly report',   worker:'Alice Nguyen',   client:'Client A', assigned:'2025-01-30', due:'2025-09-21', completed:'2025-09-21', status:'Completed',   priority:'High',   review:'Good',    notes:'Submitted on time' },
    { title:'Update project plan',worker:'Bob Patel',      client:'Client B', assigned:'2025-03-13', due:'2025-04-10', completed:'2025-04-13', status:'Completed',   priority:'Medium', review:'Average', notes:'Minor delay due to scope change' },
    { title:'Data entry audit',   worker:'Chen Wei',       client:'Client C', assigned:'2025-02-03', due:'2025-03-10', completed:'2025-03-08', status:'Completed',   priority:'Low',    review:'Good',    notes:'All clean' },
    { title:'Bug triage',         worker:'Alice Nguyen',   client:'Client A', assigned:'2025-04-22', due:'2025-05-02', completed:'2025-05-03', status:'Completed',   priority:'High',   review:'Good',    notes:'Handled 17 issues' },
    { title:'Integration tests',  worker:'Diego Ramos',    client:'Client D', assigned:'2025-02-24', due:'2025-03-31', completed:'2025-03-31', status:'Completed',   priority:'High',   review:'Good',    notes:'Full pass' },
    { title:'Policy review',      worker:'Bob Patel',      client:'Client E', assigned:'2025-12-27', due:'2026-01-20', completed:'',            status:'In Progress', priority:'Medium', review:'—',       notes:'Drafting updates' },
    { title:'Risk register',      worker:'Chen Wei',       client:'Client E', assigned:'2025-11-04', due:'2025-11-28', completed:'',            status:'On Hold',     priority:'Low',    review:'—',       notes:'Waiting stakeholder inputs' },
    { title:'Legacy cleanup',     worker:'Ella Thompson',  client:'Client C', assigned:'2025-08-11', due:'2025-09-01', completed:'2025-09-02', status:'Cancelled',   priority:'Low',    review:'Poor',    notes:'Scope cancelled' },
  ];

  /* Populate filters if present */
  const clientSel = document.getElementById('clientSel');
  if (clientSel) {
    [...new Set(DATA.map(r => r.client))].sort().forEach(c => {
      const o = document.createElement('option'); o.value = c; o.textContent = c; clientSel.appendChild(o);
    });
  }
  const workerSel = document.getElementById('workerSel');
  if (workerSel) {
    [...new Set(DATA.map(r => r.worker))].sort().forEach(w => {
      const o = document.createElement('option'); o.value = w; o.textContent = w; workerSel.appendChild(o);
    });
  }

  /* Helpers */
  const fmt = (iso) => !iso ? '—' :
    new Date(iso).toLocaleDateString(undefined, {month:'short', day:'2-digit', year:'numeric'});
  const badge = (status) => {
    const s = String(status||'').toLowerCase();
    if (s.includes('progress')) return `<span class="badge b-warn">In&nbsp;Progress</span>`;
    if (s.includes('cancel')) return `<span class="badge b-bad">Cancelled</span>`;
    if (s.includes('hold')) return `<span class="badge b-warn">On&nbsp;Hold</span>`;
    return `<span class="badge b-ok">Completed</span>`;
  };
  const statusDot = (status) => {
    const s = String(status||'').toLowerCase();
    if (s.includes('progress') || s.includes('hold')) return 'dot--warn';
    if (s.includes('cancel')) return 'dot--bad';
    return 'dot--ok';
  };

  /* Render table + mobile list if target nodes exist */
  function renderTable(rows){
    const tbody = document.querySelector('#taskTable tbody');
    const mlist = document.getElementById('mobileList');
    const empty = document.getElementById('emptyState');
    if (!tbody || !mlist || !empty) return;

    tbody.innerHTML = ''; mlist.innerHTML = '';

    if (!rows.length){ empty.hidden = false; return; }
    empty.hidden = true;

    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.title}</strong></td>
        <td>${r.client}</td>
        <td>${fmt(r.assigned)}</td>
        <td>${fmt(r.due)}</td>
        <td>${fmt(r.completed)}</td>
        <td>${badge(r.status)}</td>
        <td>${r.priority||'—'}</td>
        <td>${r.review||'—'}</td>
        <td>${r.notes||'—'}</td>`;
      tbody.appendChild(tr);
    });

    rows.forEach(r=>{
      const wrap = document.createElement('div');
      wrap.className = 'mrow';
      wrap.setAttribute('aria-expanded','false');
      wrap.innerHTML = `
        <div class="mrow__head">
          <div>
            <div><strong>${fmt(r.assigned)}</strong> • ${r.client}</div>
            <div class="mrow__sub">${r.title}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="dot ${statusDot(r.status)}"></span>
            <button class="arrow" aria-label="Expand">▶</button>
          </div>
        </div>
        <div class="mrow__extra">
          <p><b>Worker:</b> ${r.worker}</p>
          <p><b>Due:</b> ${fmt(r.due)} • <b>Completed:</b> ${fmt(r.completed)}</p>
          <p><b>Status:</b> ${badge(r.status)} • <b>Priority:</b> ${r.priority||'—'}</p>
          <p><b>Review:</b> ${r.review||'—'}</p>
          <p><b>Notes:</b> ${r.notes||'—'}</p>
        </div>`;
      wrap.querySelector('.arrow').addEventListener('click', ()=>{
        const ex = wrap.getAttribute('aria-expanded') === 'true';
        wrap.setAttribute('aria-expanded', String(!ex));
        wrap.querySelector('.arrow').textContent = ex ? '▶' : '▼';
      });
      mlist.appendChild(wrap);
    });
  }

  /* Filters (includes worker) */
  function getFiltered(){
    const q = document.getElementById('q')?.value.trim().toLowerCase() || '';
    const st = document.getElementById('statusSel')?.value || '';
    const pr = document.getElementById('prioritySel')?.value || '';
    const cl = document.getElementById('clientSel')?.value || '';
    const wk = document.getElementById('workerSel')?.value || '';
    const from = document.getElementById('fromDate')?.value || '';
    const to = document.getElementById('toDate')?.value || '';

    return DATA.filter(r=>{
      if (st && r.status !== st) return false;
      if (pr && r.priority !== pr) return false;
      if (cl && r.client !== cl) return false;
      if (wk && r.worker !== wk) return false;
      if (from && r.assigned < from) return false;
      if (to && r.assigned > to) return false;
      if (q && !(r.title + ' ' + r.notes).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function applyFilters(){
    const out = getFiltered();
    renderTable(out);
    renderPerformance(out.length ? out : DATA);
  }

  document.getElementById('applyBtn')?.addEventListener('click', applyFilters);
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    document.getElementById('filterForm')?.reset();
    applyFilters();
  });

  /* Collapsible */
  document.querySelectorAll('.toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-target');
      const body = document.querySelector(id);
      if (!body) return;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      body.style.display = isOpen ? 'none' : 'block';
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* Toast + export */
  const toast = document.getElementById('toast');
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(showToast._t); showToast._t = setTimeout(()=>toast.classList.remove('show'), 1500);
  };

  document.getElementById('btnCsv')?.addEventListener('click', ()=>{
    const rows = getFiltered();
    const header = ['Title','Client','Assigned On','Due','Completed','Status','Priority','Review','Notes'];
    const lines = rows.map(r => [
      r.title, r.client, fmt(r.assigned), fmt(r.due), fmt(r.completed),
      r.status, r.priority||'', r.review||'', r.notes||''
    ].map(x => `"${String(x).replaceAll('"','""')}"`).join(','));
    const blob = new Blob([header.join(',')+'\n'+lines.join('\n')], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'task_history.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast && showToast('CSV exported');
  });

  document.getElementById('btnPdf')?.addEventListener('click', ()=>{
    window.print(); // Save as PDF via browser dialog
    showToast && showToast('Use your browser’s dialog to save PDF');
  });

  /* Simple charts */
  const COLORS = {
    completed:'#22c55e', inprog:'#3b82f6', cancelled:'#64748b',
    impressive:'#16a34a', good:'#22c55e', average:'#f59e0b', poor:'#ef4444'
  };
  const reviewScore = (txt) => {
    const t = String(txt||'').toLowerCase();
    if (t.startsWith('impre')) return 1.0;
    if (t.startsWith('good')) return 0.84;
    if (t.startsWith('aver')) return 0.70;
    if (t.startsWith('poor') || t.startsWith('bad')) return 0.50;
    return 0.70;
  };

  function renderPerformance(rows){
    const statThroughput = document.getElementById('statThroughput');
    const statCompleted  = document.getElementById('statCompleted');
    const statPending    = document.getElementById('statPending');
    const statOnTime     = document.getElementById('statOnTime');
    const statAvgCycle   = document.getElementById('statAvgCycle');
    const statQuality    = document.getElementById('statQuality');
    const donutStatus    = document.getElementById('donutStatus');
    const donutRating    = document.getElementById('donutRating');
    const legendStatus   = document.getElementById('legendStatus');
    const legendRating   = document.getElementById('legendRating');
    const trendSvg       = document.getElementById('trendSvg');

    if (![statThroughput, statCompleted, statPending, statOnTime, statAvgCycle, statQuality].some(Boolean)) return;

    const total = rows.length;
    const completedRows = rows.filter(r=>r.status==='Completed' && r.completed);
    const completed = completedRows.length;
    const pending = Math.max(0, total - completed);
    const throughput = completed;

    let ontime = 0, cycleDays = 0, qTotal = 0;
    completedRows.forEach(r=>{
      const dDue = r.due ? new Date(r.due) : null;
      const dComp = new Date(r.completed);
      const dAssn = new Date(r.assigned);
      if (dDue && dComp <= dDue) ontime++;
      cycleDays += Math.max(0, Math.round((dComp - dAssn)/(1000*60*60*24)));
      qTotal += reviewScore(r.review);
    });

    const onTimePct = completed ? Math.round((ontime/completed)*100) : 0;
    const avgCycle = completed ? (cycleDays/completed).toFixed(1) : '0.0';
    const quality = completed ? Math.round((qTotal/completed)*100) : 0;

    statThroughput.textContent = throughput;
    statCompleted.textContent  = completed;
    statPending.textContent    = pending;
    statOnTime.textContent     = onTimePct + '%';
    statAvgCycle.textContent   = avgCycle;
    statQuality.textContent    = quality;

    const counts = {
      Completed: rows.filter(r=>r.status==='Completed').length,
      'In Progress': rows.filter(r=>r.status==='In Progress').length,
      Cancelled: rows.filter(r=>r.status==='Cancelled' || r.status==='On Hold').length
    };
    drawDonut('donutStatus', [
      {label:'Completed', value:counts['Completed'], color:COLORS.completed},
      {label:'In Progress', value:counts['In Progress'], color:COLORS.inprog},
      {label:'Cancelled/On Hold', value:counts['Cancelled'], color:COLORS.cancelled}
    ], 'legendStatus');

    const rc = {Impressive:0, Good:0, Average:0, Poor:0};
    rows.forEach(r=>{
      const t = String(r.review||'').toLowerCase();
      if (t.startsWith('impre')) rc.Impressive++;
      else if (t.startsWith('good')) rc.Good++;
      else if (t.startsWith('aver')) rc.Average++;
      else if (t.startsWith('poor') || t.startsWith('bad')) rc.Poor++;
    });
    drawDonut('donutRating', [
      {label:'Impressive', value:rc.Impressive, color:COLORS.impressive},
      {label:'Good',       value:rc.Good,       color:COLORS.good},
      {label:'Average',    value:rc.Average,    color:COLORS.average},
      {label:'Poor',       value:rc.Poor,       color:COLORS.poor}
    ], 'legendRating');

    renderTrend(completedRows);
  }

  function drawDonut(elId, segments, legendId){
    const el = document.getElementById(elId);
    const leg = document.getElementById(legendId);
    if (!el || !leg) return;

    const total = Math.max(1, segments.reduce((s,x)=>s+x.value,0));
    let acc = 0;
    const stops = segments.map(seg=>{
      const start = (acc/total)*360; acc += seg.value;
      const end = (acc/total)*360;
      return `${seg.color} ${start}deg ${end}deg`;
    }).join(', ');
    el.style.background = `conic-gradient(${stops})`;

    leg.innerHTML = '';
    segments.forEach(seg=>{
      const pct = Math.round((seg.value/total)*100);
      const li = document.createElement('li');
      li.innerHTML = `<span class="sw" style="background:${seg.color}"></span>${seg.label} <span style="color:#64748b;margin-left:6px">${pct}%</span>`;
      leg.appendChild(li);
    });
  }

  function renderTrend(completedRows){
    const svg = document.getElementById('trendSvg');
    if (!svg) return;

    const now = new Date();
    const labels = [];
    for (let i=11;i>=0;i--){
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      labels.push(d.toISOString().slice(0,7));
    }
    const counts = labels.map(m => completedRows.filter(r => (r.completed||'').slice(0,7) === m).length);

    const maxY = Math.max(1, ...counts);
    const w = 600, h = 180, pad = 22;
    const dx = (w - pad*2) / (counts.length-1);
    const scaleY = (v)=> h - pad - (v/maxY)*(h - pad*2);

    const points = counts.map((v,i)=>[pad + i*dx, scaleY(v)].join(',')).join(' ');
    svg.innerHTML = `
      <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>
      <polyline fill="none" stroke="#3b82f6" stroke-width="2" points="${points}"/>
      ${counts.map((v,i)=>`<circle cx="${pad + i*dx}" cy="${scaleY(v)}" r="3" fill="#3b82f6"/>`).join('')}
    `;
  }

  /* Initial render */
  applyFilters();
});
