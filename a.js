/* ========= Static demo data ========= */
const ALL_WORKERS = [
  "Alice Johnson - EMP001",
  "Bob Smith - EMP002",
  "Carol Davis - EMP003",
  "David Wilson - EMP004",
  "Eve Thompson - EMP005",
  "Frank Harris - EMP006",
];

const ALL_CLIENTS = [
  "TechCorp Industries",
  "Global Systems Ltd",
  "Metro Business Center",
  "Apex Holdings",
  "Nexus Logistics"
];

/* ========= Header & Footer Injection (EXACT match to Home page) ========= */
(function () {
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
    addRoaster: ROOT + "add-roaster.html",
  };

  // ===== HEADER — same as Home (roaster layout + bell) =====
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
              <a href="#">Logout</a>
            </nav>
          </div>
        </div>
      </header>
    `;

    // Dropdown wiring
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

  // ===== FOOTER — EXACT same markup as Home (emoji icons & data-key) =====
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

    // Active nav mark (same logic as Home)
    const p = location.pathname.replace(/\\/g, "/").toLowerCase();
    const mark = (key) => mount.querySelector(`[data-key="${key}"]`)?.classList.add("active");
    if (p.includes("/member/")) mark("member");
    else if (p.includes("/management/")) mark("management");
    else if (p.includes("/dashboard/")) mark("dashboard");
    else mark("home");
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectHeader();
    injectFooter();
  });
})();

/* ========= Roster UI logic ========= */
// Elements
const addRosterBtn = document.getElementById("addRosterBtn");
const rosterForm = document.getElementById("rosterForm");
const cancelRosterBtn = document.getElementById("cancelRosterBtn");

const singleDateBtn = document.getElementById("singleDateBtn");
const dateRangeBtn = document.getElementById("dateRangeBtn");
const singleDateInput = document.getElementById("singleDateInput");
const dateRangeInputs = document.getElementById("dateRangeInputs");

const singleDateEl = document.getElementById("singleDate");
const startDateEl = document.getElementById("startDate");
const endDateEl = document.getElementById("endDate");

const supervisorEl = document.getElementById("supervisor");
const shiftEl = document.getElementById("shift");
const clientEl = document.getElementById("client");

const workerSelect = document.getElementById("workerSelect");
const addWorkerBtn = document.getElementById("addWorkerBtn");
const selectedWorkersWrap = document.getElementById("selectedWorkers");

const submitRosterBtn = document.getElementById("submitRosterBtn");
const addMoreRosterBtn = document.getElementById("addMoreRosterBtn");

const queuedHint = document.getElementById("queuedHint");
const queuedCount = document.getElementById("queuedCount");
const queuePanel = document.getElementById("queuePanel");
const queueList = document.getElementById("queueList");

// State
let currentWorkers = new Set();
let queuedRosters = [];
let batchTakenWorkers = new Set();
let batchTakenClients = new Set();

/* ===== Helpers ===== */
function renderWorkerOptions() {
  const blocked = new Set([...currentWorkers, ...batchTakenWorkers]);
  workerSelect.innerHTML = "";
  const options = ["Search and select worker...", ...ALL_WORKERS.filter(w => !blocked.has(w))];
  for (const label of options) {
    const opt = document.createElement("option");
    opt.value = label;
    opt.textContent = label;
    workerSelect.appendChild(opt);
  }
}

function renderClientOptions() {
  const options = ALL_CLIENTS.filter(c => !batchTakenClients.has(c));
  clientEl.innerHTML = "";
  for (const c of options) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    clientEl.appendChild(opt);
  }
  if (options.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No clients available (already used)";
    clientEl.appendChild(opt);
  }
}

function renumberWorkers() {
  const items = selectedWorkersWrap.querySelectorAll(".worker-item .worker-num");
  items.forEach((badge, idx) => { badge.textContent = String(idx + 1); });
}

function addWorkerToUI(worker) {
  const row = document.createElement("div");
  row.className = "worker-item";
  const left = document.createElement("div");
  left.className = "worker-left";
  const badge = document.createElement("span");
  badge.className = "worker-num";
  badge.textContent = String(selectedWorkersWrap.children.length + 1);
  const text = document.createElement("span");
  text.className = "worker-text";
  text.textContent = worker;
  left.appendChild(badge);
  left.appendChild(text);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn small remove";
  btn.textContent = "✖";
  btn.addEventListener("click", () => {
    currentWorkers.delete(worker);
    row.remove();
    renumberWorkers();
    renderWorkerOptions();
  });
  row.appendChild(left);
  row.appendChild(btn);
  selectedWorkersWrap.appendChild(row);
}

function updateSubmitButton() {
  submitRosterBtn.textContent = queuedRosters.length > 0 ? "✔ Submit All Rosters" : "✔ Submit Roster";
}

function updateQueuedViews() {
  if (queuedRosters.length > 0) {
    queuedHint.classList.remove("hidden");
    queuedCount.textContent = String(queuedRosters.length);
  } else {
    queuedHint.classList.add("hidden");
  }

  if (queuedRosters.length === 0) {
    queuePanel?.classList.add("hidden");
    if (queueList) queueList.innerHTML = "";
    return;
  }
  queuePanel?.classList.remove("hidden");
  if (queueList) {
    queueList.innerHTML = "";
    queuedRosters.forEach((r, i) => {
      const div = document.createElement("div");
      div.className = "queue-item";
      const datePart = r.dates.mode === "single"
        ? `Date: ${r.dates.date || "-"}`
        : `Range: ${r.dates.start || "-"} → ${r.dates.end || "-"}`;
      div.innerHTML = `
        <div class="queue-title">#${i + 1} — ${r.client} — ${r.shift}</div>
        <div class="queue-meta">${datePart}</div>
        <div class="queue-meta">Supervisor: ${r.supervisor}</div>
        <div class="queue-meta">Workers: ${r.workers.join(", ")}</div>
      `;
      queueList.appendChild(div);
    });
  }
}

function clearDates() {
  singleDateEl.value = "";
  startDateEl.value = "";
  endDateEl.value = "";
  endDateEl.min = "";
}

function formToRoster() {
  const isSingle = !singleDateInput.classList.contains("hidden");
  const dates = isSingle
    ? { mode: "single", date: singleDateEl.value }
    : { mode: "range", start: startDateEl.value, end: endDateEl.value };
  return {
    supervisor: supervisorEl.value,
    shift: shiftEl.value,
    client: clientEl.value,
    dates,
    workers: Array.from(currentWorkers),
    createdAt: new Date().toISOString()
  };
}

function resetForm(keepQueue = true) {
  currentWorkers.clear();
  selectedWorkersWrap.innerHTML = "";
  clearDates();
  renderWorkerOptions();
  renderClientOptions();
  if (!keepQueue) {
    queuedRosters = [];
    batchTakenWorkers.clear();
    batchTakenClients.clear();
  }
  updateSubmitButton();
  updateQueuedViews();
}

function datesAreValid(r) {
  if (r.dates.mode === "single") {
    return !!r.dates.date;
  }
  if (!r.dates.start || !r.dates.end) return false;
  return r.dates.end >= r.dates.start;
}

function saveSubmitted(rosters) {
  const key = "tsr_rosters";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  localStorage.setItem(key, JSON.stringify([...existing, ...rosters]));
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  setDateMode("single");
  renderWorkerOptions();
  renderClientOptions();
  updateSubmitButton();
});

/* ===== Events ===== */
addRosterBtn?.addEventListener("click", () => {
  const open = rosterForm.classList.toggle("hidden") === false;
  rosterForm.setAttribute("aria-hidden", open ? "false" : "true");
  addRosterBtn.setAttribute("aria-expanded", open ? "true" : "false");
});

cancelRosterBtn?.addEventListener("click", () => {
  rosterForm.classList.add("hidden");
  rosterForm.setAttribute("aria-hidden", "true");
  addRosterBtn.setAttribute("aria-expanded", "false");
  resetForm(false);
});

function setDateMode(mode) {
  const isSingle = mode === "single";
  singleDateBtn.classList.toggle("active", isSingle);
  singleDateBtn.setAttribute("aria-pressed", String(isSingle));
  dateRangeBtn.classList.toggle("active", !isSingle);
  dateRangeBtn.setAttribute("aria-pressed", String(!isSingle));
  singleDateInput.classList.toggle("hidden", !isSingle);
  dateRangeInputs.classList.toggle("hidden", isSingle);
  if (isSingle) {
    startDateEl.value = "";
    endDateEl.value = "";
    endDateEl.min = "";
  } else {
    singleDateEl.value = "";
  }
}

singleDateBtn?.addEventListener("click", () => setDateMode("single"));
dateRangeBtn?.addEventListener("click", () => setDateMode("range"));

startDateEl?.addEventListener("change", () => {
  endDateEl.min = startDateEl.value || "";
  if (endDateEl.value && startDateEl.value && endDateEl.value < startDateEl.value) {
    endDateEl.value = startDateEl.value;
  }
});

function addCurrentWorker() {
  const value = workerSelect.value;
  if (!value || value === "Search and select worker...") return;
  if (currentWorkers.has(value) || batchTakenWorkers.has(value)) return;
  currentWorkers.add(value);
  addWorkerToUI(value);
  renderWorkerOptions();
  workerSelect.value = "Search and select worker...";
}
workerSelect?.addEventListener("change", addCurrentWorker);
addWorkerBtn?.addEventListener("click", addCurrentWorker);

addMoreRosterBtn?.addEventListener("click", () => {
  const r = formToRoster();
  if (!r.client) { alert("Please select a client."); return; }
  if (!datesAreValid(r)) { alert("Please select a valid date or date range."); return; }
  if (r.workers.length === 0) { alert("Please add at least one worker before queuing this roster."); return; }
  queuedRosters.push(r);
  r.workers.forEach(w => batchTakenWorkers.add(w));
  if (r.client) batchTakenClients.add(r.client);
  updateSubmitButton();
  updateQueuedViews();
  resetForm(true);
  alert("Roster saved to queue. You can create another roster now. See 'Queued Rosters' below.");
});

submitRosterBtn?.addEventListener("click", () => {
  if (queuedRosters.length > 0) {
    const temp = formToRoster();
    if (temp.client && datesAreValid(temp) && temp.workers.length > 0) {
      queuedRosters.push(temp);
    }
    if (queuedRosters.length === 0) { alert("Nothing to submit."); return; }
    saveSubmitted(queuedRosters);
    alert(`Submitted ${queuedRosters.length} roster(s) successfully.`);
    resetForm(false);
    rosterForm.classList.add("hidden");
    rosterForm.setAttribute("aria-hidden", "true");
    addRosterBtn.setAttribute("aria-expanded", "false");
  } else {
    const r = formToRoster();
    if (!r.client) { alert("Please select a client."); return; }
    if (!datesAreValid(r)) { alert("Please select a valid date or date range."); return; }
    if (r.workers.length === 0) { alert("Please add at least one worker before submitting."); return; }
    saveSubmitted([r]);
    alert("Roster created successfully!");
    resetForm(false);
    rosterForm.classList.add("hidden");
    rosterForm.setAttribute("aria-hidden", "true");
    addRosterBtn.setAttribute("aria-expanded", "false");
  }
});
