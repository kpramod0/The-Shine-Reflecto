import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck, CalendarDays, AlertTriangle, ShieldCheck,
  MessageSquareWarning, Package, Headset, CheckCircle, XCircle, MapPin, Camera
} from 'lucide-react';
import { getAttendanceScans, getTasks, SUPERVISOR_SCOPES, getRosters, getVisits, saveVisits, addNotification, saveAttendanceScans } from '../shared/ManagementPortal';
import '../shared/Dashboards.css';

/* ── Mocks / Helpers ───────────────────────────────────── */
function getInitials(name) {
  return (name || 'Supervisor').split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Components ────────────────────────────────────────── */
function StatCard({ label, value, note, tone, icon: Icon }) {
  const iconColors = {
    green: ['#ECFDF5', '#059669'],
    blue: ['#EFF6FF', '#2563EB'],
    orange: ['#FFF7ED', '#EA580C']
  };
  const [bg, color] = iconColors[tone] || iconColors.blue;

  return (
    <article className={`dash-stat-card ${tone}`}>
      <div className="dash-stat-top">
        <div className="dash-stat-icon" style={{ background: bg, color }}>
          <Icon size={22} />
        </div>
      </div>
      <p className="dash-stat-value">{value}</p>
      <p className="dash-stat-label">{label}</p>
      <p className="dash-stat-note">{note}</p>
    </article>
  );
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

export default function SupervisorHome({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showTechModal, setShowTechModal] = useState(false);
  
  // Visit state
  const [visitClient, setVisitClient] = useState('');
  const [visitLocation, setVisitLocation] = useState('Fetching...');
  const [visitNotes, setVisitNotes] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      setVisitLocation('Lat: 12.9716, Lng: 77.5946');
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const scope = SUPERVISOR_SCOPES[user?.mobile] || { clients: [], workers: [] };
  const workerPhones = scope.workers.map(w => w.phone);
  
  const allScans = getAttendanceScans();
  const ownScans = allScans.filter(s => s.workerMobile === user?.mobile);
  const teamScansToday = allScans.filter(s => workerPhones.includes(s.workerMobile) && s.date === '2026-05-24');
  
  const activeTasksCount = getTasks().filter(t => t.supervisorMobile === user?.mobile && t.status === 'In Progress').length;
  const pendingApprovals = allScans.filter(s => workerPhones.includes(s.workerMobile) && s.status === 'Pending Approval');
  const todayVisits = getVisits().filter(v => v.supervisorMobile === user?.mobile && v.date === '2026-05-24');

  const handleApproveAttendance = (scanId, note) => {
    const scans = getAttendanceScans();
    const updated = scans.map(s => {
      if (s.id === scanId) {
        return { ...s, status: 'Present', notes: s.notes + ' | Sup: ' + note };
      }
      return s;
    });
    saveAttendanceScans(updated);
    addNotification(user.mobile, user.name, 'Attendance approved.');
    // Trigger re-render by slightly mutating state or via context, but for demo we just reload or rely on next poll.
    window.location.reload(); 
  };

  const handleRejectAttendance = (scanId, note) => {
    const scans = getAttendanceScans();
    const updated = scans.map(s => {
      if (s.id === scanId) {
        return { ...s, status: 'Unofficial Leave', notes: s.notes + ' | Sup: ' + note };
      }
      return s;
    });
    saveAttendanceScans(updated);
    addNotification(user.mobile, user.name, 'Attendance rejected.');
    window.location.reload();
  };

  const handleMarkVisit = () => {
    if (!visitClient) { alert('Select a client'); return; }
    const visits = getVisits();
    const newVisit = {
      id: 'V_' + Date.now(),
      date: '2026-05-24',
      client: visitClient,
      supervisor: user?.name,
      supervisorMobile: user?.mobile,
      type: 'Property Round',
      checkIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Completed',
      notes: visitNotes,
      location: visitLocation
    };
    saveVisits([newVisit, ...visits]);
    setVisitClient('');
    setVisitNotes('');
    alert('Visit marked successfully.');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="dash-page">
        <div className="skeleton-box" style={{ height: 112, marginBottom: 20 }} />
        <div className="skeleton-box" style={{ height: 200, marginBottom: 20 }} />
      </div>
    );
  }

  return (
    <div className="dash-page" id="supervisor-home-page">
      {/* ── 1. Top Profile Card ──────────────────────────── */}
      <div className="dash-profile-card">
        <div className="dash-avatar">{getInitials(user?.name)}</div>
        <div className="dash-profile-main">
          <h1 className="dash-name">{user?.name || 'Supervisor'}</h1>
          <p className="dash-subtext">Supervisor • Mobile: {user?.mobile}</p>
          <div className="dash-profile-meta">
            <span className="dash-status active">Active</span>
          </div>
        </div>
        <button className="dash-btn" onClick={() => navigate('/portal/management', { state: { view: 'roster' }})}>Manage Rosters</button>
      </div>

      {/* ── 2. Team Performance Summary ────────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Team Performance Today</h2>
            <p className="dash-section-subtitle">Overview of your managed workers</p>
          </div>
        </div>
        <div className="dash-summary-grid">
          <StatCard label="Total Workers" value={scope.workers.length} note="Assigned to you" tone="blue" icon={ShieldCheck} />
          <StatCard label="Present Today" value={teamScansToday.filter(s => s.status === 'Present').length} note="Approved scans" tone="green" icon={CalendarCheck} />
          <StatCard label="Active Tasks" value={activeTasksCount} note="In Progress" tone="orange" icon={AlertTriangle} />
        </div>
      </section>

      {/* ── 3. Attendance Approval Panel ───────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Pending Attendance Approvals</h2>
            <p className="dash-section-subtitle">Review check-outs from your team</p>
          </div>
          {pendingApprovals.length > 0 && <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{pendingApprovals.length} Pending</span>}
        </div>
        
        {pendingApprovals.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">✅</div>
            <h3 className="empty-state-title">All caught up!</h3>
            <p className="empty-state-desc">No pending attendance approvals right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {pendingApprovals.map(s => (
              <div key={s.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 14, color: '#0F172A' }}>{s.workerName}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{s.client} • {s.shift} Shift</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748B' }}>In: {s.checkIn} | Out: {s.checkOut || 'Active'}</p>
                  </div>
                  {s.checkOut && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <button className="dash-btn" style={{ background: '#DCFCE7', color: '#15803D' }} onClick={() => handleApproveAttendance(s.id, 'Marked on time')}>Approve</button>
                      <button className="dash-btn" style={{ background: '#FEE2E2', color: '#DC2626' }} onClick={() => handleRejectAttendance(s.id, 'Location mismatch')}>Reject</button>
                    </div>
                  )}
                  {!s.checkOut && (
                    <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Still Checked In</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Supervisor Visit Section ────────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Mark Property Visit</h2>
            <p className="dash-section-subtitle">Log your rounds and inspections</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 14, maxWidth: 400 }}>
          <select className="dash-filter-select" value={visitClient} onChange={e => setVisitClient(e.target.value)}>
            <option value="">Select Property...</option>
            {scope.clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B' }}>
            <MapPin size={14} /> Location: {visitLocation}
          </div>
          <textarea 
            style={{ padding: 10, border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 60 }} 
            placeholder="Add visit notes..."
            value={visitNotes}
            onChange={e => setVisitNotes(e.target.value)}
          />
          <button className="dash-btn" style={{ background: '#2563EB', color: '#FFF', display: 'flex', justifyContent: 'center', gap: 8 }} onClick={handleMarkVisit}>
            <Camera size={16} /> Mark Visit
          </button>
        </div>

        {todayVisits.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Today's Logs</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {todayVisits.map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}>
                  <div>
                    <strong>{v.client}</strong>
                    <div style={{ color: '#64748B', fontSize: 11 }}>{v.notes}</div>
                  </div>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>{v.checkIn}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 5. Raise a Query Grid ──────────────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Raise a Query</h2>
            <p className="dash-section-subtitle">Sent directly to Admin</p>
          </div>
        </div>
        <div className="dash-query-grid">
          <button className="dash-query-item" onClick={() => navigate('/portal/management', { state: { view: 'complaints' }})}>
            <span className="dash-query-icon bg-pastel-red"><MessageSquareWarning size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Complaint</p>
              <p className="dash-query-subtitle">Escalate issues to Admin</p>
            </div>
          </button>
          
          <button className="dash-query-item" onClick={() => navigate('/portal/management', { state: { view: 'materials' }})}>
            <span className="dash-query-icon bg-pastel-purple"><Package size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Material Requirement</p>
              <p className="dash-query-subtitle">Request site supplies</p>
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

      {showTechModal && <TechnicalSupportModal onClose={() => setShowTechModal(false)} />}
    </div>
  );
}
