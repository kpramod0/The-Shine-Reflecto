import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/images/logo.png';
import NotificationBell from '../NotificationBell';
import './WorkerNavbar.css';

export default function WorkerNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="worker-navbar">
      <div className="worker-navbar-container">
        <div className="worker-navbar-left">
          <img src={logoImg} alt="TSR Logo" className="worker-logo" />
          <div className="worker-brand">
            <span className="brand-name">TSR</span>
            <span className="brand-subtext">Worker Portal</span>
          </div>
        </div>

        <div className="worker-navbar-right">
          <NotificationBell />

          <div className="worker-profile-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <img 
              src={user?.profileImage || "/assets/images/profile-placeholder.png"} 
              alt="Profile" 
              className="worker-nav-avatar" 
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + (user?.name || "User"); }}
            />
            <div className="worker-nav-info">
              <span className="worker-nav-name">{user?.name || "John Smith"}</span>
              <svg className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => navigate('/worker/profile')}>Profile</div>
                <div className="dropdown-item" onClick={() => navigate('/worker/settings')}>Settings</div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
