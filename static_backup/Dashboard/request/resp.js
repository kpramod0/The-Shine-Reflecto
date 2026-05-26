document.addEventListener('DOMContentLoaded', () => {
  /* -------- Header (Home-style) -------- */
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
          <svg viewBox="0 0 24 24"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/></svg>
        </button>
        <img class="avatar" src="https://assets.codepen.io/85188/profile-pic.jpg" alt="Profile">
        <div class="user-dropdown">
          <button class="dropdown-btn" id="ddBtn" aria-haspopup="true" aria-expanded="false">
            John Smith ▾
          </button>
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
  ddBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const open = ddBtn.getAttribute('aria-expanded') === 'true';
    ddBtn.setAttribute('aria-expanded', String(!open));
    ddMenu.style.display = open ? 'none' : 'block';
  });
  document.addEventListener('click',(e)=>{
    if(!ddMenu.contains(e.target)&&!ddBtn.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeMenu(); });

  /* -------- Footer (EXACT like Home) -------- */
  const footer = document.getElementById('site-footer');
  footer.innerHTML = `
    <nav class="bottom-nav" aria-label="Primary">
      <a href="../../index.html" class="nav-link" data-k="home">🏠<span>Home</span></a>
      <a href="../../Member/index.html" class="nav-link" data-k="member">👥<span>Member</span></a>
      <a href="../../Management/index.html" class="nav-link" data-k="management">📋<span>Management</span></a>
      <a href="../../Dashboard/index.html" class="nav-link" data-k="dashboard">📊<span>Dashboard</span></a>
    </nav>
  `;
  const p = (location.pathname||'').replace(/\\/g,'/').toLowerCase();
  const mark = k=>footer.querySelector(`[data-k="${k}"]`)?.classList.add('active');
  if(p.includes('/member/')) mark('member');
  else if(p.includes('/management/')) mark('management');
  else if(p.includes('/dashboard/')) mark('dashboard');
  else mark('home');

  /* -------- Data + UI logic -------- */
  const listHost=document.getElementById('list');
  const empty=document.getElementById('empty');
  const q=document.getElementById('q');
  const statusFilter=document.getElementById('statusFilter');
  const clearFilter=document.getElementById('clearFilter');
  const toast=document.getElementById('toast');

  const showToast=(msg)=>{
    toast.textContent=msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t=setTimeout(()=>toast.classList.remove('show'),1400);
  };

  const store=()=>JSON.parse(localStorage.getItem('requests')||'[]');
  const save=(arr)=>localStorage.setItem('requests',JSON.stringify(arr));
  const fmtDate=(iso)=>{const d=new Date(iso);return isNaN(d)?'—':d.toLocaleString();};

  const statusBadge=s=>{
    if(s==='Resolved')return'badge-pill badge--resolved';
    if(s==='Rejected')return'badge-pill badge--rejected';
    if(s==='In Progress')return'badge-pill badge--progress';
    return'badge-pill badge--pending';
  };
  const starTpl=r=>[1,2,3,4,5].map(i=>`<span class="star ${i<=r?'active':''}" data-n="${i}">★</span>`).join('');

  function render(){
    const data=store();
    const term=q.value.trim().toLowerCase();
    const st=statusFilter.value;
    let rows=data;
    if(st!=='all')rows=rows.filter(r=>r.status===st);
    if(term)rows=rows.filter(r=>[r.id,r.for,r.behalf,r.name,(r.reasons||[]).join(' '),r.others,r.describe].join(' ').toLowerCase().includes(term));
    listHost.innerHTML=rows.map(r=>`
      <div class="card-row" data-id="${r.id}">
        <div class="row-head">
          <div class="id">${r.id}</div>
          <span class="${statusBadge(r.status)}">${r.status}</span>
        </div>
        <div class="meta">
          <span><b>For:</b> ${r.for}</span>
          <span><b>On behalf:</b> ${r.behalf}${r.name?' ('+r.name+')':''}</span>
          <span><b>Created:</b> ${fmtDate(r.createdAt)}</span>
        </div>
        <div class="kv">
          <label>Reasons</label><div>${(r.reasons||[]).join(', ')||'—'}${r.others?' • '+r.others:''}</div>
          <label>Description</label><div>${r.describe||'—'}</div>
        </div>
        <div class="rating">
          <span><b>Your Rating:</b></span>
          <div class="stars" data-id="${r.id}">${starTpl(r.rating||0)}</div>
          <input class="comment" data-id="${r.id}" placeholder="Add a short comment..." value="${(r.comment||'').replace(/"/g,'&quot;')}">
          <button class="btn btn--save" data-id="${r.id}">Save</button>
        </div>
      </div>`).join('');
    empty.hidden=rows.length>0;

    document.querySelectorAll('.stars').forEach(stars=>{
      stars.addEventListener('click',e=>{
        const n=parseInt(e.target.dataset.n,10);if(!n)return;
        const id=stars.dataset.id;const all=store();const item=all.find(x=>x.id===id);if(!item)return;
        item.rating=n;item.updatedAt=new Date().toISOString();save(all);
        stars.querySelectorAll('.star').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.n,10)<=n));
        showToast('Rating saved');
      });
    });
    document.querySelectorAll('.btn--save').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.dataset.id;const all=store();const item=all.find(x=>x.id===id);if(!item)return;
        const input=document.querySelector(`.comment[data-id="${id}"]`);
        item.comment=input.value.trim();item.updatedAt=new Date().toISOString();save(all);
        showToast('Comment saved');
      });
    });
  }

  render();
  q.addEventListener('input',render);
  statusFilter.addEventListener('change',render);
  clearFilter.addEventListener('click',()=>{q.value='';statusFilter.value='all';render();});
});
