document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Header (Home-style) ---------- */
  const headerMount = document.getElementById('site-header');
  if (headerMount) {
    headerMount.innerHTML = `
      <header class="main-header">
        <div class="header-left">
          <a class="brand" href="../../index.html">
            <img src="../../logo.png" alt="Company Logo" class="logo" />
            <div class="company-info">
              <span class="company-name">TSR</span>
              <span class="portal-name">Supervisor Portal</span>
            </div>
          </a>
        </div>
        <div class="header-right">
          <button class="notification" aria-label="Open notifications">
            <span aria-hidden="true">🔔</span><span class="badge">1</span>
          </button>
          <img src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile" class="profile-pic" />
          <div class="user-dropdown">
            <button class="dropdown-btn" aria-haspopup="true" aria-expanded="false">
              John Smith <span aria-hidden="true">▼</span>
            </button>
            <div class="dropdown-content" role="menu">
              <a href="#" role="menuitem">Profile</a>
              <a href="#" role="menuitem">Settings</a>
              <a href="#" role="menuitem">Logout</a>
            </div>
          </div>
        </div>
      </header>
    `;

    // Dropdown toggle
    const btn = headerMount.querySelector('.dropdown-btn');
    const dd  = headerMount.querySelector('.dropdown-content');
    if (btn && dd) {
      btn.addEventListener('click', (e) => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        dd.style.display = open ? 'none' : 'block';
        e.stopPropagation();
      });
      document.addEventListener('click', (e) => {
        if (!dd.contains(e.target) && !btn.contains(e.target)) {
          dd.style.display = 'none';
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ---------- Footer (Home-style, root-aware) ---------- */
  const footerMount = document.getElementById('site-footer');
  if (footerMount) {
    footerMount.innerHTML = `
      <nav class="bottom-nav" aria-label="Primary">
        <a href="../../index.html" class="nav-link" data-key="home">
          <svg viewBox="0 0 256 256"><path d="M213.38,109.62l-80-80a8,8,0,0,0-10.76,0l-80,80a8,8,0,0,0-1.7,11.87A8,8,0,0,0,48,124H64v80a16,16,0,0,0,16,16h80a16,16,0,0,0,16-16V124h16a8,8,0,0,0,6.68-12.51Z"/></svg>
          <span>Home</span>
        </a>
        <a href="../../Member/index.html" class="nav-link" data-key="member">
          <svg viewBox="0 0 256 256"><path d="M234.38,210a112.33,112.33,0,0,0-212.76,0a8,8,0,1,0,13.76,8a96.34,96.34,0,0,1,185.24,0a8,8,0,1,0,13.76-8Z"/></svg>
          <span>Member</span>
        </a>
        <a href="../../Management/index.html" class="nav-link" data-key="management">
          <svg viewBox="0 0 256 256"><path d="M224,64H176V56a24,24,0,0,0-24-24H104A24,24,0,0,0,80,56v8H32A16,16,0,0,0,16,80V208a16,16,0,0,0,16,16H224A16,16,0,0,0,16-16Z"/></svg>
          <span>Management</span>
        </a>
        <a href="../index.html" class="nav-link" data-key="dashboard">
          <svg viewBox="0 0 256 256"><path d="M240,200V48a16,16,0,0,0-16-16H32A16,16,0,0,0,16,48V200a16,16,0,0,0,16,16H224A16,16,0,0,0,240,200Z"/></svg>
          <span>Dashboard</span>
        </a>
      </nav>
    `;

    // Active link highlight
    const p = (location.pathname || '').replace(/\\/g,'/').toLowerCase();
    footerMount.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    if (p.includes('/member/'))         footerMount.querySelector('[data-key="member"]')?.classList.add('active');
    else if (p.includes('/management/'))footerMount.querySelector('[data-key="management"]')?.classList.add('active');
    else if (p.includes('/dashboard/')) footerMount.querySelector('[data-key="dashboard"]')?.classList.add('active');
    else                                footerMount.querySelector('[data-key="home"]')?.classList.add('active');
  }

  /* ---------- Card Navigation ---------- */
  const history   = document.getElementById('card-history');
  const round     = document.getElementById('card-round');
  const materials = document.getElementById('card-materials');

  const go = (el, href) => {
    if (!el) return;
    el.addEventListener('click', () => { window.location.href = href; });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = href; }
    });
  };a

  // Navigate relative to Task Manager folder
  go(history,   'task.html');
  go(round,     'rindex.html');
  go(materials, 'mindex.html');
});
