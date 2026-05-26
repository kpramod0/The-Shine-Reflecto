

/* ---------- Root + Routes ---------- */
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
  dashboard:  ROOT + "Dashboard/index.html",
  taskList:   ROOT + "task-list.html"
};

/* ---------- Header (same as Home) ---------- */
function injectHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  mount.innerHTML = `
    <header class="main-header">
      <div class="header-left">
        <a class="brand" href="${ROUTES.home}" aria-label="Home">
          <img src="${ROOT}logo.png" alt="Company Logo" class="logo" />
          <div class="company-info">
            <span class="company-name">TSR</span>
            <span class="portal-name">Supervisor Portal</span>
          </div>
        </a>
      </div>

      <div class="header-right">
        <button class="icon-btn" aria-label="Notifications">
          <span class="badge">3</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/>
          </svg>
        </button>

        <img src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile" class="profile-pic" />

        <div class="user-dropdown">
          <button class="dropdown-btn" id="userMenuBtn" aria-haspopup="true" aria-controls="userDropdown" aria-expanded="false">
            John Smith <span class="arrow-down">▼</span>
          </button>
          <nav class="dropdown-content" id="userDropdown" role="menu">
            <a href="#">Profile</a>
            <a href="#">Settings</a>
            <a href="${ROUTES.home}">Logout</a>
          </nav>
        </div>
      </div>
    </header>
  `;

  // Dropdown wiring (click-outside + Esc)
  const btn = document.getElementById("userMenuBtn");
  const menu = document.getElementById("userDropdown");
  if (btn && menu) {
    btn.addEventListener("click", (e) => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.style.display = open ? "none" : "block";
      e.stopPropagation();
    });
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        btn.setAttribute("aria-expanded", "false");
        menu.style.display = "none";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        btn.setAttribute("aria-expanded", "false");
        menu.style.display = "none";
        btn.focus();
      }
    });
  }
}

/* ---------- Footer (same as Home; emoji links) ---------- */
function injectFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;

  mount.innerHTML = `
    <nav class="bottom-nav" aria-label="Primary">
      <a class="nav-link" data-key="home" href="${ROUTES.home}">🏠<span>Home</span></a>
      <a class="nav-link" data-key="member" href="${ROUTES.member}">👥<span>Member</span></a>
      <a class="nav-link" data-key="management" href="${ROUTES.management}">📋<span>Management</span></a>
      <a class="nav-link" data-key="dashboard" href="${ROUTES.dashboard}">📊<span>Dashboard</span></a>
    </nav>
  `;

  // Active state (same logic as Home)
  const p = location.pathname.replace(/\\/g, "/").toLowerCase();
  const mark = (key) => mount.querySelector(`[data-key="${key}"]`)?.classList.add("active");
  if (p.includes("/member/")) mark("member");
  else if (p.includes("/management/")) mark("management");
  else if (p.includes("/dashboard/")) mark("dashboard");
  else mark("home");
}

/* ---------- Demo Org Data ---------- */
const ORG = {
  supervisors: [
    { id:"sup1", name:"John Supervisor",
      clients:["TechCorp Industries","Global Systems Ltd"],
      workers:["Parmeshwar","Ravi","Leena"] },
    { id:"sup2", name:"Sarah Manager",
      clients:["Metro Business Center","Apex Holdings"],
      workers:["Ashwini","Harish","Divya"] },
    { id:"sup3", name:"Alex Lead",
      clients:["Nexus Logistics"],
      workers:["Imran","Kiran"] }
  ],
  subAreas: {
    "Public Areas": ["Lobby","Corridors","Staircase","Restrooms"],
    "Back Area": ["Service Corridor","Loading Dock","MEP Room"],
    "Guestrooms": ["Rooms – Floor 1","Rooms – Floor 2","Suites"],
    "Others": []
  }
};

/* ---------- Toast ---------- */
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}

