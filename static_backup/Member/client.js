/* ---------- Demo dataset (swap with backend when ready) ---------- */
const CLIENTS = [
  {
    id: 'CL001',
    name: 'TechCorp Industries',
    category: 'Information Technology Services',
    status: 'Active',
    photo: 'https://placehold.co/80x80/png?text=TC',
    contact: {
      email: 'contact@techcorp.com',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Street, Silicon Valley'
    },
    service: { start: 'Jan 2023', type: 'IT Support', teamSize: 28 },
    hod: { name: 'Robert Johnson', title: 'IT Director', email: 'robert.johnson@techcorp.com', photo: 'https://i.pravatar.cc/80?img=7' }
  },
  {
    id: 'CL002',
    name: 'BlueStone Facilities',
    category: 'Facilities Management',
    status: 'Active',
    photo: 'https://placehold.co/80x80/png?text=BS',
    contact: { email: 'info@bluestone.com', phone: '+1 (555) 890-1122', address: '77 Harbor Road, Seattle WA' },
    service: { start: 'Aug 2022', type: 'Housekeeping', teamSize: 40 },
    hod: { name: 'Neha Gupta', title: 'Client HOD', email: 'neha.gupta@bluestone.com', photo: 'https://i.pravatar.cc/80?img=5' }
  },
  {
    id: 'CL003',
    name: 'GreenField Logistics',
    category: 'Logistics & Supply Chain',
    status: 'Inactive',
    photo: 'https://placehold.co/80x80/png?text=GF',
    contact: { email: 'support@greenfield.io', phone: '+1 (555) 222-3344', address: '410 Meadow Ave, Denver CO' },
    service: { start: 'Mar 2021', type: 'Warehouse Ops', teamSize: 18 },
    hod: { name: 'Imran Khan', title: 'Operations Lead', email: 'imran.khan@greenfield.io', photo: 'https://i.pravatar.cc/80?img=12' }
  },
  {
    id: 'CL004',
    name: 'Acme Corp',
    category: 'Manufacturing',
    status: 'Active',
    photo: 'https://placehold.co/80x80/png?text=AC',
    contact: { email: 'hello@acmecorp.com', phone: '+1 (555) 333-7777', address: '901 Industrial Blvd, Austin TX' },
    service: { start: 'Nov 2023', type: 'Plant Support', teamSize: 32 },
    hod: { name: 'Priya Iyer', title: 'Procurement Head', email: 'priya.iyer@acmecorp.com', photo: 'https://i.pravatar.cc/80?img=8' }
  }
];

/* ---------- DOM handles ---------- */
const els = {
  tbody: document.getElementById('tbody'),
  mList: document.getElementById('mList'),
  userMenuBtn: document.getElementById('userMenuBtn'),
  userDropdown: document.getElementById('userDropdown'),
  modal: document.getElementById('editModal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalClose: document.getElementById('editClose'),
  modalOk: document.getElementById('editOk'),
  btnAdd: document.getElementById('btnAdd'),
  q: document.getElementById('q'),
  fCity: document.getElementById('fCity'),
  btnClear: document.getElementById('btnClear')
};

/* ---------- Helpers ---------- */
const mapLink = addr => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;

function statusPill(status){
  const isActive = status === 'Active';
  const label = isActive ? 'Active Contract' : 'Inactive';
  const cls = isActive ? 'status-pill status-pill--active' : 'status-pill status-pill--inactive';
  return `<span class="${cls}"><span class="dot"></span>${label}</span>`;
}

// rough city extraction: last comma-part of address
function cityOf(addr){
  if (!addr) return '';
  const parts = addr.split(',');
  return parts[parts.length - 1].trim();
}

/* ---------- Build City filter ---------- */
(function initCityFilter(){
  const cities = Array.from(new Set(CLIENTS.map(c => cityOf(c.contact.address)))).filter(Boolean).sort();
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city; opt.textContent = city;
    els.fCity.appendChild(opt);
  });
})();

/* ---------- Filtering ---------- */
function matchesQuery(c, query){
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    c.name.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    c.contact.email.toLowerCase().includes(q) ||
    c.contact.phone.toLowerCase().includes(q) ||
    c.contact.address.toLowerCase().includes(q)
  );
}

