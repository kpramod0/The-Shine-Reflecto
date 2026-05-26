// ===== Demo Data =====
const SUPS = [
  { id:'S001', name:'ANIL S/o Mattar', title:'Area Supervisor',   avatar:'https://i.pravatar.cc/80?img=31' },
  { id:'S002', name:'NEHA GUPTA',      title:'Senior Supervisor', avatar:'https://i.pravatar.cc/80?img=12' },
  { id:'S003', name:'RAMESH PAL',      title:'Shift Supervisor',  avatar:'https://i.pravatar.cc/80?img=45' },
];

const WORKERS = [
  'SIVAM KUMAR','AMIT','PANKAJ KUMAR','ALOK KUMAR','VISHAL CHOUDHRY','SALMAN .',
  'RAJ KUMAR','NIRANJAN','ANIL S/o Mattar','ASHISH KUMAR','SONU S/O RAMESH',
  'Shivam S/O Pramodkumar','Vishal Ahirwar','Imran Khan','Meena Roy','Priya Iyer'
].map((n,i)=>({ id:`W${(i+1).toString().padStart(3,'0')}`, name:n }));

// supervisorId -> [workerIds]
const MAP = {
  S001: ['W001','W002','W003','W004','W005','W006','W007','W008','W009','W010','W011','W012','W013'],
  S002: ['W014','W015'],
  S003: ['W016']
};

// ===== DOM =====
const els = {
  q: document.getElementById('q'),
  supFilter: document.getElementById('supFilter'),
  tbody: document.getElementById('tbody'),
  mList: document.getElementById('mList'),
  btnOpenMap: document.getElementById('btnOpenMap'),
  btnClear: document.getElementById('btnClear'),

  // modal
  backdrop: document.getElementById('mapBackdrop'),
  modal: document.getElementById('mapModal'),
  mapClose: document.getElementById('mapClose'),
  mapCancel: document.getElementById('mapCancel'),
  mapSave: document.getElementById('mapSave'),
  mapSupSel: document.getElementById('mapSupSel'),
  allowReassign: document.getElementById('allowReassign'),
  selSupName: document.getElementById('selSupName'),
  availList: document.getElementById('availList'),
  asgnList: document.getElementById('asgnList'),
  availSearch: document.getElementById('availSearch'),
  asgnSearch: document.getElementById('asgnSearch'),
  btnAdd: document.getElementById('btnAdd'),
  btnRemove: document.getElementById('btnRemove'),

  // header menu
  userBtn: document.getElementById('userMenuBtn'),
  userMenu: document.getElementById('userDropdown'),
};

// ===== Helpers =====
const supById = id => SUPS.find(s => s.id === id);
const workerById = id => WORKERS.find(w => w.id === id);
const workerOwner = wid => Object.keys(MAP).find(sid => MAP[sid].includes(wid)) || null;
function getAssigned(sid){ return [...(MAP[sid] || [])]; }
function getUnassigned(){
  const assigned = new Set(Object.values(MAP).flat());
  return WORKERS.filter(w => !assigned.has(w.id)).map(w=>w.id);
}

// Fancy chip with dot
function chipHtml(name){
  return `<span class="chip"><span class="dot" aria-hidden="true"></span>${name}</span>`;
}

// ===== Render =====
function rowHtml(s){
  const chips = (MAP[s.id] || []).map(id => chipHtml(workerById(id).name)).join('');
  return `
    <tr>
      <td>
        <div class="sup-cell">
          <img class="sup-ava" src="${s.avatar}" alt="${s.name}">
          <div>
            <div class="sup-name">${s.name}</div>
            <div class="sup-sub">${s.title}</div>
          </div>
        </div>
      </td>
      <td><div class="chips">${chips || '<span class="sup-sub">No workers mapped</span>'}</div></td>
      <td class="t-right"><button class="edit" data-sid="${s.id}">✎ Edit</button></td>
    </tr>
  `;
}

function mCardHtml(s){
  const chips = (MAP[s.id] || []).map(id => chipHtml(workerById(id).name)).join('');
  return `
    <article class="m-card">
      <div class="m-h">
        <img class="m-ava" src="${s.avatar}" alt="${s.name}">
        <div>
          <h3 class="m-title">${s.name}</h3>
          <p class="m-sub">${s.title}</p>
        </div>
        <div style="margin-left:auto">
          <button class="edit" data-sid="${s.id}">✎ Edit</button>
        </div>
      </div>
      <div class="m-body">${chips || '<span class="sup-sub">No workers mapped</span>'}</div>
    </article>
  `;
}

