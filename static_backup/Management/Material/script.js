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

  /* Storage */
  const LS_KEY = 'tsr_material_requests';
  const readStore = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
  const writeStore = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

  /* UI */
  const tbody = document.getElementById('tbody');
  const emptyState = document.getElementById('emptyState');
  const statusFilter = document.getElementById('statusFilter');
  const searchText = document.getElementById('searchText');
  const clearAll = document.getElementById('clearAll');

  statusFilter.addEventListener('change', render);
  searchText.addEventListener('input', render);
  clearAll.addEventListener('click', ()=>{
    if (confirm('This clears the local demo storage for material requests. Proceed?')){
      localStorage.removeItem(LS_KEY);
      render();
    }
  });

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

  function setStatus(id, status){
    const note = prompt(status==='approved' ? 'Add approval note (optional):' : 'Add rejection reason (optional):', '');
    const store = readStore();
    const idx = store.findIndex(r=>r.id===id);
    if (idx >= 0){
      store[idx].status = status;
      store[idx].managerNote = note || '';
      writeStore(store);
      render();
    }
  }

  function render(){
    const list = readStore();
    let filtered = list;
    const st = statusFilter.value;
    if (st !== 'all') filtered = filtered.filter(r=>r.status===st);
    const q = (searchText.value||'').toLowerCase();
    if (q) filtered = filtered.filter(r => itemsToText(r.items).toLowerCase().includes(q) || (r.managerNote||'').toLowerCase().includes(q));

    tbody.innerHTML = filtered.map(r=>{
      const dt = new Date(r.createdAt).toLocaleString();
      const itemsTxt = itemsToText(r.items) || '—';
      const badge = r.status==='approved' ? '<span class="badge b-ok">Approved</span>'
                  : r.status==='rejected' ? '<span class="badge b-rej">Rejected</span>'
                  : '<span class="badge b-pending">Pending</span>';
      const actions = r.status==='pending'
        ? `<button class="btn" data-act="approve" data-id="${r.id}">Approve</button>
           <button class="btn-danger" data-act="reject" data-id="${r.id}">Reject</button>`
        : `<button class="btn-ghost" data-act="reset" data-id="${r.id}">Mark Pending</button>`;
      return `
        <tr>
          <td>${dt}<br/><small>${r.id}</small></td>
          <td>${itemsTxt}</td>
          <td>${badge}</td>
          <td>${r.managerNote || '—'}</td>
          <td>${actions}</td>
        </tr>`;
    }).join('');

    // Bind row buttons
    tbody.querySelectorAll('button[data-act]').forEach(btn=>{
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      btn.addEventListener('click', ()=>{
        if (act==='approve') setStatus(id,'approved');
        if (act==='reject') setStatus(id,'rejected');
        if (act==='reset') setStatus(id,'pending');
      });
    });

    emptyState.style.display = filtered.length ? 'none' : 'block';
  }

  render();
});