/* ---------- Populate Supervisor / Clients ---------- */
function fillSupervisors() {
  const supSel = document.getElementById("supervisorSel");
  supSel.innerHTML = ORG.supervisors.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  supSel.value = ORG.supervisors[0]?.id || "";
  updateClientsAndWorkers();
}
function updateClientsAndWorkers() {
  const sid = document.getElementById("supervisorSel").value;
  const sup = ORG.supervisors.find(s => s.id === sid);

  // Clients
  const clientSel = document.getElementById("clientSel");
  clientSel.innerHTML = `<option value="" disabled selected>Select…</option>` +
    (sup?.clients || []).map(c=>`<option>${c}</option>`).join("");

  // Workers multi dropdown
  buildWorkersDropdown(sup?.workers || []);
}

/* ---------- Workers multi-select ---------- */
let workersSelected = new Set();

function buildWorkersDropdown(list){
  workersSelected.clear();
  const panel = document.getElementById("workersPanel");
  const btn   = document.getElementById("workersBtn");
  const addBtn = document.getElementById("addMoreBtn");
  const countEl = document.getElementById("workersCount");
  panel.innerHTML = "";

  if (!list.length){
    panel.innerHTML = `<div class="mselect-empty">No workers under this supervisor.</div>`;
  } else {
    list.forEach((name, idx) => {
      const id = `wrk_${idx}`;
      const row = document.createElement("label");
      row.className = "mselect-item";
      row.innerHTML = `
        <input type="checkbox" id="${id}" value="${name}" />
        <span>${name}</span>
      `;
      panel.appendChild(row);
    });
  }

  // Open/close
  const openPanel = () => { panel.classList.add("open"); btn.setAttribute("aria-expanded","true"); };
  const closePanel = () => { panel.classList.remove("open"); btn.setAttribute("aria-expanded","false"); };
  const toggle = (e) => { e?.stopPropagation(); panel.classList.toggle("open"); btn.setAttribute("aria-expanded", String(panel.classList.contains("open"))); };

  btn.onclick = toggle;
  addBtn.onclick = openPanel;
  document.addEventListener("click", closePanel);
  panel.addEventListener("click", e => e.stopPropagation());

  // Selection
  panel.querySelectorAll('input[type="checkbox"]').forEach(chk=>{
    chk.addEventListener("change", () => {
      if (chk.checked) workersSelected.add(chk.value);
      else workersSelected.delete(chk.value);
      renderWorkersButton();
    });
  });

  function renderCountBadge(n){
    if (n > 0) { countEl.hidden = false; countEl.textContent = n; }
    else { countEl.hidden = true; }
  }

  function renderWorkersButton(){
    const arr = Array.from(workersSelected);
    renderCountBadge(arr.length);

    if (!arr.length){
      btn.innerHTML = "Select workers…";
      addBtn.hidden = true;
      return;
    }
    btn.innerHTML = arr.map((n,i)=>`<span class="chip"><span class="num">${i+1}.</span> ${n}</span>`).join(" ");
    addBtn.hidden = !(arr.length === 1);
  }

  buildWorkersDropdown._render = renderWorkersButton;
  renderWorkersButton();
}
function renderWorkersButton(){ buildWorkersDropdown._render && buildWorkersDropdown._render(); }
function getSelectedWorkers(){ return Array.from(workersSelected); }

/* ---------- Schedule toggle ---------- */
function wireSchedule() {
  const radios = document.querySelectorAll('input[name="scheduleMode"]');
  const singleWrap = document.getElementById("singleDayWrap");
  const rangeWrap  = document.getElementById("rangeWrap");

  function showSingle(){
    singleWrap.hidden = false;
    rangeWrap.hidden  = true;
    document.getElementById("startDT").value = "";
    document.getElementById("endDT").value   = "";
  }
  function showRange(){
    singleWrap.hidden = true;
    rangeWrap.hidden  = false;
    document.getElementById("singleDate").value  = "";
    document.getElementById("singleShift").value = "";
    document.getElementById("singleTime").value  = "";
  }

  radios.forEach(r => r.addEventListener("change", () => {
    const mode = document.querySelector('input[name="scheduleMode"]:checked').value;
    (mode === "single") ? showSingle() : showRange();
  }));

  showSingle();
}

