import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ManagementPortal from '../shared/ManagementPortal';
import SupervisorHome from './SupervisorHome';
import ClientHome from './ClientHome';
import { SupervisorDashboardHome, ClientDashboardHome } from './RoleDashboardHomes';
import '../shared/Dashboards.css';
import './PortalPages.css';

/* ── Mock Data ────────────────────────────────────────────── */
const SUP_DIRECTORY = {
  activeUsers: 18, activeClients: 4, fieldWorkers: 12, clientHOD: 4,
};
const SUP_DUTY = {
  assigned: true, property: '123 Main Street', shift: 'night',
  clientName: 'Acme Corp', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=18.5204,73.8567',
};
const SUP_TASKS = {
  assignedCount: 3,
  pending: [{ priority: 'high', deadline: '23 May 2026' }],
};
const SUP_REQUESTS = [
  { id: 1, text: 'Material request — Block B', meta: 'Ravi J • 2h ago', color: '#F59E0B' },
  { id: 2, text: 'Complaint — Safety gear missing', meta: 'Priya S • Yesterday', color: '#EF4444' },
];
const SUP_ATTENDANCE = { marked: 72, pending: 28 };
const SUP_TASK_HISTORY = { completed: 52, defaulted: 28, notCompleted: 20 };

const CLIENT_DUTY_DATA = {
  day:   { count: 3, workers: [
    { name: 'Ravi Jadhav',    shift: 'Day', property: 'Tower A – Floor 3' },
    { name: 'Suresh Kumar',   shift: 'Day', property: 'Tower A – Floor 5' },
    { name: 'Meena Verma',    shift: 'Day', property: 'Main Lobby' },
  ]},
  night: { count: 5, workers: [
    { name: 'Amit Patil',     shift: 'Night', property: 'Tower B – Floor 1' },
    { name: 'Deepak Singh',   shift: 'Night', property: 'Tower B – Floor 2' },
    { name: 'Kavya Nair',     shift: 'Night', property: 'Parking Level' },
    { name: 'Rohit Sharma',   shift: 'Night', property: 'Tower A – Basement' },
    { name: 'Priya Gupta',    shift: 'Night', property: 'Reception Area' },
  ]},
};
const CLIENT_TASKS = { assignedCount: 1, pending: [{ priority: 'medium', deadline: '25 May 2026' }] };
const CLIENT_REQUESTS = [];

/* ── Shared Helpers ──────────────────────────────────────── */
function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function PhShiftBadge({ shift }) {
  const d = shift === 'day';
  return <span className={`ph-shift-badge ${d ? 'day' : 'night'}`}>{d ? '☀️ Day Shift' : '🌙 Night Shift'}</span>;
}

function PhLocationBtn({ url }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="ph-location-btn" title="Open in Google Maps">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
      Location
    </a>
  );
}

function PhScannerFab() {
  return (
    <button className="ph-scanner-fab" id="portal-attendance-scanner-fab" onClick={() => alert('Attendance Scanner — coming soon!')} aria-label="Attendance Scanner">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <rect width="7" height="5" x="7" y="7" rx="1"/><rect width="7" height="5" x="10" y="12" rx="1"/>
      </svg>
      Attendance Scanner
    </button>
  );
}