function applyFilters(){
  const q = els.q.value.trim();
  const city = els.fCity.value;

  let out = CLIENTS.filter(c => matchesQuery(c, q));
  if (city !== 'ALL') out = out.filter(c => cityOf(c.contact.address) === city);

  renderTable(out);
  renderMobile(out);
  return out;
}

els.btnClear.addEventListener('click', () => {
  els.q.value = '';
  els.fCity.value = 'ALL';
  applyFilters();
});

/* ---------- Icons for details ---------- */
function mailIcon(){ return `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/></svg>`; }
function phoneIcon(){ return `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.03-.24c1.12.37 2.33.57 3.56.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C11.85 21 3 12.15 3 1a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1c0 1.23.2 2.44.57 3.56a1 1 0 0 1-.24 1.03l-2.21 2.2Z"/></svg>`; }
function pinIcon(){ return `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z"/></svg>`; }

/* ---------- Render: Desktop table ---------- */
function renderTable(rows){
  els.tbody.innerHTML = rows.map(c => {
    const pill = statusPill(c.status);
    const checked = c.status === 'Active' ? 'checked' : '';

    const main = `
      <tr class="row" data-id="${c.id}">
        <td><img class="logo-sq" src="${c.photo}" alt="${c.name} logo" /></td>
        <td>
          <div class="client-cell">
            <div><div style="font-weight:800">${c.name}</div></div>
          </div>
        </td>
        <td>${c.category}</td>
        <td><a href="${mapLink(c.contact.address)}" target="_blank" rel="noopener">${c.contact.address}</a></td>
        <td>${pill}</td>
        <td><input type="checkbox" class="toggle" ${checked} data-id="${c.id}" aria-label="Toggle Active"></td>
        <td class="th-actions" style="text-align:right">
          <button class="btn-icon btn-icon--edit" data-edit="${c.id}" title="Edit ${c.name}" aria-label="Edit ${c.name}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 17.25V21h3.75l11-11-3.75-3.75-11 11Z"></path>
              <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"></path>
            </svg>
          </button>
        </td>
        <td class="th-expand">
          <button class="row-toggle" aria-expanded="false" aria-controls="d-${c.id}" data-toggle="${c.id}">
            <span class="caret">▾</span>
          </button>
        </td>
      </tr>`;

    const details = `
      <tr class="details-row" id="d-${c.id}">
        <td class="details-cell" colspan="8">
          <div class="details-wrap">
            <section class="block">
              <h4>Contact Information</h4>
              <div class="kv">
                <label class="inline">${mailIcon()}&nbsp; Email</label>
                <div><a href="mailto:${c.contact.email}">${c.contact.email}</a></div>
                <label class="inline">${phoneIcon()}&nbsp; Phone</label>
                <div><a href="tel:${c.contact.phone}">${c.contact.phone}</a></div>
                <label class="inline">${pinIcon()}&nbsp; Location</label>
                <div><a href="${mapLink(c.contact.address)}" target="_blank" rel="noopener">${c.contact.address}</a></div>
              </div>
            </section>

            <section class="block">
              <h4>Service Details</h4>
              <div class="kv">
                <label>Contract Start:</label><div>${c.service.start}</div>
                <label>Service Type:</label><div>${c.service.type}</div>
                <label>Team Size:</label><div>${c.service.teamSize} Employees</div>
              </div>
            </section>

            <section class="block">
              <h4>Client HOD</h4>
              <div class="hod">
                <img src="${c.hod.photo}" alt="${c.hod.name}">
                <div>
                  <div style="font-weight:700">${c.hod.name}</div>
                  <div style="color:#64748b">${c.hod.title}</div>
                  <div><a href="mailto:${c.hod.email}">${c.hod.email}</a></div>
                </div>
              </div>
            </section>
          </div>
        </td>
      </tr>`;

    return main + details;
  }).join('');

  // Toggle active - update status and re-render to refresh pill/mobiles
  els.tbody.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('change', e => {
      const id = e.target.getAttribute('data-id');
      const c = CLIENTS.find(x => x.id === id);
      c.status = e.target.checked ? 'Active' : 'Inactive';
      applyFilters();
    });
  });

  // expand/collapse
  els.tbody.querySelectorAll('.row-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-toggle');
      const detailsRow = document.getElementById(`d-${id}`);
      const open = detailsRow.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('.caret').textContent = open ? '▴' : '▾';
    });
  });

  // edit action
  els.tbody.querySelectorAll('[data-edit]').forEach(b => {
    b.addEventListener('click', () => openModal());
  });
}