/* ---------- Service Others + SubAreas ---------- */
function wireServiceOthers() {
  const svcSel = document.getElementById("serviceSel");
  const svcOtherWrap = document.getElementById("serviceOtherWrap");
  svcSel.addEventListener("change", () => {
    svcOtherWrap.hidden = (svcSel.value !== "Others");
  });

  const areaSel = document.getElementById("areaSel");
  const areaOtherWrap = document.getElementById("areaOtherWrap");
  const subSel = document.getElementById("subAreaSel");
  const subOtherWrap = document.getElementById("subAreaOtherWrap");

  function populateSubAreas() {
    const val = areaSel.value;
    areaOtherWrap.hidden = (val !== "Others");
    subOtherWrap.hidden = true;
    subSel.innerHTML = `<option value="" disabled selected>Select…</option>`;

    if (!val) return;
    if (val === "Others") {
      subSel.innerHTML += `<option value="Others">Others</option>`;
      subSel.value = "Others";
      subOtherWrap.hidden = false;
      return;
    }
    (ORG.subAreas[val] || []).forEach(sa => { subSel.innerHTML += `<option>${sa}</option>`; });
    subSel.innerHTML += `<option value="Others">Others</option>`;
  }

  areaSel.addEventListener("change", populateSubAreas);
  subSel.addEventListener("change", () => {
    subOtherWrap.hidden = (subSel.value !== "Others");
  });
}

/* ---------- Attachments preview ---------- */
function wireAttachments() {
  const input = document.getElementById("photos");
  const gallery = document.getElementById("preview");
  const files = [];

  function render() {
    gallery.innerHTML = files.map((f,i)=>`
      <div class="thumb">
        <img src="${f.data}" alt="Attachment ${i+1}" />
        <button type="button" aria-label="Remove" data-i="${i}">✕</button>
      </div>
    `).join("");
    gallery.querySelectorAll("button").forEach(btn=>{
      btn.addEventListener("click", ()=>{ files.splice(+btn.dataset.i,1); render(); });
    });
  }

  input.addEventListener("change", async (e)=>{
    const list = Array.from(e.target.files || []);
    for (const f of list) {
      const data = await fileToDataURL(f);
      files.push({name:f.name, type:f.type, size:f.size, data});
    }
    render();
    input.value = "";
  });

  wireAttachments._getFiles = () => files;
}
function fileToDataURL(file){
  return new Promise(res=>{
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(file);
  });
}

