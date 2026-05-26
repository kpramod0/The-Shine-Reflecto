document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Root + Routes (same helper used elsewhere) ---------- */
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
  };

  /* ---------- Header injection (EXACT like Home) ---------- */
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
            <span class="badge">1</span>
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

  /* ---------- Footer injection (EXACT like Home) ---------- */
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

  // Inject same-as-Home header/footer
  injectHeader();
  injectFooter();

  /* ---------------- Employee Demo Data ---------------- */
  const employeeData = {
    name: "John Smith",
    employeeId: "EMP001",
    pictureUrl: "https://assets.codepen.io/85188/profile-pic.jpg",
    designation: "Supervisor",
    status: "Active",
    joinDate: "2023-01-15"
  };
  document.getElementById('emp-pic').src = employeeData.pictureUrl;
  document.getElementById('emp-name').textContent = employeeData.name;
  document.getElementById('emp-id').textContent = `Employee ID: ${employeeData.employeeId}`;
  document.getElementById('emp-designation').textContent = `Designation: ${employeeData.designation}`;
  const st = document.getElementById('emp-status');
  st.textContent = employeeData.status;
  st.className = 'status-tag ' + (employeeData.status === 'Active' ? 'active' : 'inactive');
  document.getElementById('emp-join-date').textContent = `Joined: ${new Date(employeeData.joinDate).toLocaleDateString()}`;

  /* ---------------- KPIs Demo ---------------- */
  const statsData = {
    week: { worked: 5,  leaves: 1, absences: 0, sub: 'This week' },
    month:{ worked: 20, leaves: 2, absences: 1, sub: 'This month' },
    year: { worked: 247, leaves: 18, absences: 3, sub: 'This year' },
    all:  { worked: 480, leaves: 34, absences: 5, sub: 'Till now' }
  };
  const filterSelect = document.getElementById('statsFilter');
  function updateStats(period) {
    const d = statsData[period] || statsData.all;
    document.getElementById('statDaysWorked').textContent = d.worked;
    document.getElementById('statLeaves').textContent = d.leaves;
    document.getElementById('statAbsences').textContent = d.absences;
    document.getElementById('subDaysWorked').textContent = d.sub;
  }
  updateStats(filterSelect.value);
  filterSelect.addEventListener('change', e => updateStats(e.target.value));

  /* ---------------- Centered Alert ---------------- */
  const centerAlert = document.getElementById('center-alert');
  const centerAlertText = document.getElementById('center-alert-text');
  const centerAlertClose = document.getElementById('center-alert-close');
  function showCenterAlert(msg) {
    centerAlertText.textContent = msg || 'Coming Soon! Stay Updated';
    centerAlert.hidden = false;
  }
  centerAlertClose.addEventListener('click', () => centerAlert.hidden = true);
  centerAlert.addEventListener('click', e => { if (e.target === centerAlert) centerAlert.hidden = true; });

  /* ---------------- Navigation shortcuts ---------------- */
  const path = location.pathname.replace(/\\/g, '/');
  const rootDir = (() => {
    const m = path.match(/^(.*?\/)(Member|Management|Dashboard)\//i);
    return m ? m[1] : (path.endsWith('/') ? path : path.replace(/[^/]*$/, ''));
  })();

  const routes = {
    attendance: rootDir + 'Dashboard/attendance_record.html',
    task:       rootDir + 'Dashboard/Task Manager/index.html',
    request:    rootDir + 'Dashboard/request/index.html',
    material:   rootDir + 'Dashboard/material/index.html',
    tech:       'ALERT',
    roaster:    rootDir + 'Dashboard/Roaster/index.html',
    complaint:  'ALERT',
    ticket:     'ALERT',
    payment:    'ALERT'
  };

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-nav');
      if (!key) return;
      const dest = routes[key];
      if (!dest) return;
      if (dest === 'ALERT') {
        showCenterAlert('Coming Soon! Stay Updated');
      } else {
        window.location.href = dest;
      }
    });
  });
});
