import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ImmediateHelpSection } from '../../components/support/ImmediateHelpSection';
import { loadAttendanceSnapshot } from '../../services/operationsApi';
import '../shared/Dashboards.css';

/* ── Sample Data ─────────────────────────────────────────── */
const workerUser = {
  name: "John Smith",
  employeeId: "EMP001",
  designation: "Worker",
  status: "Active",
  joinedDate: "15/1/2023",
  profileImage: null,
};

const attendanceData = {
  thisWeek: { daysWorked: 5, officialLeaves: 1, unofficialAbsences: 0 },
  thisMonth: { daysWorked: 22, officialLeaves: 2, unofficialAbsences: 1 },
  thisYear: { daysWorked: 247, officialLeaves: 18, unofficialAbsences: 3 },
  tillNow: { daysWorked: 480, officialLeaves: 34, unofficialAbsences: 5 },
};

const filterKeyMap = {
  "This Week": "thisWeek",
  "This Month": "thisMonth",
  "This Year": "thisYear",
  "Till Now": "tillNow",
};

const queryCards = [
  { title: "Request", subtitle: "Submit general requests", icon: "📋", path: "/worker/request", colorClass: "bg-pastel-blue" },
  { title: "Complaint", subtitle: "Report workplace issues", icon: "⚠️", path: "/worker/complaint", colorClass: "bg-pastel-red" },
  { title: "Material Requirement", subtitle: "Request supplies or equipment", icon: "📦", path: "/worker/material-requirement", colorClass: "bg-pastel-orange" },
  { title: "Ticket", subtitle: "Create/track tickets", icon: "🎫", path: "/worker/ticket", colorClass: "bg-pastel-green" },
  { title: "Payment", subtitle: "Invoices & settlements", icon: "💳", path: "/worker/payment", colorClass: "bg-pastel-purple" },
  { title: "Technical Team", subtitle: "Meet or contact tech team", icon: "🛠️", action: "TECHNICAL_TEAM", colorClass: "bg-pastel-cyan" },
];

/* ── Components ───────────────────────────────────────────── */

