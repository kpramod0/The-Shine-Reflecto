import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo.png';
import NotificationBell from '../components/NotificationBell';
import './PortalLayout.css';

const NAV = [
  { path: 'home',       icon: '🏠', label: 'Home'       },
  { path: 'member',     icon: '👥', label: 'Member'     },
  { path: 'management', icon: '📋', label: 'Management' },
  { path: 'dashboard',  icon: '📊', label: 'Dashboard'  },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const roleColors = {
    admin: '#9BA432', supervisor: '#3FA7A5', client: '#6366F1',
    worker: '#F59E0B', staff: '#EC4899',
  };
  const roleColor = roleColors[user?.role] || '#9BA432';

  return (
    <div className="portal">
      {/* Sidebar */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-sidebar__logo">
          <img src={logoImg} alt="TSR" />
        </div>

        <nav className="portal-nav">
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={`/portal/${item.path}`}
              className={({ isActive }) => `portal-nav__item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="portal-nav__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="portal-sidebar__user">
          <div className="portal-sidebar__avatar" style={{ background: roleColor }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <p className="portal-sidebar__name">{user?.name}</p>
            <p className="portal-sidebar__role" style={{ color: roleColor }}>
              {user?.role?.toUpperCase()}
            </p>
          </div>
        </div>

        <button className="portal-sidebar__logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main */}
      <div className="portal-main">
        {/* Header */}
        <header className="portal-header">
          <button className="portal-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="portal-header__right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell />
            <div className="portal-role-badge" style={{ background: `${roleColor}22`, color: roleColor }}>
              {user?.role?.toUpperCase()}
            </div>
            <button className="portal-header__logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {/* Page content */}
        <main className="portal-content">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="portal-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
