import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, ShieldCheck, MessageSquareWarning, Headset, MapPin, Users
} from 'lucide-react';
import { getRosters } from '../shared/ManagementPortal';
import '../shared/Dashboards.css';

/* ── Mocks / Helpers ───────────────────────────────────── */
function getInitials(name) {
  return (name || 'Client').split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function TechnicalSupportModal({ onClose }) {
  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={e => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h2 className="dash-section-title">Technical Support</h2>
          <button className="dash-btn" onClick={onClose}>Close</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a className="dash-action-card" href="tel:9155361733" style={{ textDecoration: 'none' }}>
            <div className="dash-action-icon bg-pastel-blue">📞</div>
            <div>
              <p className="dash-action-title">Call Support</p>
              <p className="dash-action-subtitle">+91 9155361733</p>
            </div>
          </a>
          <a className="dash-action-card" href="mailto:pramod@theshinereflecto.com" style={{ textDecoration: 'none' }}>
            <div className="dash-action-icon bg-pastel-orange">✉️</div>
            <div>
              <p className="dash-action-title">Send Email</p>
              <p className="dash-action-subtitle">pramod@theshinereflecto.com</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ClientHome({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showTechModal, setShowTechModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const clientName = user?.client || 'Acme Corp';
  
  // Security check: Client only sees rosters assigned to their property
  const allRosters = getRosters();
  const myRosters = useMemo(() => allRosters.filter(r => r.clients.includes(clientName)), [allRosters, clientName]);
  
  const todayStr = '2026-05-24';
  const todayDuties = myRosters.filter(r => r.rosterDate === todayStr);

  if (loading) {
    return (
      <div className="dash-page">
        <div className="skeleton-box" style={{ height: 112, marginBottom: 20 }} />
        <div className="skeleton-box" style={{ height: 200, marginBottom: 20 }} />
      </div>
    );
  }

  return (
    <div className="dash-page" id="client-home-page">
      {/* ── 1. Top Profile Card ──────────────────────────── */}
      <div className="dash-profile-card">
        <div className="dash-avatar">{getInitials(user?.name)}</div>
        <div className="dash-profile-main">
          <h1 className="dash-name">{user?.name || 'Client Contact'}</h1>
          <p className="dash-subtext">Company: <strong>{clientName}</strong></p>
          <div className="dash-profile-meta">
            <span className="dash-status active">Active Client</span>
          </div>
        </div>
      </div>

      {/* ── 2. Assigned Duty Section ───────────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Today's Duty Roster</h2>
            <p className="dash-section-subtitle">Workers assigned to {clientName}</p>
          </div>
        </div>
        
        {todayDuties.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">🏢</div>
            <h3 className="empty-state-title">No duties assigned today</h3>
            <p className="empty-state-desc">There are no active shifts scheduled for your property today.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {todayDuties.map(r => (
              <div key={r.id} className="dash-duty-card">
                <div className="dash-duty-head">
                  <h3 className="dash-duty-client">{r.name}</h3>
                  <span className={`dash-duty-shift ${r.shift.toLowerCase()}`}>
                    {r.shift === 'Day' ? '☀️' : '🌙'} {r.shift} Shift
                  </span>
                </div>
                <div className="dash-duty-detail">
                  <ShieldCheck size={14} /> Supervisor: {r.supervisor.split('(')[0]}
                </div>
                <div className="dash-duty-detail" style={{ marginBottom: 14 }}>
                  <Users size={14} /> Assigned Workers ({r.workers.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {r.workers.map(w => (
                    <span key={w.phone} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                      {w.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Raise a Query & Tools ───────────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Client Support Actions</h2>
            <p className="dash-section-subtitle">Report issues or contact support</p>
          </div>
        </div>
        <div className="dash-query-grid">
          <button className="dash-query-item" onClick={() => navigate('/portal/management', { state: { view: 'complaints' }})}>
            <span className="dash-query-icon bg-pastel-red"><MessageSquareWarning size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Complaint</p>
              <p className="dash-query-subtitle">Submit service feedback</p>
            </div>
          </button>
          
          <button className="dash-query-item" onClick={() => navigate('/portal/management', { state: { view: 'roster' }})}>
            <span className="dash-query-icon bg-pastel-yellow"><CalendarDays size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">View Roster</p>
              <p className="dash-query-subtitle">Check upcoming schedules</p>
            </div>
          </button>

          <button className="dash-query-item" onClick={() => setShowTechModal(true)}>
            <span className="dash-query-icon bg-pastel-cyan"><Headset size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Technical Team</p>
              <p className="dash-query-subtitle">Portal support</p>
            </div>
          </button>
        </div>
      </section>

      {/* ── 4. Immediate Help ──────────────────────────── */}
      <section className="dash-emergency-card">
        <div>
          <h2 className="dash-emergency-title">Need Immediate Help?</h2>
          <p className="dash-emergency-text">Contact our emergency line for urgent service interruptions.</p>
          <div className="dash-contact-row">
            <a href="tel:9155361733" className="dash-contact-link">📞 Call Support</a>
            <button className="dash-contact-link" onClick={() => setShowTechModal(true)}>🛠️ Tech Support</button>
          </div>
        </div>
      </section>

      {showTechModal && <TechnicalSupportModal onClose={() => setShowTechModal(false)} />}
    </div>
  );
}
