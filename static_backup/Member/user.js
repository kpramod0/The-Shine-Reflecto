/* =========================================================
   Users page logic
   - Adds City filter (after Role, before Status)
   - Adds City column (after Client, before Status)
   - Inline city edit with Save → ready for backend
   ========================================================= */

/* ---------- Demo dataset (replace with backend data) ---------- */
const USERS = [
  { id:'EMP001', name:'Aarav Sharma',  mobile:'9876543210', role:'Worker',      aadhar:'1234 5678 9012', pan:'ABCDE1234F',  client:'Acme Corp',  city:'Delhi',     status:'Active'   },
  { id:'EMP002', name:'Neha Verma',    mobile:'9876501234', role:'Client HOD',  aadhar:'4321 8765 2109', pan:'PQRSX4321K',  client:'Acme Corp',  city:'Mumbai',    status:'Active'   },
  { id:'EMP003', name:'Rohan Singh',   mobile:'9876000001', role:'Supervisor',  aadhar:'1111 2222 3333', pan:'ROHNS9999L',  client:'Nexus',      city:'Chennai',   status:'Inactive' },
  { id:'EMP004', name:'Priya Patel',   mobile:'9988776655', role:'Worker',      aadhar:'2222 3333 4444', pan:'PRIYA1234Z',  client:'Apex',       city:'Bangalore', status:'Active'   },
  { id:'EMP005', name:'Vikram Rao',    mobile:'9898989898', role:'Admin',       aadhar:'9876 5432 1098', pan:'VIKRA1111P',  client:'—',          city:'Delhi',     status:'Active'   },
];

/* ---------- Elements ---------- */
const els = {
  q:       document.getElementById('q'),
  fClient: document.getElementById('fClient'),
  fRole:   document.getElementById('fRole'),
  fCity:   document.getElementById('fCity'),
  fStatus: document.getElementById('fStatus'),
  tbody:   document.getElementById('tbody'),
  mList:   document.getElementById('mList'),
  btnClear:document.getElementById('btnClear'),
  btnExport:document.getElementById('btnExport'),

  // optional header menu in your markup
  userBtn: document.getElementById('userMenuBtn'),
  userMenu:document.getElementById('userDropdown'),
};

/* ---------- Populate dynamic filter options from data ---------- */
(function populateFilters(){
  // Clients
  const clients = [...new Set(USERS.map(u => u.client).filter(Boolean))].sort();
  clients.forEach(c => els.fClient.add(new Option(c, c)));
  // Roles (if you want dynamic too)
  // const roles = [...new Set(USERS.map(u => u.role))].sort();
  // roles.forEach(r => els.fRole.add(new Option(r, r)));
  // Cities
  const cities = [...new Set(USERS.map(u => u.city).filter(Boolean))].sort();
  cities.forEach(c => els.fCity.add(new Option(c, c)));
})();

/* ---------- Helpers ---------- */
const statusClass = s => s === 'Active' ? 'status-pill status-pill--active' : 'status-pill status-pill--inactive';
const statusBool  = s => s === 'Active';

/* ---------- Filtering ---------- */
function getFiltered(){
  const q = (els.q.value || '').toLowerCase();
  const client = els.fClient.value;
  const role   = els.fRole.value;
  const city   = els.fCity.value;
  const status = els.fStatus.value;

  return USERS.filter(u => {
    const bySearch = [u.name, u.id, u.mobile].some(v => (v || '').toLowerCase().includes(q));
    const byClient = client === 'ALL' || u.client === client;
    const byRole   = role   === 'ALL' || u.role   === role;
    const byCity   = city   === 'ALL' || u.city   === city;
    const byStatus = status === 'ALL' || u.status === status;
    return bySearch && byClient && byRole && byCity && byStatus;
  });
}

/* ---------- Render (table + mobile) ---------- */
function rowHtml(u){
  return `
    <tr class="${u.status === 'Inactive' ? 'inactive' : ''}">
      <td><strong>${u.name}</strong></td>
      <td>${u.id}</td>
      <td>${u.mobile}</td>
      <td>${u.role}</td>
      <td>${u.aadhar}</td>
      <td>${u.pan}</td>
      <td>${u.client}</td>
      <td>
        <div class="city-cell" data-id="${u.id}">
          <span class="city-name">${u.city || '—'}</span>
          <button class="city-edit" title="Edit City" aria-label="Edit City">✎</button>
        </div>
      </td>
      <td>
        <span class="${statusClass(u.status)}"><span class="dot"></span>${u.status}</span>
      </td>
      <td><input type="checkbox" class="toggle" data-id="${u.id}" ${statusBool(u.status) ? 'checked' : ''}></td>
      <td class="t-right">
        <button class="btn-icon btn-icon--edit" title="Edit user" aria-label="Edit user">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
      </td>
    </tr>
  `;
}