function TechTeamModal({ onClose }) {
  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={e => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h3 className="dash-section-title">Technical Support</h3>
          <button className="dash-btn" onClick={onClose}>Close</button>
        </div>
        <div className="dash-subtext" style={{ marginBottom: '20px' }}>
          Connect with our technical team for immediate assistance with app issues or portal access.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="tel:9155361733" className="dash-action-card" style={{ textDecoration: 'none' }}>
            <div className="dash-action-icon bg-pastel-blue">📞</div>
            <div>
              <div className="dash-action-title">Call Support</div>
              <div className="dash-action-subtitle">+91 9155361733</div>
            </div>
          </a>
          <a href="https://wa.me/919155361733" target="_blank" rel="noreferrer" className="dash-action-card" style={{ textDecoration: 'none' }}>
            <div className="dash-action-icon bg-pastel-green">💬</div>
            <div>
              <div className="dash-action-title">WhatsApp Support</div>
              <div className="dash-action-subtitle">Message us on WhatsApp</div>
            </div>
          </a>
          <a href="mailto:pramod@theshinereflecto.com" className="dash-action-card" style={{ textDecoration: 'none' }}>
            <div className="dash-action-icon bg-pastel-orange">✉️</div>
            <div>
              <div className="dash-action-title">Email Support</div>
              <div className="dash-action-subtitle">pramod@theshinereflecto.com</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

function isInAttendanceFilter(dateValue, filter) {
  if (!dateValue || filter === 'Till Now') return true;
  const date = new Date(dateValue);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return true;

  if (filter === 'This Week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return date >= start;
  }

  if (filter === 'This Month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  if (filter === 'This Year') {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

function summarizeAttendanceRecords(records, mobile, filter) {
  const workerRecords = records.filter(record => (
    (!mobile || record.workerMobile === mobile) && isInAttendanceFilter(record.date, filter)
  ));

  return {
    daysWorked: workerRecords.filter(record => record.status === 'Present').length,
    officialLeaves: workerRecords.filter(record => record.status === 'Official Leave').length,
    unofficialAbsences: workerRecords.filter(record => (
      record.status === 'Unofficial Leave' || record.status === 'Absent (Unofficial)'
    )).length,
  };
}

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const worker = { ...workerUser, name: user?.name || workerUser.name };
  
  const [filter, setFilter] = useState("This Month");
  const [showTechModal, setShowTechModal] = useState(false);
  const [apiAttendance, setApiAttendance] = useState([]);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      try {
        const snapshot = await loadAttendanceSnapshot();
        if (!cancelled) {
          setApiAttendance(snapshot.attendance);
          setApiError('');
        }
      } catch (error) {
        if (!cancelled) {
          setApiAttendance([]);
          setApiError(error.message || 'Unable to load attendance from API.');
        }
      }
    }

    if (user) loadAttendance();
    return () => { cancelled = true; };
  }, [user]);

  const liveAttendanceSummary = useMemo(
    () => summarizeAttendanceRecords(apiAttendance, user?.mobile, filter),
    [apiAttendance, user?.mobile, filter],
  );
  const attData = apiAttendance.length > 0 ? liveAttendanceSummary : attendanceData[filterKeyMap[filter]];

  return (
    <div className="dash-page">
      {apiError && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontSize: 13, fontWeight: 700 }}>
          Attendance API unavailable: showing local fallback data. {apiError}
        </div>
      )}
      {/* 1. Profile Summary */}
      <div className="dash-profile-card">
        <div className="dash-avatar">
          {worker.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="dash-profile-main">
          <h2 className="dash-name">{worker.name}</h2>
          <p className="dash-subtext">Employee ID: <strong>{worker.employeeId}</strong> • Designation: <strong>{worker.designation}</strong></p>
          <div className="dash-profile-meta">
            <span className={`dash-status ${worker.status === 'Active' ? 'active' : 'inactive'}`}>
              {worker.status}
            </span>
            <span className="dash-joined">Joined: {worker.joinedDate}</span>
          </div>
        </div>
      </div>

      {/* 2. Attendance Summary */}
      <div className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Attendance & Leave Summary</h2>
            <p className="dash-section-subtitle">Overview of your working days and leaves</p>
          </div>
          <select className="dash-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            {Object.keys(filterKeyMap).map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="dash-summary-grid">
          <div className="dash-stat-card green">
            <div className="dash-stat-top">
              <div className="dash-stat-value">{attData.daysWorked}</div>
              <div className="dash-stat-label">Days Worked</div>
              <div className="dash-stat-note">{filter}</div>
            </div>
          </div>
          <div className="dash-stat-card blue">
            <div className="dash-stat-top">
              <div className="dash-stat-value">{attData.officialLeaves}</div>
              <div className="dash-stat-label">Official Leaves</div>
              <div className="dash-stat-note">Approved leaves</div>
            </div>
          </div>
          <div className="dash-stat-card orange">
            <div className="dash-stat-top">
              <div className="dash-stat-value">{attData.unofficialAbsences}</div>
              <div className="dash-stat-label">Unofficial Absences</div>
              <div className="dash-stat-note">Unplanned absences</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 & 4. Action Cards */}
      <div className="dash-action-grid" style={{ marginBottom: '20px' }}>
        <div className="dash-action-card" onClick={() => navigate('/worker/attendance-breakdown')}>
          <div className="dash-action-icon bg-pastel-blue">📅</div>
          <div style={{ flex: 1 }}>
            <div className="dash-action-title">Attendance Breakdown</div>
            <div className="dash-action-subtitle">View detailed attendance records</div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#3B82F6' }}>View</div>
        </div>
        <div className="dash-action-card" onClick={() => navigate('/worker/task-manager')}>
          <div className="dash-action-icon bg-pastel-green">📋</div>
          <div style={{ flex: 1 }}>
            <div className="dash-action-title">Task Manager</div>
            <div className="dash-action-subtitle">View and manage assigned tasks</div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#10B981' }}>View</div>
        </div>
      </div>

      {/* 5. Raise a Query */}
      <div className="dash-section">
        <h2 className="dash-section-title" style={{ marginBottom: '4px' }}>Raise a Query</h2>
        <p className="dash-section-subtitle" style={{ marginBottom: '18px' }}>Submit requests, complaints, or get support</p>
        
        <div className="dash-query-grid">
          {queryCards.map(card => (
            <button 
              key={card.title}
              className="dash-query-item"
              onClick={() => {
                if (card.action === 'TECHNICAL_TEAM') {
                  setShowTechModal(true);
                } else {
                  navigate(card.path);
                }
              }}
            >
              <div className={`dash-query-icon ${card.colorClass}`}>{card.icon}</div>
              <div>
                <div className="dash-query-title">{card.title}</div>
                <div className="dash-query-subtitle">{card.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Emergency Card */}
      <ImmediateHelpSection />

      {showTechModal && <TechTeamModal onClose={() => setShowTechModal(false)} />}
    </div>
  );
}
