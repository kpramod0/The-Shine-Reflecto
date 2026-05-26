/* ============================================================
   TSR Supervisor Portal — Home
   - Roaster-style Header injection (WITH original Home bell)
   - Dashboard-style Footer injection (unchanged)
   - Directory metrics behaviors, filters, bars (unchanged)
   ============================================================ */

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
    task:       ROOT + "task.html",
    addRoaster: ROOT + "add-roaster.html",

    // directory
    users:              ROOT + "Member/user.html",
    clients:            ROOT + "Member/client.html",
    clientHod:          ROOT + "Member/user.html?role=hod",
    fieldWorkers:       ROOT + "Member/user.html?role=worker",
    supervisors:        ROOT + "Member/user.html?role=supervisor",
    supervisorWorkers:  ROOT + "Member/sup.html",

    // attendance lists
    marked:  ROOT + "Dashboard/attendance-marked.html",
    pending: ROOT + "Dashboard/attendance-pending.html"
  };

  /* ========== Header (Roaster layout + Home bell icon) ========== */
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
          <!-- ORIGINAL Home notification button kept exactly -->
          <button class="icon-btn" aria-label="Notifications">
            <span class="badge">3</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/>
            </svg>
          </button>

          <img src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile" class="profile-pic" />

          <div class="user-dropdown">
            <button class="dropdown-btn" id="userMenuBtn" aria-haspopup="true" aria-expanded="false">
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
    }
  }

  /* ========== Footer (Dashboard-style) ========== */
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
    const p = location.pathname.replace(/\\/g, "/").toLowerCase();
    const mark = (key) => mount.querySelector(`[data-key="${key}"]`)?.classList.add("active");
    if (p.includes("/member/")) mark("member");
    else if (p.includes("/management/")) mark("management");
    else if (p.includes("/dashboard/")) mark("dashboard");
    else mark("home");
  }

  /* Directory tiles */
  function wireDirectoryTiles() {
    const map = {
      activeClients: ROUTES.clients,
      users: ROUTES.users,
      fieldWorkers: ROUTES.fieldWorkers,
      supervisors: ROUTES.supervisors,
      clientHod: ROUTES.clientHod,
      supervisorWorkers: ROUTES.supervisorWorkers
    };
    document.querySelectorAll(".stat-card[data-tile], .dir-card[data-tile]").forEach(el => {
      el.addEventListener("click", () => {
        const key = el.getAttribute("data-tile");
        const href = map[key];
        if (href) window.location.href = href;
      });
    });
  }

  /* Counts (replace with backend) */
  async function loadDirectoryCounts() {
    const clients = 38, users = 247, workers = 189, supervisors = 15;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `${val}`; };
    set("dirCountClients", clients);
    set("dirCountUsers", users);
    set("dirCountWorkers", workers);
    set("dirCountSup", supervisors);
  }

  /* Attendance & Task (demo logic kept) */
  const supervisorClients = {
    sup1: ["TechCorp Industries", "Global Systems Ltd"],
    sup2: ["Metro Business Center", "Apex Holdings"],
    sup3: ["Nexus Logistics"]
  };
  function populateClientDropdown(supervisorSelectId, clientSelectId) {
    const supVal = document.getElementById(supervisorSelectId)?.value || "all";
    const clientEl = document.getElementById(clientSelectId);
    if (!clientEl) return;
    clientEl.innerHTML = '<option value="all">All Clients</option>';
    const add = (t) => { const o = document.createElement("option"); o.value = t; o.textContent = t; clientEl.appendChild(o); };
    if (supVal === "all") { [...new Set(Object.values(supervisorClients).flat())].forEach(add); }
    else if (supervisorClients[supVal]) { supervisorClients[supVal].forEach(add); }
  }
  function computeAttendanceMetrics({ period, shift, supervisor, client }) {
    let marked = period === "week" ? 76 : period === "month" ? 68 : 72;
    if (shift === "day") marked += 4; if (shift === "night") marked -= 3;
    if (supervisor === "sup1") marked += 2; if (supervisor === "sup2") marked -= 1;
    if (client && client !== "all") marked += (client.length % 5) - 2;
    marked = Math.max(10, Math.min(95, Math.round(marked)));
    return { marked, pending: 100 - marked };
  }
  function computeTaskMetrics({ period, shift, supervisor, client }) {
    let completed = period === "week" ? 58 : period === "month" ? 47 : 52;
    let defaulted = 28, notCompleted = 20;
    if (shift === "day") completed += 3; if (shift === "night") completed -= 2;
    if (supervisor === "sup1") completed += 2; if (supervisor === "sup2") defaulted += 1; if (supervisor === "sup3") notCompleted += 1;
    if (client && client !== "all") { const n = client.length % 3; if (n===0) completed+=2; else if(n===1) defaulted+=2; else notCompleted+=2; }
    const total = completed + defaulted + notCompleted;
    if (total !== 100) { const k = 100 / total; completed = Math.round(completed*k); defaulted = Math.round(defaulted*k); notCompleted = 100 - completed - defaulted; }
    return { completed, defaulted, notCompleted };
  }
  function updateAttendanceBars({ marked, pending }) {
    const a = document.getElementById("markedBar"); const b = document.getElementById("pendingBar");
    if (a) a.style.width = marked + "%", a.textContent = marked + "%";
    if (b) b.style.width = pending + "%", b.textContent = pending + "%";
  }
  function updateTaskBars({ completed, defaulted, notCompleted }) {
    const c = document.getElementById("completedBar"); const d = document.getElementById("defaultedBar"); const n = document.getElementById("notCompletedBar");
    if (c) c.style.width = completed + "%", c.textContent = completed + "%";
    if (d) d.style.width = defaulted + "%", d.textContent = defaulted + "%";
    if (n) n.style.width = notCompleted + "%", n.textContent = notCompleted + "%";
  }
  function refreshAttendanceFromFilters() {
    const supervisor = document.getElementById("attendanceSupervisor")?.value || "all";
    const client     = document.getElementById("attendanceClient")?.value || "all";
    const shift      = document.getElementById("attendanceShift")?.value || "all";
    const period     = document.getElementById("attendancePeriod")?.value || "date";
    updateAttendanceBars(computeAttendanceMetrics({ period, shift, supervisor, client }));
  }
  function refreshTasksFromFilters() {
    const supervisor = document.getElementById("taskSupervisor")?.value || "all";
    const client     = document.getElementById("taskClient")?.value || "all";
    const shift      = document.getElementById("taskShift")?.value || "all";
    const period     = document.getElementById("taskPeriod")?.value || "date";
    updateTaskBars(computeTaskMetrics({ period, shift, supervisor, client }));
  }
  function wireAttendanceFilters() {
    const sup = document.getElementById("attendanceSupervisor");
    const cli = document.getElementById("attendanceClient");
    const shf = document.getElementById("attendanceShift");
    const per = document.getElementById("attendancePeriod");
    sup?.addEventListener("change", () => { populateClientDropdown("attendanceSupervisor", "attendanceClient"); refreshAttendanceFromFilters(); });
    cli?.addEventListener("change", refreshAttendanceFromFilters);
    shf?.addEventListener("change", refreshAttendanceFromFilters);
    per?.addEventListener("change", refreshAttendanceFromFilters);
  }
  function wireTaskFilters() {
    const sup = document.getElementById("taskSupervisor");
    const cli = document.getElementById("taskClient");
    const shf = document.getElementById("taskShift");
    const per = document.getElementById("taskPeriod");
    sup?.addEventListener("change", () => { populateClientDropdown("taskSupervisor", "taskClient"); refreshTasksFromFilters(); });
    cli?.addEventListener("change", refreshTasksFromFilters);
    shf?.addEventListener("change", refreshTasksFromFilters);
    per?.addEventListener("change", refreshTasksFromFilters);
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectHeader();
    injectFooter();

    document.getElementById("addRoasterBtn")?.addEventListener("click", (e) => {
      e.preventDefault(); window.location.href = ROUTES.addRoaster;
    });

    // Directory
    wireDirectoryTiles();
    loadDirectoryCounts();

    // Attendance list drilldowns
    document.getElementById("markedBar")?.addEventListener("click", () => { window.location.href = ROUTES.marked; });
    document.getElementById("pendingBar")?.addEventListener("click", () => { window.location.href = ROUTES.pending; });

    // Scanner (demo)
    document.getElementById("attendanceScannerBtn")?.addEventListener("click", () => {
      alert("Attendance Scanner Activated! (Demo)");
    });

    // Filters
    wireAttendanceFilters();
    wireTaskFilters();
    populateClientDropdown("attendanceSupervisor", "attendanceClient");
    populateClientDropdown("taskSupervisor", "taskClient");
    refreshAttendanceFromFilters();
    refreshTasksFromFilters();
  });
})();
