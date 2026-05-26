import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import '../pages/shared/Dashboards.css';

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load notifications from localStorage
    const loadNotifs = () => {
      const all = JSON.parse(localStorage.getItem('tsr_notifications') || '[]');
      // Filter for this user
      let myNotifs = all.filter(n => n.mobile === user?.mobile);
      // For Admin, maybe they see all 'Admin' specific ones, but let's assume they see all or ones directed to their mobile.
      if (user?.role === 'admin') {
        myNotifs = all.filter(n => n.roleTarget === 'admin' || n.mobile === user?.mobile);
      }
      setNotifications(myNotifs);
    };

    loadNotifs();
    // In a real app we might use an event listener for storage changes or a websocket.
    window.addEventListener('storage', loadNotifs);
    return () => window.removeEventListener('storage', loadNotifs);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const all = JSON.parse(localStorage.getItem('tsr_notifications') || '[]');
    const updated = all.map(n => {
      if ((n.mobile === user?.mobile) || (user?.role === 'admin' && n.roleTarget === 'admin')) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem('tsr_notifications', JSON.stringify(updated));
    setNotifications(updated.filter(n => (n.mobile === user?.mobile) || (user?.role === 'admin' && n.roleTarget === 'admin')));
  };

  return (
    <div className="dash-notif-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button className="dash-notif-btn" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="dash-notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="dash-notif-dropdown">
          <div className="dash-notif-head">
            <h4 className="dash-notif-title">Notifications</h4>
            {unreadCount > 0 && (
              <button className="dash-notif-mark-read" onClick={markAllAsRead}>Mark all read</button>
            )}
          </div>
          <div className="dash-notif-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                No notifications right now
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className={`dash-notif-item ${!n.read ? 'unread' : ''}`}>
                  <div className="dash-notif-item-icon">🔔</div>
                  <div className="dash-notif-item-body">
                    <p className="dash-notif-item-text">{n.message}</p>
                    <p className="dash-notif-item-time">{n.timestamp || 'Just now'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