function mobileCardHtml(u){
  return `
    <article class="m-card ${u.status === 'Inactive' ? 'inactive' : ''}">
      <div class="m-head">
        <div class="m-meta">
          <div class="m-line1">
            <div class="m-name">${u.name}</div>
            <span class="m-status-dot ${statusBool(u.status) ? 'active' : 'inactive'}"></span>
          </div>
          <div class="m-designation">${u.role} • ${u.id}</div>
        </div>
        <button class="arrow" aria-label="Expand">▾</button>
      </div>
      <div class="m-body">
        <div class="m-row"><strong>Mobile</strong><span>${u.mobile}</span></div>
        <div class="m-row"><strong>Client</strong><span>${u.client}</span></div>
        <div class="m-row"><strong>City</strong>
          <span>
            <span class="city-name">${u.city || '—'}</span>
            <!-- keep mobile read-only to keep UI simple -->
          </span>
        </div>
        <div class="m-row"><strong>Status</strong><span>${u.status}</span></div>
        <div class="m-actions">
          <label><input type="checkbox" class="toggle m-toggle" data-id="${u.id}" ${statusBool(u.status) ? 'checked' : ''}> Active</label>
        </div>
      </div>
    </article>
  `;
}

function render(){
  const data = getFiltered();
  els.tbody.innerHTML = data.map(rowHtml).join('');
  if (els.mList) els.mList.innerHTML = data.map(mobileCardHtml).join('');

  bindRowInteractions();
  bindMobileInteractions();
}

/* ---------- Interactions ---------- */
function bindRowInteractions(){
  // City inline edit
  document.querySelectorAll('.city-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      const cell = e.currentTarget.closest('.city-cell');
      const id   = cell.dataset.id;
      const span = cell.querySelector('.city-name');
      const current = span?.textContent.trim() === '—' ? '' : span?.textContent.trim();

      cell.innerHTML = `
        <input type="text" class="city-input" value="${current || ''}" placeholder="Enter city" />
        <button class="btn btn--primary btn-sm save-city">Save</button>
        <button class="btn btn-sm cancel-city">Cancel</button>
      `;

      const input  = cell.querySelector('.city-input');
      const save   = cell.querySelector('.save-city');
      const cancel = cell.querySelector('.cancel-city');

      input.focus();

      const restore = (val) => {
        cell.innerHTML = `
          <span class="city-name">${val || '—'}</span>
          <button class="city-edit" title="Edit City" aria-label="Edit City">✎</button>
        `;
        // re-bind the new edit button in this cell
        cell.querySelector('.city-edit').addEventListener('click', () => {
          btn.click();
        });
      };

      cancel.addEventListener('click', () => restore(current));

      save.addEventListener('click', async () => {
        const newCity = input.value.trim();
        const user = USERS.find(u => u.id === id);
        if (user) user.city = newCity;

        // Hook to your backend here
        try {
          await fetch('/api/updateCity', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ id, city: newCity })
          });
          // success → reflect UI
          restore(newCity);
        } catch (err) {
          console.warn('City update failed (simulated):', err);
          restore(current); // revert UI if call fails
          alert('Could not update city. Please try again.');
        }

        // Keep the City filter list in sync if a brand-new city was typed
        if ([...els.fCity.options].every(o => o.value !== newCity) && newCity){
          els.fCity.add(new Option(newCity, newCity));
        }
      });
    });
  });

  // Toggle active status (table)
  document.querySelectorAll('.toggle[data-id]').forEach(tg => {
    tg.addEventListener('change', e => {
      const id = e.currentTarget.dataset.id;
      const user = USERS.find(u => u.id === id);
      if (!user) return;
      user.status = e.currentTarget.checked ? 'Active' : 'Inactive';
      render(); // re-render to refresh pill + mobile too
    });
  });
}

function bindMobileInteractions(){
  // expand/collapse cards
  document.querySelectorAll('.m-card .arrow').forEach(btn => {
    btn.addEventListener('click', e => {
      const card = e.currentTarget.closest('.m-card');
      const expanded = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', (!expanded).toString());
    });
  });

  // mobile toggles
  document.querySelectorAll('.m-card .toggle[data-id]').forEach(tg => {
    tg.addEventListener('change', e => {
      const id = e.currentTarget.dataset.id;
      const user = USERS.find(u => u.id === id);
      if (!user) return;
      user.status = e.currentTarget.checked ? 'Active' : 'Inactive';
      render();
    });
  });
}

/* ---------- Export CSV (simple) ---------- */
function exportCsv(){
  const rows = [
    ['User','Employee ID','Mobile','Role','Aadhar','PAN','Client','City','Status','Active'],
    ...getFiltered().map(u => [
      u.name, u.id, u.mobile, u.role, u.aadhar, u.pan, u.client, u.city || '', u.status, statusBool(u.status) ? 'Yes' : 'No'
    ])
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'users.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- Events ---------- */
['input','change'].forEach(evt => {
  [els.q, els.fClient, els.fRole, els.fCity, els.fStatus].forEach(el => el?.addEventListener(evt, render));
});
els.btnClear?.addEventListener('click', () => {
  els.q.value = '';
  els.fClient.value = 'ALL';
  els.fRole.value   = 'ALL';
  els.fCity.value   = 'ALL';
  els.fStatus.value = 'ALL';
  render();
});
els.btnExport?.addEventListener('click', exportCsv);

/* Optional: header dropdown */
if (els.userBtn && els.userMenu){
  els.userBtn.addEventListener('click', e => {
    const open = els.userBtn.getAttribute('aria-expanded') === 'true';
    els.userBtn.setAttribute('aria-expanded', String(!open));
    els.userMenu.hidden = open;
  });
  document.addEventListener('click', e => {
    if (!els.userMenu.hidden && !els.userMenu.contains(e.target) && !els.userBtn.contains(e.target)) {
      els.userMenu.hidden = true; els.userBtn.setAttribute('aria-expanded','false');
    }
  });
}

/* ---------- Init ---------- */
render();
