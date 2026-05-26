// Header dropdown + routing and card navigation
document.addEventListener('DOMContentLoaded', () => {
  // User dropdown
  const btn = document.getElementById('userMenuBtn');
  const menu = document.getElementById('userDropdown');
  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
      e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Card navigation (go to each section's index page)
  const go = (id, href) => {
    const el = document.getElementById(id);
    if (!el) return;
    const run = () => window.location.href = href;
    el.addEventListener('click', run);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
    });
  };
  go('card-users',   'user.html');
  go('card-clients', 'client.html');
  go('card-sup',     'sup.html');

  // Inject EXACT Dashboard footer into #site-footer
  const footerMount = document.getElementById('site-footer');
  if (footerMount) {
    footerMount.innerHTML = `
      <nav class="bottom-nav" aria-label="Primary">
        <a href="../index.html" class="nav-link" data-key="home">🏠<span>Home</span></a>
        <a href="../Member/index.html" class="nav-link" data-key="member">👥<span>Member</span></a>
        <a href="../Management/index.html" class="nav-link" data-key="management">📋<span>Management</span></a>
        <a href="../Dashboard/index.html" class="nav-link" data-key="dashboard">📊<span>Dashboard</span></a>
      </nav>
    `;
  }

  // Highlight bottom nav by current path
  const path = location.pathname.toLowerCase();
  document.querySelectorAll('.bottom-nav .nav-link').forEach(a => a.classList.remove('active'));
  if (path.includes('/member/')) {
    document.querySelector('.bottom-nav [data-key="member"]')?.classList.add('active');
  } else if (path.includes('/dashboard/')) {
    document.querySelector('.bottom-nav [data-key="dashboard"]')?.classList.add('active');
  } else if (path.includes('/services/')) {
    document.querySelector('.bottom-nav [data-key="service"]')?.classList.add('active');
  } else {
    document.querySelector('.bottom-nav [data-key="home"]')?.classList.add('active');
  }
});