function filterList(){
  const q = els.q.value.trim().toLowerCase();
  const sel = els.supFilter.value;

  return SUPS.filter(s => {
    if (sel !== 'ALL' && s.id !== sel) return false;
    const matchSup = s.name.toLowerCase().includes(q) || s.title.toLowerCase().includes(q);
    if (matchSup) return true;
    return (MAP[s.id] || []).some(wid => workerById(wid).name.toLowerCase().includes(q));
  });
}

function render(){
  const list = filterList();
  els.tbody.innerHTML = list.map(rowHtml).join('');
  els.mList.innerHTML = list.map(mCardHtml).join('');

  document.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-sid')));
  });
}

function populateSupFilters(){
  els.supFilter.innerHTML = '<option value="ALL">All supervisors</option>';
  els.mapSupSel.innerHTML = '';
  SUPS.forEach(s => {
    const opt = new Option(s.name, s.id);
    els.supFilter.add(opt.cloneNode(true));
    els.mapSupSel.add(new Option(s.name, s.id));
  });
}
populateSupFilters();
render();

['input','change'].forEach(evt => {
  els.q.addEventListener(evt, render);
  els.supFilter.addEventListener(evt, render);
});
els.btnClear.addEventListener('click', () => { els.q.value=''; els.supFilter.value='ALL'; render(); });

// ===== Modal =====
let currentSupId = SUPS[0].id;

function openModal(supId){
  currentSupId = supId || currentSupId;
  els.mapSupSel.value = currentSupId;
  els.selSupName.textContent = supById(currentSupId).name;

  els.backdrop.hidden = false; els.modal.hidden = false;
  refreshModalLists();
}
function closeModal(){ els.backdrop.hidden = true; els.modal.hidden = true; }

function refreshModalLists(){
  const assignedIds = getAssigned(currentSupId);
  const allowRe = els.allowReassign.checked;

  let availableIds = allowRe
    ? WORKERS.map(w=>w.id).filter(id => !assignedIds.includes(id))
    : getUnassigned();

  const aQ = (els.availSearch.value || '').toLowerCase();
  const gQ = (els.asgnSearch.value || '').toLowerCase();

  const availHtml = availableIds.map(id => {
    const w = workerById(id);
    if (aQ && !w.name.toLowerCase().includes(aQ)) return '';
    const owner = workerOwner(id);
    const tag = owner ? supById(owner)?.name : 'Unassigned';
    return `
      <li class="list-item">
        <input type="checkbox" value="${id}" data-side="avail" id="av_${id}">
        <label for="av_${id}">${w.name}</label>
        ${owner && owner !== currentSupId ? `<span class="tag">${tag}</span>` : ''}
      </li>
    `;
  }).join('') || '<li class="list-item"><span class="sup-sub">No workers</span></li>';

  const asgnHtml = assignedIds.map(id => {
    const w = workerById(id);
    if (gQ && !w.name.toLowerCase().includes(gQ)) return '';
    return `
      <li class="list-item">
        <input type="checkbox" value="${id}" data-side="asgn" id="as_${id}">
        <label for="as_${id}">${w.name}</label>
      </li>
    `;
  }).join('') || '<li class="list-item"><span class="sup-sub">No workers assigned</span></li>';

  els.availList.innerHTML = availHtml;
  els.asgnList.innerHTML = asgnHtml;
}

els.btnOpenMap.addEventListener('click', () => openModal(SUPS[0].id));
els.mapClose.addEventListener('click', closeModal);
els.mapCancel.addEventListener('click', closeModal);
els.mapSupSel.addEventListener('change', () => {
  currentSupId = els.mapSupSel.value;
  els.selSupName.textContent = supById(currentSupId).name;
  refreshModalLists();
});
els.allowReassign.addEventListener('change', refreshModalLists);
els.availSearch.addEventListener('input', refreshModalLists);
els.asgnSearch.addEventListener('input', refreshModalLists);

function getChecked(side){
  const box = side === 'avail' ? els.availList : els.asgnList;
  return [...box.querySelectorAll('input[type="checkbox"]:checked')].map(i => i.value);
}
els.btnAdd.addEventListener('click', () => {
  const ids = getChecked('avail');
  const allowRe = els.allowReassign.checked;

  ids.forEach(id => {
    const owner = workerOwner(id);
    if (owner && owner !== currentSupId){
      if (!allowRe) return;
      MAP[owner] = (MAP[owner] || []).filter(x => x !== id);
    }
    if (!MAP[currentSupId]) MAP[currentSupId] = [];
    if (!MAP[currentSupId].includes(id)) MAP[currentSupId].push(id);
  });
  refreshModalLists();
});

els.btnRemove.addEventListener('click', () => {
  const ids = getChecked('asgn');
  MAP[currentSupId] = (MAP[currentSupId] || []).filter(x => !ids.includes(x));
  refreshModalLists();
});

els.mapSave.addEventListener('click', () => { closeModal(); render(); });

// Header menu
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
