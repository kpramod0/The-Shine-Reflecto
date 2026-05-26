import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Headset,
  MessageSquareWarning,
  Package,
  ShieldCheck,
  Ticket,
  UserRound,
  WalletCards,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  Phone,
  MapPin,
  ScanLine,
  X
} from 'lucide-react';
import { ImmediateHelpSection } from '../../components/support/ImmediateHelpSection';
import { getAttendanceScans } from '../shared/ManagementPortal';
import '../shared/Dashboards.css';

function initials(name) {
  return (name || 'User')
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function summarizeAttendance(mobile) {
  const scans = getAttendanceScans().filter(scan => scan.workerMobile === mobile);
  return {
    daysWorked: scans.filter(scan => scan.status === 'Present').length,
    officialLeaves: scans.filter(scan => scan.status === 'Official Leave').length,
    unofficialAbsences: scans.filter(scan => scan.status === 'Unofficial Leave').length
  };
}

function TechnicalSupportModal({ onClose }) {
  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={event => event.stopPropagation()}>
        <div className="dash-modal-head">
          <h2 className="dash-section-title">Technical Team</h2>
          <button type="button" className="dash-btn" onClick={onClose}>Close</button>
        </div>
        <p className="dash-section-subtitle" style={{ marginBottom: '20px' }}>
          Support is available for portal, attendance, roster, and complaint workflow issues.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="tel:9155361733" className="dash-action-card" style={{ textDecoration: 'none' }}>
            <div className="dash-action-icon bg-pastel-blue">📞</div>
            <div>
              <div className="dash-action-title">Call Support</div>
              <div className="dash-action-subtitle">+91 9155361733</div>
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

export function SupervisorDashboardHome({ user }) {
  const navigate = useNavigate();
  const [attendanceFilter, setAttendanceFilter] = useState('Till Now');
  const [showTechnicalTeam, setShowTechnicalTeam] = useState(false);
  const stats = useMemo(() => summarizeAttendance(user?.mobile), [user?.mobile]);

  const queryCards = [
    {
      title: 'Complaint',
      subtitle: 'Create a supervisor complaint for admin review',
      icon: <MessageSquareWarning size={22} />,
      colorClass: 'bg-pastel-red',
      onClick: () => navigate('/portal/management', { state: { view: 'complaints' } })
    },
    {
      title: 'Material Requirement',
      subtitle: 'Send material requests to admin',
      icon: <Package size={22} />,
      colorClass: 'bg-pastel-purple',
      onClick: () => navigate('/portal/management', { state: { view: 'materials' } })
    },
    {
      title: 'Ticket',
      subtitle: 'Create or track service tickets',
      icon: <Ticket size={22} />,
      colorClass: 'bg-pastel-green',
      onClick: () => alert('Coming Soon')
    },
    {
      title: 'Payment',
      subtitle: 'Payment and settlement support',
      icon: <WalletCards size={22} />,
      colorClass: 'bg-pastel-blue',
      onClick: () => alert('Coming Soon')
    },
    {
      title: 'Technical Team',
      subtitle: 'Contact technical support',
      icon: <Headset size={22} />,
      colorClass: 'bg-pastel-cyan',
      onClick: () => setShowTechnicalTeam(true)
    },
    {
      title: 'Roster Master',
      subtitle: 'Manage roster assignments',
      icon: <ShieldCheck size={22} />,
      colorClass: 'bg-pastel-yellow',
      onClick: () => navigate('/portal/management', { state: { view: 'roster' } })
    }
  ];

  return (
    <div className="dash-page" id="supervisor-home-page">
      {/* Profile */}
      <div className="dash-profile-card">
        <div className="dash-avatar">{initials(user?.name || 'Supervisor One')}</div>
        <div className="dash-profile-main">
          <h1 className="dash-name">{user?.name || 'Supervisor One'}</h1>
          <p className="dash-subtext">Employee ID: SUP001 | Designation: Supervisor</p>
          <p className="dash-subtext">Mobile: {user?.mobile || '9999999991'}</p>
          <div className="dash-profile-meta">
            <span className="dash-status active">Active</span>
            <span className="dash-joined">Joined: 01 Jan 2022</span>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Attendance & Leave Summary</h2>
            <p className="dash-section-subtitle">Supervisor attendance overview for {attendanceFilter.toLowerCase()}.</p>
          </div>
          <select
            className="dash-filter-select"
            value={attendanceFilter}
            onChange={event => setAttendanceFilter(event.target.value)}
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
            <option>Till Now</option>
          </select>
        </div>
        <div className="dash-summary-grid">
          <div className="dash-stat-card green">
            <div className="dash-stat-top">
              <div className="dash-stat-value">{stats.daysWorked}</div>
              <div className="dash-stat-label">Days Worked</div>
              <div className="dash-stat-note">{attendanceFilter}</div>
            </div>
          </div>
          <div className="dash-stat-card blue">
            <div className="dash-stat-top">
              <div className="dash-stat-value">{stats.officialLeaves}</div>
              <div className="dash-stat-label">Official Leaves</div>
              <div className="dash-stat-note">Approved leave records</div>
            </div>
          </div>
          <div className="dash-stat-card orange">
            <div className="dash-stat-top">
              <div className="dash-stat-value">{stats.unofficialAbsences}</div>
              <div className="dash-stat-label">Unofficial Absences</div>
              <div className="dash-stat-note">Unplanned absences</div>
            </div>
          </div>
        </div>
      </section>

      {/* Task Manager & Actions */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Task Manager & Tracking</h2>
            <p className="dash-section-subtitle">Manage assigned tasks, rosters, and view team attendance breakdown.</p>
          </div>
        </div>
        <div className="dash-action-grid">
          <button type="button" className="dash-action-card" onClick={() => navigate('/portal/management', { state: { view: 'tasks' } })}>
            <div className="dash-action-icon bg-pastel-blue"><ClipboardList size={22} /></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p className="dash-action-title">Assigned Tasks</p>
              <p className="dash-action-subtitle">Open supervisor task manager</p>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#3B82F6' }}>View</div>
          </button>
          
          <button type="button" className="dash-action-card" onClick={() => navigate('/portal/management', { state: { view: 'roster' } })}>
            <div className="dash-action-icon bg-pastel-green"><ShieldCheck size={22} /></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p className="dash-action-title">Roster Master</p>
              <p className="dash-action-subtitle">Create and update team rosters</p>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#10B981' }}>View</div>
          </button>

          <button type="button" className="dash-action-card" onClick={() => alert('Attendance Breakdown Coming Soon')}>
            <div className="dash-action-icon bg-pastel-orange"><CalendarDays size={22} /></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p className="dash-action-title">Attendance Breakdown</p>
              <p className="dash-action-subtitle">View detailed team attendance</p>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#F59E0B' }}>View</div>
          </button>
        </div>
      </section>

      {/* Raise a Query */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Raise a Query</h2>
            <p className="dash-section-subtitle">Supervisor requests and workflow shortcuts.</p>
          </div>
        </div>
        <div className="dash-query-grid">
          {queryCards.map(card => (
            <button key={card.title} type="button" className="dash-query-item" onClick={card.onClick}>
              <span className={`dash-query-icon ${card.colorClass}`}>
                {card.icon}
              </span>
              <div style={{ textAlign: 'left' }}>
                <p className="dash-query-title">{card.title}</p>
                <p className="dash-query-subtitle">{card.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <ImmediateHelpSection />

      {showTechnicalTeam && <TechnicalSupportModal onClose={() => setShowTechnicalTeam(false)} />}
    </div>
  );
}

export function ClientDashboardHome({ user }) {
  const navigate = useNavigate();
  const [showTechnicalTeam, setShowTechnicalTeam] = useState(false);
  const clientName = user?.client || 'Acme Corp';

  const queryCards = [
    {
      title: 'Complaint',
      subtitle: 'Submit a service complaint',
      icon: <MessageSquareWarning size={22} />,
      colorClass: 'bg-pastel-red',
      onClick: () => navigate('/portal/management', { state: { view: 'complaints' } })
    },
    {
      title: 'Technical Team',
      subtitle: 'Contact technical support',
      icon: <Headset size={22} />,
      colorClass: 'bg-pastel-cyan',
      onClick: () => setShowTechnicalTeam(true)
    },
    {
      title: 'Roster Master',
      subtitle: 'View property roster',
      icon: <ShieldCheck size={22} />,
      colorClass: 'bg-pastel-yellow',
      onClick: () => navigate('/portal/management', { state: { view: 'roster' } })
    }
  ];

  return (
    <div className="dash-page" id="client-home-page">
      <div className="dash-profile-card">
        <div className="dash-avatar">{initials(user?.name || 'Client One')}</div>
        <div className="dash-profile-main">
          <h1 className="dash-name">{user?.name || 'Client One'}</h1>
          <p className="dash-subtext">Company: {clientName}</p>
          <p className="dash-subtext">Client ID: CL001 | Mobile: {user?.mobile || '9999999992'}</p>
          <div className="dash-profile-meta">
            <span className="dash-status active">Active</span>
            <span className="dash-joined">Client Portal</span>
          </div>
        </div>
      </div>

      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">Raise a Query</h2>
            <p className="dash-section-subtitle">Client support actions for complaint, technical team, and roster visibility.</p>
          </div>
        </div>
        <div className="dash-query-grid">
          {queryCards.map(card => (
            <button key={card.title} type="button" className="dash-query-item" onClick={card.onClick}>
              <span className={`dash-query-icon ${card.colorClass}`}>
                {card.icon}
              </span>
              <div style={{ textAlign: 'left' }}>
                <p className="dash-query-title">{card.title}</p>
                <p className="dash-query-subtitle">{card.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <ImmediateHelpSection />

      {showTechnicalTeam && <TechnicalSupportModal onClose={() => setShowTechnicalTeam(false)} />}
    </div>
  );
}
