import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceScans, getRosters, getTasks } from '../shared/ManagementPortal';
import {
  CalendarDays, CalendarCheck, AlertTriangle, ClipboardList,
  MessageSquareWarning, Package, Ticket, WalletCards, Headset, ShieldCheck, MapPin
} from 'lucide-react';
import '../shared/Dashboards.css';

/* ── Mocks / Helpers ───────────────────────────────────── */
const workerProfile = {
  employeeId: 'EMP001',
  designation: 'Field Worker',
  joinedDate: '15 Jan 2023',
  status: 'Active'
};

function getInitials(name) {
  return (name || 'Worker').split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function summarizeAttendance(mobile, filter) {
  const scans = getAttendanceScans().filter(scan => scan.workerMobile === mobile);
  // For simplicity, we mock the filters. In a real app we'd filter by date string ranges.
  return {
    daysWorked: scans.filter(scan => scan.status === 'Present').length,
    officialLeaves: scans.filter(scan => scan.status === 'Official Leave').length,
    unofficialAbsences: scans.filter(scan => scan.status === 'Unofficial Leave').length,
    totalAssignedDays: scans.length // mock for denominator
  };
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
        <p className="dash-section-subtitle" style={{ marginBottom: 20 }}>
          Reach out to our technical team for immediate help with the portal or devices.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a className="dash-action-card" href="tel:9155361733" style={{ textDecoration: 'none' }}>
            <div className="dash-action-icon bg-pastel-blue">📞</div>
            <div>
              <p className="dash-action-title">Call Support</p>
              <p className="dash-action-subtitle">+91 9155361733</p>
            </div>
          </a>
          <button className="dash-action-card" onClick={() => { navigator.clipboard.writeText('9155361733'); alert('Copied!'); }}>
            <div className="dash-action-icon bg-pastel-green">📋</div>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-action-title">Copy Number</p>
              <p className="dash-action-subtitle">Copy to clipboard</p>
            </div>
          </button>
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

export default function WorkerHomeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attFilter, setAttFilter] = useState('This Month');
  const [showTechModal, setShowTechModal] = useState(false);

  useEffect(() => {
    // Simulate loading to show skeletons initially
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => summarizeAttendance(user?.mobile, attFilter), [user?.mobile, attFilter]);
  const tasks = useMemo(() => getTasks().filter(t => t.workerMobile === user?.mobile), [user?.mobile]);
  
  const activeTasks = tasks.filter(t => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'On Hold' || t.status === 'Submitted').length;
  const overdueTasks = tasks.filter(t => new Date(t.due) < new Date() && t.status !== 'Completed').length;

  const rosters = useMemo(() => getRosters(), []);
  const todayStr = '2026-05-24'; // Using fixed system date for demo
  const todayDuty = rosters.find(r => r.rosterDate === todayStr && r.workers.some(w => w.phone === user?.mobile));

  if (loading) {
    return (
      <div className="dash-page">
        <div className="skeleton-box" style={{ height: 112, marginBottom: 20 }} />
        <div className="skeleton-box" style={{ height: 200, marginBottom: 20 }} />
        <div className="skeleton-box" style={{ height: 180, marginBottom: 20 }} />
      </div>
    );
  }

  return (
    <div className="dash-page" id="worker-home-page">
      {/* ── 1. Top Profile Card ──────────────────────────── */}
      <div className="dash-profile-card">
        <div className="dash-avatar">{getInitials(user?.name)}</div>
        <div className="dash-profile-main">
          <h1 className="dash-name">{user?.name || 'Worker'}</h1>
          <p className="dash-subtext">EMP ID: {workerProfile.employeeId} | {workerProfile.designation}</p>
          <div className="dash-profile-meta">
            <span className={`dash-status ${workerProfile.status === 'Active' ? 'active' : 'inactive'}`}>{workerProfile.status}</span>
            <span className="dash-joined">Joined {workerProfile.joinedDate}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="dash-btn" onClick={() => navigate('/worker/profile')}>Edit Profile</button>
          <button className="dash-btn" onClick={() => navigate('/worker/attendance-records')}>View Attendance</button>
          <button className="dash-btn" onClick={() => navigate('/worker/management', { state: { view: 'roster' }})}>View Duty</button>
        </div>
      </div>

      {/* ── 2. Attendance & Leave Summary ──────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Attendance & Leave Summary</h2>
            <p className="dash-section-subtitle">Your attendance overview</p>
          </div>
          <select className="dash-filter-select" value={attFilter} onChange={e => setAttFilter(e.target.value)}>
            <option>Till Now</option>
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="dash-summary-grid">
          <StatCard label="Days Worked" value={stats.daysWorked} note={attFilter} tone="green" icon={CalendarCheck} />
          <StatCard label="Official Leaves" value={stats.officialLeaves} note="Approved" tone="blue" icon={CalendarDays} />
          <StatCard label="Unofficial Absences" value={stats.unofficialAbsences} note="Unplanned" tone="orange" icon={AlertTriangle} />
        </div>
      </section>

      {/* ── 3. Assigned Duty Section ───────────────────── */}
      <section className="dash-section">
        <h2 className="dash-section-title" style={{ marginBottom: 16 }}>Assigned Duty Today</h2>
        {todayDuty ? (
          <div className="dash-duty-card" onClick={() => navigate('/worker/management', { state: { view: 'roster' }})} style={{ cursor: 'pointer' }}>
            <div className="dash-duty-head">
              <h3 className="dash-duty-client">{todayDuty.clients.join(', ')}</h3>
              <span className={`dash-duty-shift ${todayDuty.shift.toLowerCase()}`}>
                {todayDuty.shift === 'Day' ? '☀️' : '🌙'} {todayDuty.shift} Shift
              </span>
            </div>
            <div className="dash-duty-detail">
              <CalendarDays size={14} /> {todayDuty.rosterDate}
            </div>
            <div className="dash-duty-detail">
              <ShieldCheck size={14} /> Sup: {todayDuty.supervisor.split('(')[0]}
            </div>
            <div style={{ marginTop: 14 }}>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(todayDuty.clients[0])}`} 
                target="_blank" 
                rel="noreferrer" 
                className="dash-btn" 
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#2563EB' }}
                onClick={e => e.stopPropagation()}
              >
                <MapPin size={14} /> Location
              </a>
              <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 12 }}>Tap card to view details</span>
            </div>
          </div>
        ) : (
          <div className="empty-state-container">
            <div className="empty-state-icon">☕</div>
            <h3 className="empty-state-title">No duty assigned for today</h3>
            <p className="empty-state-desc">Enjoy your day off or contact your supervisor.</p>
          </div>
        )}
      </section>

      {/* ── 4. Breakdown & Task Manager ────────────────── */}
      <section className="dash-section">
        <div className="dash-action-grid">
          {/* Attendance Breakdown */}
          <div className="dash-action-card" onClick={() => navigate('/worker/attendance-records')}>
            <div className="dash-action-icon bg-pastel-blue"><CalendarDays size={22} /></div>
            <div style={{ flex: 1 }}>
              <p className="dash-action-title">Attendance Breakdown</p>
              <p className="dash-action-subtitle">Ratio: {stats.daysWorked}/{stats.totalAssignedDays || 1} days</p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>View &rsaquo;</div>
          </div>
          {/* Task Manager */}
          <div className="dash-action-card" onClick={() => navigate('/worker/task-manager')}>
            <div className="dash-action-icon bg-pastel-purple"><ClipboardList size={22} /></div>
            <div style={{ flex: 1 }}>
              <p className="dash-action-title">Task Manager</p>
              <p className="dash-action-subtitle">
                {activeTasks} Active • {pendingTasks} Pending • <span style={{ color: '#EF4444' }}>{overdueTasks} Overdue</span>
              </p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A855F7' }}>View &rsaquo;</div>
          </div>
        </div>
      </section>

      {/* ── 5. Raise a Query Grid ──────────────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Raise a Query</h2>
            <p className="dash-section-subtitle">Quick actions for field workers</p>
          </div>
        </div>
        <div className="dash-query-grid">
          <button className="dash-query-item" onClick={() => navigate('/worker/complaint')}>
            <span className="dash-query-icon bg-pastel-red"><MessageSquareWarning size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Complaint</p>
              <p className="dash-query-subtitle">Report workplace issues</p>
            </div>
          </button>
          
          <button className="dash-query-item" onClick={() => navigate('/worker/management', { state: { view: 'materials' }})}>
            <span className="dash-query-icon bg-pastel-orange"><Package size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Material Requirement</p>
              <p className="dash-query-subtitle">Request site supplies</p>
            </div>
          </button>

          <button className="dash-query-item" onClick={() => alert('Coming Soon')}>
            <span className="dash-query-icon bg-pastel-green"><Ticket size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Ticket</p>
              <p className="dash-query-subtitle">Create service tickets</p>
            </div>
          </button>

          <button className="dash-query-item" onClick={() => alert('Coming Soon')}>
            <span className="dash-query-icon bg-pastel-blue"><WalletCards size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Payment</p>
              <p className="dash-query-subtitle">Invoices and payroll</p>
            </div>
          </button>

          <button className="dash-query-item" onClick={() => setShowTechModal(true)}>
            <span className="dash-query-icon bg-pastel-cyan"><Headset size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Technical Team</p>
              <p className="dash-query-subtitle">Portal or device support</p>
            </div>
          </button>

          <button className="dash-query-item" onClick={() => navigate('/worker/management', { state: { view: 'roster' }})}>
            <span className="dash-query-icon bg-pastel-yellow"><ShieldCheck size={20} /></span>
            <div style={{ textAlign: 'left' }}>
              <p className="dash-query-title">Roster Master</p>
              <p className="dash-query-subtitle">View your upcoming shifts</p>
            </div>
          </button>
        </div>
      </section>

      {/* ── 6. Immediate Help ──────────────────────────── */}
      <section className="dash-emergency-card">
        <div>
          <h2 className="dash-emergency-title">Need Immediate Help?</h2>
          <p className="dash-emergency-text">Contact our emergency support line or your supervisor.</p>
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
