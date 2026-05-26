// ===== Header & Footer (Home-style) + Material page logic =====
document.addEventListener('DOMContentLoaded', () => {
  // ------------ Header (EXACT like Home) ------------
  const H = document.getElementById('site-header');
  if (H){
    H.innerHTML = `
      <header class="main-header">
        <a class="brand" href="../../index.html">
          <img class="logo" src="../../logo.png" alt="Logo" />
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
              <a href="../../index.html">Logout</a>
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

  // ------------ Footer (emoji nav, active highlight like Home) ------------
  const F = document.getElementById('site-footer');
  if (F){
    F.innerHTML = `
      <nav class="bottom-nav" aria-label="Primary">
        <a class="nav-link" data-k="home" href="../../index.html">🏠<span>Home</span></a>
        <a class="nav-link" data-k="member" href="../../Member/index.html">👥<span>Member</span></a>
        <a class="nav-link" data-k="management" href="../../Management/index.html">📋<span>Management</span></a>
        <a class="nav-link" data-k="dashboard" href="../index.html">📊<span>Dashboard</span></a>
      </nav>`;
    const p = (location.pathname || '').replace(/\\/g,'/').toLowerCase();
    const mark = k => F.querySelector(`[data-k="${k}"]`)?.classList.add('active');
    if (p.includes('/member/')) mark('member');
    else if (p.includes('/management/')) mark('management');
    else if (p.includes('/dashboard/')) mark('dashboard');
    else mark('home');
  }

  // ------------ Tabs ------------
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.card').forEach(c => c.hidden = true);
    document.getElementById(t.dataset.tab).hidden = false;
    if (t.dataset.tab === 'listTab') renderList();
  }));

  // ------------ Section toggles ------------
  function bindToggle(chkId, wrapId){
    const chk = document.getElementById(chkId);
    const wrap = document.getElementById(wrapId);
    chk.addEventListener('change', ()=> wrap.hidden = !chk.checked);
  }
  bindToggle('chkMachines','machinesWrap');
  bindToggle('chkPad','padWrap');
  bindToggle('chkChemical','chemWrap');
  bindToggle('chkPowder','powderWrap');
  bindToggle('chkShampoo','shampooWrap');
  bindToggle('chkOthers','othersWrap');

  // ------------ Dynamic rows: Pads ------------
  const PAD_TYPES = ['Red pad','White pad','Black pad','Diamond pad'];
  const padRows = document.getElementById('padRows');
  const addPadRowBtn = document.getElementById('addPadRow');

  function getChosenPadTypes(){
    return [...padRows.querySelectorAll('select[data-role="padType"]')].map(s => s.value).filter(Boolean);
  }
  function availablePadTypes(){
    const chosen = new Set(getChosenPadTypes());
    return PAD_TYPES.filter(p => !chosen.has(p));
  }
  function renderPadSelectOptions(sel){
    const current = sel.value || '';
    const avail = new Set(availablePadTypes().concat(current ? [current] : []));
    sel.innerHTML = '<option value="">Select…</option>' + [...avail].map(v=>`<option value="${v}">${v}</option>`).join('');
    sel.value = current;
  }
  function createPadRow(){
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="fg fg-sm">
        <label class="lbl">Pad Type</label>
        <select class="inp" data-role="padType"></select>
      </div>
      <div class="fg fg-sm">
        <label class="lbl">Grit / No.</label>
        <input type="text" class="inp" data-role="padGrit" placeholder="e.g., 50 / 100 / 800" />
      </div>
      <div class="fg fg-sm">
        <label class="lbl">Quantity</label>
        <input type="number" class="inp" data-role="padQty" min="1" placeholder="e.g., 10" />
      </div>
      <div class="fg fg-sm" style="align-self:flex-end">
        <button class="btn-danger" data-role="removeRow">Remove</button>
      </div>
    `;
    padRows.appendChild(row);
    const sel = row.querySelector('[data-role="padType"]');
    renderPadSelectOptions(sel);

    sel.addEventListener('change', () => {
      padRows.querySelectorAll('select[data-role="padType"]').forEach(renderPadSelectOptions);
      addPadRowBtn.disabled = availablePadTypes().length === 0;
    });
    row.querySelector('[data-role="removeRow"]').addEventListener('click', () => {
      row.remove();
      padRows.querySelectorAll('select[data-role="padType"]').forEach(renderPadSelectOptions);
      addPadRowBtn.disabled = availablePadTypes().length === 0;
    });
  }
  addPadRowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (availablePadTypes().length === 0) return;
    createPadRow();
    addPadRowBtn.disabled = availablePadTypes().length === 0;
  });

  // ------------ Dynamic rows: Chemicals ------------
  const chemRows = document.getElementById('chemRows');
  document.getElementById('addChemRow').addEventListener('click', (e)=>{
    e.preventDefault();
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="fg fg-sm">
        <label class="lbl">Name</label>
        <input type="text" class="inp" data-role="chemName" placeholder="e.g., HCL" />
      </div>
      <div class="fg fg-sm">
        <label class="lbl">Quantity</label>
        <input type="text" class="inp" data-role="chemQty" placeholder="e.g., 2 L" />
      </div>
      <div class="fg fg-sm" style="align-self:flex-end">
        <button class="btn-danger" data-role="removeRow">Remove</button>
      </div>
    `;
    chemRows.appendChild(row);
    row.querySelector('[data-role="removeRow"]').addEventListener('click', ()=>row.remove());
  });

  // ------------ Dynamic rows: Others ------------
  const otherRows = document.getElementById('otherRows');
  document.getElementById('addOtherRow').addEventListener('click', (e)=>{
    e.preventDefault();
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="fg fg-sm">
        <label class="lbl">Item name</label>
        <input type="text" class="inp" data-role="otherName" placeholder="e.g., Mops" />
      </div>
      <div class="fg fg-sm">
        <label class="lbl">Quantity</label>
        <input type="text" class="inp" data-role="otherQty" placeholder="e.g., 5" />
      </div>
      <div class="fg fg-sm" style="align-self:flex-end">
        <button class="btn-danger" data-role="removeRow">Remove</button>
      </div>
    `;
    otherRows.appendChild(row);
    row.querySelector('[data-role="removeRow"]').addEventListener('click', ()=>row.remove());
  });

  // ------------ Submit + LocalStorage ------------
  const LS_KEY = 'tsr_material_requests';

  function readStore(){
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch { return []; }
  }
  function writeStore(arr){
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  }

  document.getElementById('submitReq').addEventListener('click', () => {
    const req = {
      id: 'REQ-' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      managerNote: '',
      items: {}
    };

    // Machines
    if (document.getElementById('chkMachines').checked){
      const desc = document.getElementById('machDesc').value.trim();
      const count = +document.getElementById('machCount').value;
      if (desc && count>0) req.items.machines = {desc, count};
    }
    // Pads
    if (document.getElementById('chkPad').checked){
      const rows = [...padRows.querySelectorAll('.row')].map(r=>{
        const type = r.querySelector('[data-role="padType"]').value;
        const grit = r.querySelector('[data-role="padGrit"]').value.trim();
        const qty  = +r.querySelector('[data-role="padQty"]').value;
        if (type && qty>0) return {type, grit, qty};
        return null;
      }).filter(Boolean);
      if (rows.length) req.items.pads = rows;
    }
    // Chemicals
    if (document.getElementById('chkChemical').checked){
      const rows = [...chemRows.querySelectorAll('.row')].map(r=>{
        const name = r.querySelector('[data-role="chemName"]').value.trim();
        const qty  = r.querySelector('[data-role="chemQty"]').value.trim();
        if (name && qty) return {name, qty};
        return null;
      }).filter(Boolean);
      if (rows.length) req.items.chemicals = rows;
    }
    // Powder
    if (document.getElementById('chkPowder').checked){
      const kg = parseFloat(document.getElementById('powderKg').value);
      if (!isNaN(kg) && kg>0) req.items.powder = {kg};
    }
    // Shampoo
    if (document.getElementById('chkShampoo').checked){
      const code = document.getElementById('shampooCode').value.trim();
      if (code) req.items.shampoo = {code};
    }
    // Others
    if (document.getElementById('chkOthers').checked){
      const rows = [...otherRows.querySelectorAll('.row')].map(r=>{
        const name = r.querySelector('[data-role="otherName"]').value.trim();
        const qty  = r.querySelector('[data-role="otherQty"]').value.trim();
        if (name && qty) return {name, qty};
        return null;
      }).filter(Boolean);
      if (rows.length) req.items.others = rows;
    }

    if (Object.keys(req.items).length === 0){
      alert('Please select at least one section and fill valid values.');
      return;
    }

    const store = readStore();
    store.unshift(req);
    writeStore(store);
    alert('Request submitted!');
    // Reset form
    document.querySelectorAll('input[type="checkbox"]').forEach(chk => { chk.checked = false; });
    ['machinesWrap','padWrap','chemWrap','powderWrap','shampooWrap','othersWrap'].forEach(id=>{
      document.getElementById(id).hidden = true;
    });
    document.getElementById('machDesc').value='';
    document.getElementById('machCount').value='';
    padRows.innerHTML=''; addPadRowBtn.disabled=false;
    chemRows.innerHTML=''; otherRows.innerHTML='';
    document.getElementById('powderKg').value='';
    document.getElementById('shampooCode').value='';

    // Switch to list tab
    document.querySelector('[data-tab="listTab"]').click();
  });

  // ------------ List rendering ------------
  const reqTbody = document.getElementById('reqTbody');
  const emptyList = document.getElementById('emptyList');
  const statusFilter = document.getElementById('statusFilter');
  const searchText = document.getElementById('searchText');

  statusFilter.addEventListener('change', renderList);
  searchText.addEventListener('input', renderList);

  function itemsToText(items){
    const parts = [];
    if (items.machines) parts.push(`Machines: ${items.machines.desc} × ${items.machines.count}`);
    if (items.pads) parts.push('Pads: ' + items.pads.map(p=>`${p.type}${p.grit?` (${p.grit})`:''} × ${p.qty}`).join(', '));
    if (items.chemicals) parts.push('Chemicals: ' + items.chemicals.map(c=>`${c.name} × ${c.qty}`).join(', '));
    if (items.powder) parts.push(`Powder: ${items.powder.kg} kg`);
    if (items.shampoo) parts.push(`Shampoo: ${items.shampoo.code}`);
    if (items.others) parts.push('Others: ' + items.others.map(o=>`${o.name} × ${o.qty}`).join(', '));
    return parts.join(' | ');
  }

  function renderList(){
    const list = readStore();
    let filtered = list;
    const st = statusFilter.value;
    if (st !== 'all') filtered = filtered.filter(r=>r.status===st);
    const q = (searchText.value||'').toLowerCase();
    if (q) filtered = filtered.filter(r => itemsToText(r.items).toLowerCase().includes(q) || (r.managerNote||'').toLowerCase().includes(q));

    reqTbody.innerHTML = filtered.map(r=>{
      const dt = new Date(r.createdAt).toLocaleString();
      const itemsTxt = itemsToText(r.items) || '—';
      const badge = r.status==='approved' ? '<span class="badge b-ok">Approved</span>'
                  : r.status==='rejected' ? '<span class="badge b-rej">Rejected</span>'
                  : '<span class="badge b-pending">Pending</span>';
      return `
        <tr>
          <td>${dt}<br/><small>${r.id}</small></td>
          <td>${itemsTxt}</td>
          <td>${badge}</td>
          <td>${r.managerNote || '—'}</td>
        </tr>`;
    }).join('');

    emptyList.style.display = filtered.length ? 'none' : 'block';
  }
});