/* ---------- Read + Validate + Save ---------- */
function readForm() {
  const sid = document.getElementById("supervisorSel").value;
  const sup = ORG.supervisors.find(s => s.id === sid);
  const client = document.getElementById("clientSel").value || null;

  const workers = getSelectedWorkers();

  const name = (document.getElementById("taskName").value || "").trim();
  const priority = document.getElementById("prioritySel").value;
  const details = document.getElementById("details").value.trim();

  const mode = document.querySelector('input[name="scheduleMode"]:checked').value;
  const schedule = (mode === "single")
    ? {
        mode,
        date: document.getElementById("singleDate").value || null,
        shift: document.getElementById("singleShift").value || null,
        time: document.getElementById("singleTime").value || null
      }
    : {
        mode,
        start: document.getElementById("startDT").value || null,
        end: document.getElementById("endDT").value || null
      };

  const service = document.getElementById("serviceSel").value === "Others"
    ? (document.getElementById("serviceOther").value || "Others").trim()
    : document.getElementById("serviceSel").value || null;

  const areaVal = document.getElementById("areaSel").value;
  const area = areaVal === "Others"
    ? (document.getElementById("areaOther").value || "Others").trim()
    : areaVal || null;

  const subSel = document.getElementById("subAreaSel").value;
  const subArea = subSel === "Others"
    ? (document.getElementById("subAreaOther").value || "Others").trim()
    : subSel || null;

  const attachments = (wireAttachments._getFiles ? wireAttachments._getFiles() : []).slice();

  return {
    createdAt: new Date().toISOString(),
    supervisor: sup ? {id:sup.id, name:sup.name} : null,
    client,
    workers,
    name,
    priority,
    details,
    schedule,
    serviceDetails: { service, area, subArea },
    attachments
  };
}
function validateTask(t){
  if (!t.name) return "Please enter a task name.";
  if (!t.supervisor) return "Select a supervisor.";
  if (!t.client) return "Select a client.";
  if (!t.workers?.length) return "Select at least one field worker.";
  if (t.schedule.mode === "single"){
    if (!t.schedule.date) return "Pick a date for Single Day schedule.";
    if (!t.schedule.shift) return "Choose a shift for Single Day schedule.";
  } else {
    if (!t.schedule.start || !t.schedule.end) return "Provide both start and end date-times.";
    if (new Date(t.schedule.start) > new Date(t.schedule.end)) return "End time must be after start time.";
  }
  if (!t.serviceDetails.service) return "Select a service (or describe in Others).";
  if (!t.serviceDetails.area) return "Select a service area (or describe in Others).";
  if (!t.serviceDetails.subArea) return "Select a sub area (or describe in Others).";
  return null;
}
function saveTask(){
  const t = readForm();
  const err = validateTask(t);
  if (err) { toast(err); return; }

  const key = "tsr_tasks";
  const list = JSON.parse(localStorage.getItem(key) || "[]" );
  list.push(t);
  localStorage.setItem(key, JSON.stringify(list));
  toast("Task saved ✔");
  setTimeout(resetForm, 400);
}

/* ---------- Reset ---------- */
function resetForm(){
  workersSelected.clear();
  renderWorkersButton();

  document.getElementById("taskName").value = "";
  document.getElementById("prioritySel").value = "Medium";
  document.getElementById("details").value = "";

  document.querySelector('input[name="scheduleMode"][value="single"]').checked = true;
  document.getElementById("singleDate").value = "";
  document.getElementById("singleShift").value = "";
  document.getElementById("singleTime").value = "";
  document.getElementById("startDT").value = "";
  document.getElementById("endDT").value = "";
  document.getElementById("rangeWrap").hidden = true;
  document.getElementById("singleDayWrap").hidden = false;

  document.getElementById("serviceSel").value = "";
  document.getElementById("serviceOtherWrap").hidden = true;
  document.getElementById("serviceOther").value = "";
  document.getElementById("areaSel").value = "";
  document.getElementById("areaOtherWrap").hidden = true;
  document.getElementById("areaOther").value = "";
  document.getElementById("subAreaSel").innerHTML = `<option value="" disabled selected>Select…</option>`;
  document.getElementById("subAreaOtherWrap").hidden = true;
  document.getElementById("subAreaOther").value = "";

  document.getElementById("preview").innerHTML = "";

  const countEl = document.getElementById("workersCount");
  if (countEl) countEl.hidden = true;
  const addBtn = document.getElementById("addMoreBtn");
  if (addBtn) addBtn.hidden = true;
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  injectHeader();
  injectFooter();

  fillSupervisors();
  document.getElementById("supervisorSel").addEventListener("change", updateClientsAndWorkers);

  wireSchedule();
  wireServiceOthers();
  wireAttachments();

  document.getElementById("saveTask").addEventListener("click", saveTask);
  document.getElementById("resetForm").addEventListener("click", resetForm);

  const listLink = document.getElementById("taskListLink");
  if (listLink) listLink.href = ROUTES.taskList;
});
