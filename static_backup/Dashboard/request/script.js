document.addEventListener('DOMContentLoaded', () => {
  /* ======= Header (Home-style) ======= */
  const H = document.getElementById('site-header');
  if (H) {
    H.innerHTML = `
      <header class="main-header">
        <a class="brand" href="../../index.html">
          <img class="logo" src="../../logo.png" alt="Logo">
          <div class="company-info">
            <span class="company-name">TSR</span>
            <span class="portal-name">Supervisor Portal</span>
          </div>
        </a>
        <div class="h-icons">
          <button class="icon-btn" aria-label="Notifications">
            <span class="icon-badge">2</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/></svg>
          </button>

          <img class="avatar" src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile">

          <div class="user-dropdown">
            <button class="dropdown-btn" id="userMenuBtn" aria-haspopup="true" aria-expanded="false">
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

    // Dropdown behavior
    const btn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userDropdown');
    const close = () => { btn.setAttribute('aria-expanded', 'false'); menu.style.display = 'none'; };
    btn.addEventListener('click', e => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      menu.style.display = open ? 'none' : 'block';
      e.stopPropagation();
    });
    document.addEventListener('click', e => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ======= Footer (Home-style bottom nav) ======= */
  const F = document.getElementById('site-footer');
  if (F) {
    F.innerHTML = `
      <nav class="bottom-nav" aria-label="Primary">
        <a class="nav-link" data-k="home" href="../../index.html">🏠<span>Home</span></a>
        <a class="nav-link" data-k="member" href="../../Member/index.html">👥<span>Member</span></a>
        <a class="nav-link" data-k="management" href="../../Management/index.html">📋<span>Management</span></a>
        <a class="nav-link" data-k="dashboard" href="../index.html">📊<span>Dashboard</span></a>
      </nav>`;

    const path = location.pathname.replace(/\\/g, "/").toLowerCase();
    const mark = k => F.querySelector(`[data-k="${k}"]`)?.classList.add("active");
    if (path.includes('/member/')) mark('member');
    else if (path.includes('/management/')) mark('management');
    else if (path.includes('/dashboard/')) mark('dashboard');
    else mark('home');
  }

  /* ======= Navigation for Request Cards ======= */
  document.getElementById('addRequest')?.addEventListener('click', () => {
    window.location.href = "add.html";
  });
  document.getElementById('requestResponse')?.addEventListener('click', () => {
    window.location.href = "response.html";
  });
});
