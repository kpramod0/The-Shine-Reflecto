document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- Header (Home-style) ---------------- */
  const header = document.getElementById('site-header');
  header.innerHTML = `
    <header class="main-header">
      <a class="brand" href="../../index.html">
        <img src="../../logo.png" alt="Logo" class="logo">
        <div class="company-info">
          <span class="company-name">TSR</span>
          <span class="portal-name">Supervisor Portal</span>
        </div>
      </a>
      <div class="h-icons">
        <button class="icon-btn" aria-label="Notifications">
          <span class="icon-badge">1</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/></svg>
        </button>
        <img class="avatar" src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile">
        <div class="user-dropdown">
          <button class="dropdown-btn" id="ddBtn" aria-haspopup="true" aria-expanded="false">John Smith ▾</button>
          <nav class="dropdown" id="ddMenu" role="menu">
            <a href="#">Profile</a>
            <a href="#">Settings</a>
            <a href="../../index.html">Logout</a>
          </nav>
        </div>
      </div>
    </header>
  `;
  const ddBtn = document.getElementById('ddBtn');
  const ddMenu = document.getElementById('ddMenu');
  const closeMenu = () => { ddBtn.setAttribute('aria-expanded','false'); ddMenu.style.display='none'; };
  ddBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = ddBtn.getAttribute('aria-expanded') === 'true';
    ddBtn.setAttribute('aria-expanded', String(!open));
    ddMenu.style.display = open ? 'none' : 'block';
  });
  document.addEventListener('click', (e) => {
    if (!ddMenu.contains(e.target) && !ddBtn.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  /* ---------------- Footer (Home-style, root-aware) ---------------- */
  const footer = document.getElementById('site-footer');
  footer.innerHTML = `
    <nav class="bottom-nav" aria-label="Primary">
      <a class="nav-link" data-k="home" href="../../index.html">
        🏠<span>Home</span>
      </a>
      <a class="nav-link" data-k="member" href="../../Member/index.html">
        👥<span>Member</span>
      </a>
      <a class="nav-link" data-k="management" href="../../Management/index.html">
        📋<span>Management</span>
      </a>
      <a class="nav-link" data-k="dashboard" href="../../Dashboard/index.html">
        📊<span>Dashboard</span>
      </a>
    </nav>
  `;
  // Mark active
  const p = location.pathname.replace(/\\/g,'/').toLowerCase();
  const mark = k => footer.querySelector(`[data-k="${k}"]`)?.classList.add('active');
  if (p.includes('/member/')) mark('member');
  else if (p.includes('/management/')) mark('management');
  else if (p.includes('/dashboard/')) mark('dashboard');
  else mark('home');

  /* ---------------- Form logic ---------------- */
  const form = document.getElementById('requestForm');
  const requestFor = document.getElementById('requestFor');
  const onBehalf = document.getElementById('onBehalf');
  const nameWrap = document.getElementById('nameWrap');
  const reasonOthers = document.getElementById('reasonOthers');
  const othersWrap = document.getElementById('othersWrap');
  const toast = document.getElementById('toast');

  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.classList.remove('show'), 1400);
  };

  // Show/hide Name field for Worker/Client
  onBehalf.addEventListener('change', () => {
    nameWrap.hidden = (onBehalf.value === '' || onBehalf.value === 'Myself');
  });

  // Show/hide Others text
  reasonOthers.addEventListener('change', () => {
    othersWrap.hidden = !reasonOthers.checked;
  });

  // Helpers
  const err = (id, message='') => {
    const el = document.querySelector(`.err[data-for="${id}"]`);
    if (el) el.textContent = message;
  };

  // Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    if (!requestFor.value){ err('requestFor','Please select'); ok=false; } else err('requestFor');
    if (!onBehalf.value){ err('onBehalf','Please select'); ok=false; } else err('onBehalf');
    if (!ok) return;

    const payload = {
      id: 'REQ-' + Date.now(),
      for: requestFor.value,
      behalf: onBehalf.value,
      name: document.getElementById('nameInput').value.trim(),
      reasons: [...document.querySelectorAll('input[name="reason"]:checked')].map(i=>i.value),
      others: document.getElementById('othersText').value.trim(),
      describe: document.getElementById('describe').value.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const store = JSON.parse(localStorage.getItem('requests') || '[]');
    store.unshift(payload);
    localStorage.setItem('requests', JSON.stringify(store));

    showToast('Request submitted');
    setTimeout(()=>{ window.location.href = 'response.html'; }, 650);
  });

  // Reset clears errors & conditionals
  form.addEventListener('reset', () => {
    ['requestFor','onBehalf'].forEach(k=>err(k));
    nameWrap.hidden = true; othersWrap.hidden = true;
  });
});