function PhTasksSection({ tasks, onCardClick, role }) {
  const pending = tasks.pending[0] || null;
  return (
    <div className="ph-section">
      <h2 className="ph-section-title"><span className="ph-section-icon" style={{background:'#F0FDF4'}}>✅</span>Today's Tasks</h2>
      <div className="ph-tasks-grid">
        <div className="ph-task-card" onClick={onCardClick} id={`${role}-assigned-tasks-card`}>
          <div className="ph-task-top">
            <div className="ph-task-icon-wrap" style={{background:'#EFF6FF'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <svg className="ph-task-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <div className="ph-task-count" style={{color:'#2563EB'}}>{tasks.assignedCount}</div>
          <div className="ph-task-label">Assigned Tasks</div>
          <div className="ph-task-sub">Tap to view task details</div>
        </div>
        <div className="ph-task-card" onClick={onCardClick} id={`${role}-pending-tasks-card`}>
          <div className="ph-task-top">
            <div className="ph-task-icon-wrap" style={{background:'#FFF7ED'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <svg className="ph-task-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <div className="ph-task-label">Pending Tasks Summary</div>
          <div className="ph-task-sub">Priority & deadline overview</div>
          {pending ? (
            <div className="ph-pending-detail">
              <div className="ph-pending-row">
                <span className="ph-pending-key">Priority</span>
                <span className={`ph-priority-badge ${pending.priority}`}>{pending.priority.charAt(0).toUpperCase()+pending.priority.slice(1)}</span>
              </div>
              <div className="ph-pending-row">
                <span className="ph-pending-key">Deadline</span>
                <span className="ph-deadline-text">{pending.deadline}</span>
              </div>
            </div>
          ) : (
            <div className="ph-pending-detail"><p className="ph-empty-text" style={{fontSize:12}}>No pending tasks 🎉</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhAnalysisSection({ clientFilterLabel, supervisorFilterLabel }) {
  const [attFilters, setAttFilters] = useState({ scope: 'all', shift: 'all', period: 'date' });
  const [taskFilters, setTaskFilters] = useState({ scope: 'all', shift: 'all', period: 'date' });

  const scopeOptions = supervisorFilterLabel
    ? [
        { v: 'all', l: 'All Supervisors' },
        { v: '9999999991', l: 'Supervisor One' },
        { v: '9766123961', l: 'ANIL S/o Mattar' },
        { v: '9305200273', l: 'MOHIT S/o PRAMLAL' }
      ]
    : [
        { v: 'all', l: 'All Clients' },
        { v: 'Acme Corp', l: 'Acme Corp' },
        { v: 'Apex', l: 'Apex' },
        { v: 'Nexus', l: 'Nexus' },
        { v: 'Renaissance Bengaluru Race Course Hotel', l: 'Renaissance Hotel' },
        { v: 'Holiday Inn Express Bengaluru Whitefield Itpl, an IHG Hotel', l: 'Holiday Inn' },
        { v: 'JW Marriott Hotel Kolkata', l: 'JW Marriott' }
      ];

  const shiftOpts = [{ v: 'all', l: 'All Shifts' }, { v: 'day', l: 'Day Shift' }, { v: 'night', l: 'Night Shift' }];
  const periodOpts = [{ v: 'date', l: 'Date Wise' }, { v: 'week', l: 'Week Wise' }, { v: 'month', l: 'Month Wise' }];

  // Fetch live scans
  const scans = getAttendanceScans();

  // Filter attendance scans
  let filteredScans = scans;
  if (attFilters.shift !== 'all') {
    filteredScans = filteredScans.filter(s => s.shift.toLowerCase() === attFilters.shift.toLowerCase());
  }
  if (attFilters.scope !== 'all') {
    if (supervisorFilterLabel) {
      filteredScans = filteredScans.filter(s => s.supervisorMobile === attFilters.scope);
    } else {
      filteredScans = filteredScans.filter(s => s.client === attFilters.scope);
    }
  }

  const totalScans = filteredScans.length;
  const presentScans = filteredScans.filter(s => s.status === 'Present').length;
  const markedPct = totalScans > 0 ? Math.round((presentScans / totalScans) * 100) : 75; // premium default
  const pendingPct = 100 - markedPct;

  // Simulate task trends
  const taskCompleted = taskFilters.period === 'week' ? 68 : taskFilters.period === 'month' ? 80 : 60;
  const taskDefaulted = 15;
  const taskNotCompleted = 100 - taskCompleted - taskDefaulted;

  const ProgressBar = ({ label, pct, color }) => (
    <div className="ph-progress-row">
      <div className="ph-progress-meta">
        <span className="ph-progress-label">{label}</span>
        <span className="ph-progress-pct">{pct}%</span>
      </div>
      <div className="ph-bar-track">
        <div className="ph-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="ph-section">
      <h2 className="ph-section-title">
        <span className="ph-section-icon" style={{ background: '#EEF2FF' }}>📊</span>Analysis
      </h2>
      <div className="ph-analysis-grid">
        <div className="ph-analysis-panel">
          <p className="ph-analysis-panel-title">Employee Attendance</p>
          <div className="ph-filter-row">
            <select className="ph-filter-select" value={attFilters.scope} onChange={e => setAttFilters(f => ({ ...f, scope: e.target.value }))}>
              {scopeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <select className="ph-filter-select" value={attFilters.shift} onChange={e => setAttFilters(f => ({ ...f, shift: e.target.value }))}>
              {shiftOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <select className="ph-filter-select" value={attFilters.period} onChange={e => setAttFilters(f => ({ ...f, period: e.target.value }))}>
              {periodOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="ph-progress-group">
            <ProgressBar label="Marked Attendance" pct={markedPct} color="#10B981" />
            <ProgressBar label="Pending Attendance" pct={pendingPct} color="#EF4444" />
          </div>
        </div>
        <div className="ph-analysis-panel">
          <p className="ph-analysis-panel-title">Task History</p>
          <div className="ph-filter-row">
            <select className="ph-filter-select" value={taskFilters.scope} onChange={e => setTaskFilters(f => ({ ...f, scope: e.target.value }))}>
              {scopeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <select className="ph-filter-select" value={taskFilters.shift} onChange={e => setTaskFilters(f => ({ ...f, shift: e.target.value }))}>
              {shiftOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <select className="ph-filter-select" value={taskFilters.period} onChange={e => setTaskFilters(f => ({ ...f, period: e.target.value }))}>
              {periodOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="ph-progress-group">
            <ProgressBar label="Completed" pct={taskCompleted} color="#2563EB" />
            <ProgressBar label="Defaulted" pct={taskDefaulted} color="#F59E0B" />
            <ProgressBar label="Not Completed" pct={taskNotCompleted} color="#7C3AED" />
          </div>
        </div>
      </div>
    </div>
  );
}

import HomePage from './HomePage';

/* ── Portal Home (role switch) ──────────────────────────── */
export function PortalHome() {
  return <HomePage />;
}


/* ── Member ────────────────────────────────── */
import MemberPortal from '../shared/MemberPortal';
export function PortalMember() {
  return <MemberPortal />;
}

/* ── Management ────────────────────────────── */
export function PortalManagement() {
  return <ManagementPortal />;
}

/* ── Dashboard ─────────────────────────────── */
export function PortalDashboard() {
  const { user } = useAuth();

  if (user?.role === 'supervisor') return <SupervisorDashboardHome user={user} />;
  if (user?.role === 'client')     return <ClientDashboardHome user={user} />;

  const metrics = [
    { label: 'Revenue This Month', value: '₹2,48,000', icon: '💰', color: '#9BA432' },
    { label: 'Jobs Completed',     value: '47',        icon: '✅', color: '#3FA7A5' },
    { label: 'New Enquiries',      value: '18',        icon: '📬', color: '#F59E0B' },
    { label: 'Active Workers',     value: '12',        icon: '👷', color: '#6366F1' },
  ];

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1 className="portal-page-title">Dashboard</h1>
          <p className="portal-page-sub">Business performance overview.</p>
        </div>
      </div>

      <div className="portal-stats-row">
        {metrics.map(m => (
          <div key={m.label} className="portal-stat-card" style={{ borderTop: `3px solid ${m.color}` }}>
            <span className="portal-stat-icon" style={{ color: m.color }}>{m.icon}</span>
            <span className="portal-stat-value" style={{ color: m.color }}>{m.value}</span>
            <span className="portal-stat-label">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="portal-grid-2">
        <div className="portal-card">
          <h3 className="portal-card-title">Monthly Breakdown</h3>
          {['Week 1','Week 2','Week 3','Week 4'].map((w, i) => {
            const pcts = [55,72,88,40];
            return (
              <div key={w} className="bar-row">
                <span className="bar-label">{w}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pcts[i]}%` }} />
                </div>
                <span className="bar-val">{pcts[i]}%</span>
              </div>
            );
          })}
        </div>
        <div className="portal-card">
          <h3 className="portal-card-title">Service Mix</h3>
          {[
            { name:'Marble Polishing',    pct:52, color:'#9BA432' },
            { name:'Granite Restoration', pct:24, color:'#3FA7A5' },
            { name:'Tile & Grout',        pct:14, color:'#F59E0B' },
            { name:'Other Services',      pct:10, color:'#6366F1' },
          ].map(s => (
            <div key={s.name} className="bar-row">
              <span className="bar-label">{s.name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width:`${s.pct}%`, background:s.color }} />
              </div>
              <span className="bar-val">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