/* ---------- Render: Mobile cards ---------- */
function renderMobile(rows){
  els.mList.innerHTML = rows.map(c => {
    const isActive = c.status === 'Active';
    return `
      <article class="m-card" aria-expanded="false">
        <div class="m-head">
          <img class="m-pic" src="${c.photo}" alt="${c.name} logo">
          <div class="m-meta">
            <div class="m-title">${c.name}</div>
            <div class="m-sub">${c.contact.address}</div>
          </div>
          <div class="m-right">
            <span class="dot ${isActive ? 'active' : 'inactive'}" aria-label="${c.status}"></span>
            <button class="arrow" aria-label="Expand">▾</button>
          </div>
        </div>

        <div class="m-body">
          <div class="m-row">
            <label>Category</label><div>${c.category}</div>
            <label>Status</label><div>${statusPill(c.status)}</div>
          </div>

          <h4 style="margin:12px 0 6px">Contact Information</h4>
          <div class="m-row">
            <label>Email</label><div><a href="mailto:${c.contact.email}">${c.contact.email}</a></div>
            <label>Phone</label><div><a href="tel:${c.contact.phone}">${c.contact.phone}</a></div>
            <label>Location</label><div><a href="${mapLink(c.contact.address)}" target="_blank" rel="noopener">${c.contact.address}</a></div>
          </div>

          <h4 style="margin:12px 0 6px">Service Details</h4>
          <div class="m-row">
            <label>Contract Start</label><div>${c.service.start}</div>
            <label>Service Type</label><div>${c.service.type}</div>
            <label>Team Size</label><div>${c.service.teamSize} Employees</div>
          </div>

          <h4 style="margin:12px 0 6px">Client HOD</h4>
          <div class="m-row">
            <label>HOD</label>
            <div class="inline">
              <img src="${c.hod.photo}" alt="${c.hod.name}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #e9eaf1">
              <div>
                <div style="font-weight:700">${c.hod.name}</div>
                <div style="color:#64748b">${c.hod.title}</div>
                <div><a href="mailto:${c.hod.email}">${c.hod.email}</a></div>
              </div>
            </div>
          </div>

          <div class="m-actions">
            <button class="btn btn--primary" data-edit="${c.id}">Edit</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // expand/collapse
  els.mList.querySelectorAll('.m-card .arrow').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.m-card');
      const open = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', String(!open));
      btn.textContent = open ? '▾' : '▴';
    });
  });

  // edit buttons
  els.mList.querySelectorAll('[data-edit]').forEach(b => {
    b.addEventListener('click', () => openModal());
  });
}

/* ---------- Modal helpers ---------- */
function openModal(){ els.modalBackdrop.hidden = false; els.modal.hidden = false; }
function closeModal(){ els.modalBackdrop.hidden = true; els.modal.hidden = true; }
els.modalClose.addEventListener('click', closeModal);
els.modalBackdrop.addEventListener('click', closeModal);
els.modalOk.addEventListener('click', closeModal);
els.btnAdd.addEventListener('click', openModal);

/* ---------- Header user dropdown ---------- */
els.userMenuBtn?.addEventListener('click', () => {
  const expanded = els.userMenuBtn.getAttribute('aria-expanded') === 'true';
  els.userMenuBtn.setAttribute('aria-expanded', String(!expanded));
  els.userDropdown.hidden = expanded;
});
document.addEventListener('click', (e) => {
  if (!els.userMenuBtn.contains(e.target) && !els.userDropdown.contains(e.target)) {
    els.userDropdown.hidden = true;
    els.userMenuBtn.setAttribute('aria-expanded', 'false');
  }
}, true);

/* ---------- Wire filters ---------- */
['input','change'].forEach(evt => {
  els.q.addEventListener(evt, applyFilters);
  els.fCity.addEventListener(evt, applyFilters);
});

/* ---------- Initial render ---------- */
applyFilters();
