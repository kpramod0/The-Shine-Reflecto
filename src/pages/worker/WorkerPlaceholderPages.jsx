import React, { useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MemberPortal from '../shared/MemberPortal';
import ManagementPortal from '../shared/ManagementPortal';
import HomePage from '../portal/HomePage';
import WorkerComplaintsView from './WorkerComplaintsView';
import './WorkerPlaceholderPages.css';
import './WorkerHome.css';

/* ── Storage Helpers ────────────────────────────────────────── */
const getRosters = () => {
  return JSON.parse(localStorage.getItem('tsr_rosters') || '[]');
};

const getAttendanceScans = () => {
  return JSON.parse(localStorage.getItem('tsr_attendance_scans') || '[]');
};

const saveAttendanceScans = (scans) => {
  localStorage.setItem('tsr_attendance_scans', JSON.stringify(scans));
};

const getVisitRequests = () => {
  return JSON.parse(localStorage.getItem('tsr_visit_requests') || '[]');
};

const saveVisitRequests = (reqs) => {
  localStorage.setItem('tsr_visit_requests', JSON.stringify(reqs));
};

const getVisits = () => {
  return JSON.parse(localStorage.getItem('tsr_supervisor_visits') || '[]');
};

const saveVisits = (v) => {
  localStorage.setItem('tsr_supervisor_visits', JSON.stringify(v));
};

const addNotification = (mobile, name, msg) => {
  const notifs = JSON.parse(localStorage.getItem('tsr_notifications') || '[]');
  const newN = {
    id: 'N_' + Date.now(),
    mobile,
    name,
    message: msg,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false
  };
  localStorage.setItem('tsr_notifications', JSON.stringify([newN, ...notifs]));
};

const TODAY_TASKS = { assignedCount: 0, pendingTasks: [] };

/* ── Helper: formatted date ────────────────────────────────── */
function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Location Button ───────────────────────────────────────── */
function LocationBtn({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="wh-location-btn"
      title="Open in Google Maps"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      Location
    </a>
  );
}

/* ── Shift Badge ───────────────────────────────────────────── */
function ShiftBadge({ shift }) {
  const isDay = shift?.toLowerCase() === 'day';
  return (
    <span className={`wh-shift-badge ${isDay ? 'day' : 'night'}`}>
      {isDay ? '☀️' : '🌙'} {isDay ? 'Day Shift' : 'Night Shift'}
    </span>
  );
}

/* ── Assigned Duty Section ─────────────────────────────────── */
function AssignedDutySection({ duty, status, onOpenScanner }) {
  if (!duty) {
    return (
      <div className="wh-no-duty">
        <h2 className="wh-section-title">
          <span className="wh-section-title-icon" style={{ background: '#EFF6FF' }}>🏢</span>
          Assigned Duty
        </h2>
        <div className="wh-empty-state">
          <span className="wh-empty-icon">📋</span>
          <p className="wh-empty-text">No duty assigned for today.<br/>Contact your supervisor for updates.</p>
        </div>
      </div>
    );
  }

  // Map supervisor number to readable name if possible
  const getSupervisorLabel = (sup) => {
    if (sup === '9999999991') return 'Supervisor One (9999999991)';
    if (sup === '9766123961') return 'ANIL S/o Mattar (9766123961)';
    if (sup === '9305200273') return 'MOHIT S/o PRAMLAL (9305200273)';
    return sup || 'Unassigned';
  };

  const statusColors = {
    'Scheduled': { bg: '#F1F5F9', color: '#475569', label: '📅 Scheduled' },
    'Checked In': { bg: '#DCFCE7', color: '#15803D', label: '✅ Checked In' },
    'Checked Out': { bg: '#FEE2E2', color: '#B91C1C', label: '🏁 Checked Out' }
  };
  const statusStyle = statusColors[status] || statusColors['Scheduled'];

  return (
    <div className="wh-duty-card">
      <div className="wh-duty-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="wh-section-title" style={{ margin: 0 }}>
          <span className="wh-section-title-icon" style={{ background: '#EFF6FF' }}>🏢</span>
          Assigned Duty
        </h2>
        <span style={{
          background: statusStyle.bg,
          color: statusStyle.color,
          padding: '4px 12px',
          borderRadius: 100,
          fontSize: 12,
          fontWeight: 700
        }}>
          {statusStyle.label}
        </span>
      </div>
      <div className="wh-duty-body" style={{ flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div className="wh-duty-left">
            <p className="wh-duty-property">{duty.clients.join(', ')}</p>
            <div className="wh-duty-client-row">
              <span className="wh-duty-client-name" style={{ fontSize: 13, color: '#475569' }}>Roster Date: {duty.rosterDate}</span>
              <LocationBtn url={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(duty.clients.join(', '))}`} />
            </div>
            <p className="wh-duty-detail" style={{ marginTop: 6 }}>
              <strong>Supervisor:</strong> {getSupervisorLabel(duty.supervisor)}
            </p>
          </div>
          <ShiftBadge shift={duty.shift} />
        </div>

        <button 
          onClick={onOpenScanner}
          className="mgt-btn primary" 
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: 10, 
            fontWeight: 700, 
            marginTop: 8,
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          📷 Open Attendance Scanner
        </button>
      </div>
    </div>
  );
}

/* ── Today's Tasks Section ─────────────────────────────────── */
function TodaysTasksSection({ tasks, onCardClick }) {
  const pending = tasks.pendingTasks[0] || null;

  return (
    <>
      <h2 className="wh-section-title">
        <span className="wh-section-title-icon" style={{ background: '#F0FDF4' }}>✅</span>
        Today's Tasks
      </h2>
      <div className="wh-tasks-grid">
        {/* Assigned count card */}
        <div className="wh-task-card" onClick={onCardClick} id="worker-assigned-tasks-card">
          <div className="wh-task-card-top">
            <div className="wh-task-icon-wrap" style={{ background: '#EFF6FF' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <svg className="wh-task-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
          <div className="wh-task-count" style={{ color: '#2563EB' }}>{tasks.assignedCount}</div>
          <div className="wh-task-label">Assigned Tasks</div>
          <div className="wh-task-sub">Tap to view task details</div>
        </div>

        {/* Pending summary card */}
        <div className="wh-task-card" onClick={onCardClick} id="worker-pending-tasks-card">
          <div className="wh-task-card-top">
            <div className="wh-task-icon-wrap" style={{ background: '#FFF7ED' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <svg className="wh-task-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
          <div className="wh-task-label" style={{ marginTop: 2 }}>Pending Tasks Summary</div>
          <div className="wh-task-sub">Priority &amp; deadline overview</div>
          {pending ? (
            <div className="wh-pending-detail">
              <div className="wh-pending-row">
                <span className="wh-pending-key">Priority</span>
                <span className={`wh-priority-badge ${pending.priority}`}>
                  {pending.priority.charAt(0).toUpperCase() + pending.priority.slice(1)}
                </span>
              </div>
              <div className="wh-pending-row">
                <span className="wh-pending-key">Deadline</span>
                <span className="wh-deadline-text">{pending.deadline}</span>
              </div>
            </div>
          ) : (
            <div className="wh-pending-detail">
              <p className="wh-empty-text" style={{ fontSize: 12, marginTop: 4 }}>No pending tasks 🎉</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Worker Home (Main) ────────────────────────────────────── */
// Legacy dashboard kept temporarily for reference while WorkerHome uses the new role-based implementation.
// eslint-disable-next-line no-unused-vars
function LegacyWorkerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Worker';
  const initial = firstName[0]?.toUpperCase() || 'W';

  // State for Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerClient, setScannerClient] = useState('Acme Corp');
  const [scannerShift, setScannerShift] = useState('Day');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [successAction, setSuccessAction] = useState('');

  // Supervisor visit request states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqReason, setReqReason] = useState('');
  const [clientRequests, setClientRequests] = useState(() => 
    getVisitRequests().filter(r => r.requestedByMobile === user?.mobile)
  );

  const handleSubmitRequest = () => {
    if (!reqReason) {
      alert('Please specify a reason/issue description.');
      return;
    }
    const newReq = {
      id: 'VR_' + Date.now(),
      client: todayDuty?.clients[0] || 'Acme Corp',
      requestedBy: user.name,
      requestedByMobile: user.mobile,
      role: 'worker',
      type: 'On Demand by Workers',
      reason: reqReason,
      date: '2026-05-24',
      status: 'Pending'
    };
    const reqs = getVisitRequests();
    const updated = [newReq, ...reqs];
    saveVisitRequests(updated);
    setClientRequests(updated.filter(r => r.requestedByMobile === user?.mobile));
    
    // Notify supervisors
    addNotification('9999999991', 'Supervisor One', `New supervisor visit request from Worker (${user.name}): On Demand by Workers`);

    setReqReason('');
    setShowRequestModal(false);
    alert('Visit Request submitted successfully to supervisor!');
  };

  // Fetch worker duty for system active date 2026-05-24
  const todayStr = '2026-05-24';
  const savedRosters = getRosters();
  const todayDuty = useMemo(() => {
    return savedRosters.find(r => 
      r.rosterDate === todayStr && 
      r.workers.some(w => w.phone === user?.mobile)
    );
  }, [savedRosters, user?.mobile]);

  // Determine current attendance state
  const scans = getAttendanceScans();
  const todayScans = useMemo(() => {
    return scans.filter(s => s.date === todayStr && s.workerMobile === user?.mobile);
  }, [scans, user?.mobile]);

  const todayRecord = useMemo(() => {
    return todayScans[0] || null;
  }, [todayScans]);

  const hasCheckIn = !!todayRecord?.checkIn;
  const hasCheckOut = !!todayRecord?.checkOut;
  const dutyStatus = useMemo(() => {
    if (hasCheckOut) {
      if (todayRecord?.status === 'Pending Approval') return 'Checked Out (Pending Approval)';
      if (todayRecord?.status === 'Present') return 'Checked Out (Approved)';
      if (todayRecord?.status === 'Unofficial Leave') return 'Checked Out (Rejected)';
      return 'Checked Out';
    }
    if (hasCheckIn) {
      if (todayRecord?.status === 'Pending Approval') return 'Checked In (Pending Approval)';
      if (todayRecord?.status === 'Present') return 'Checked In (Approved)';
      if (todayRecord?.status === 'Unofficial Leave') return 'Checked In (Rejected)';
      return 'Checked In';
    }
    return 'Scheduled';
  }, [hasCheckIn, hasCheckOut, todayRecord]);

  // Set default values in scanner modal if duty is assigned
  const handleOpenScanner = () => {
    if (todayDuty) {
      setScannerClient(todayDuty.clients[0] || 'Acme Corp');
      setScannerShift(todayDuty.shift || 'Day');
    }
    setScanSuccess(false);
    setScanError(null);
    setIsScannerOpen(true);
  };

  const timeToMinutes = (tStr) => {
    if (!tStr) return 0;
    const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hrs = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
      if (ampm.toUpperCase() === 'AM' && hrs === 12) hrs = 0;
    }
    return hrs * 60 + mins;
  };

  const calculateHours = (checkInStr, checkOutStr) => {
    if (!checkInStr || !checkOutStr) return 0;
    const inMins = timeToMinutes(checkInStr);
    let outMins = timeToMinutes(checkOutStr);
    if (outMins < inMins) {
      outMins += 24 * 60; // night shift crosses midnight
    }
    return parseFloat(((outMins - inMins) / 60).toFixed(2));
  };

  const handleScanAction = (actionType) => {
    setScanError(null);

    // RESTRICTIVE VALIDATION:
    // Check if worker has an active roster matching the selected client and shift
    const matchingRoster = savedRosters.find(r => 
      r.rosterDate === todayStr &&
      r.workers.some(w => w.phone === user?.mobile) &&
      r.clients.some(c => c.toLowerCase() === scannerClient.toLowerCase()) &&
      r.shift.toLowerCase() === scannerShift.toLowerCase()
    );

    if (!matchingRoster) {
      setScanError("No active duty assigned for this client/shift today. Please contact your supervisor.");
      return;
    }

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    let updatedScans = [...scans];

    if (actionType === 'check-in') {
      const existing = scans.find(s => s.workerMobile === user?.mobile && s.date === todayStr && s.shift === scannerShift && s.client === scannerClient);
      if (existing && existing.checkIn) {
        setScanError("You have already checked in for this shift today.");
        return;
      }

      const newScan = {
        id: 'SCAN_' + Date.now(),
        workerMobile: user?.mobile,
        workerName: user?.name,
        date: todayStr,
        client: scannerClient,
        shift: scannerShift,
        status: 'Pending Approval', // Status starts as Pending Approval
        checkIn: timeStr,
        checkOut: '',
        totalHours: 0,
        notes: 'Checked-in via worker portal scanner.',
        supervisorMobile: matchingRoster.supervisor ? (matchingRoster.supervisor.match(/\((\d+)\)/)?.[1] || '9999999991') : '9999999991'
      };
      updatedScans.push(newScan);
    } else {
      // check-out
      const existingIndex = scans.findIndex(s => s.workerMobile === user?.mobile && s.date === todayStr && s.shift === scannerShift && s.client === scannerClient && s.checkIn && !s.checkOut);
      if (existingIndex === -1) {
        setScanError("No active check-in record found. Please complete Check-In first.");
        return;
      }

      const existing = scans[existingIndex];
      const hours = calculateHours(existing.checkIn, timeStr);
      const updatedRecord = {
        ...existing,
        checkOut: timeStr,
        totalHours: hours,
        status: 'Pending Approval', // Still pending approval until supervisor approves it
        notes: existing.notes + ' | Checked-out via worker portal scanner.'
      };
      updatedScans[existingIndex] = updatedRecord;
    }

    saveAttendanceScans(updatedScans);
    setSuccessAction(actionType);
    setScanSuccess(true);
  };

  const handleTaskCardClick = () => {
    navigate('/worker/task-manager');
  };

  return (
    <div className="wh-page" id="worker-home-page">
      {/* Greeting */}
      <div className="wh-greeting">
        <div className="wh-greeting-left">
          <p className="wh-greeting-date">{todayLabel()}</p>
          <h1 className="wh-greeting-title">Welcome back, {firstName} 👋</h1>
          <p className="wh-greeting-sub">Here's your shift overview for today.</p>
        </div>
        <div className="wh-greeting-avatar">{initial}</div>
      </div>

      {/* Assigned Duty */}
      <AssignedDutySection 
        duty={todayDuty} 
        status={dutyStatus}
        onOpenScanner={handleOpenScanner}
      />

      {/* Today's Tasks */}
      <TodaysTasksSection tasks={TODAY_TASKS} onCardClick={handleTaskCardClick} />

      {/* Supervisor Visits Request Section */}
      <div className="wh-section" style={{ padding: '0 16px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 className="ph-section-title" style={{ margin: 0, fontSize: 16 }}>
            <span className="ph-section-icon" style={{ background: '#ECFDF5' }}>🛡️</span>
            Supervisor Visit Support
          </h2>
          <button 
            className="ph-shift-toggle-btn active" 
            style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8, background: '#10B981', color: '#FFF', border: 'none' }}
            onClick={() => setShowRequestModal(true)}
          >
            Request Visit
          </button>
        </div>

        {/* Requests status list */}
        {clientRequests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clientRequests.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, background: '#FFF', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div>
                  <strong>{r.type}</strong>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Reason: {r.reason}</div>
                </div>
                <span className={`mgt-badge ${r.status === 'Completed' ? 'completed' : r.status === 'Accepted' ? 'in-progress' : 'pending'}`} style={{ fontSize: 10 }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', margin: 0 }}>No visit requests submitted.</p>
        )}
      </div>

      {/* Request Visit Dialog Modal */}
      {showRequestModal && (
        <div className="ph-modal-overlay" onClick={() => setShowRequestModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div className="ph-modal" onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div className="ph-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12, marginBottom: 16 }}>
              <span className="ph-modal-title" style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>🛡️ Request Supervisor Support Visit</span>
              <button className="ph-modal-close" onClick={() => setShowRequestModal(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Reason for Supervisor presence</label>
                <textarea 
                  className="mgt-input" 
                  value={reqReason} 
                  onChange={e => setReqReason(e.target.value)} 
                  placeholder="Explain why you need the supervisor at the property..." 
                  style={{ width: '100%', height: 100, resize: 'none', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="mgt-btn secondary" onClick={() => setShowRequestModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'none', cursor: 'pointer' }}>Cancel</button>
                <button className="mgt-btn primary" onClick={handleSubmitRequest} style={{ padding: '8px 16px', borderRadius: 8, background: '#10B981', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Attendance Scanner FAB */}
      <button 
        className="wh-scanner-fab" 
        onClick={handleOpenScanner} 
        id="worker-attendance-scanner-fab" 
        aria-label="Open Attendance Scanner"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          <rect width="7" height="5" x="7" y="7" rx="1"/><rect width="7" height="5" x="10" y="12" rx="1"/>
        </svg>
        <span>Attendance Scanner</span>
      </button>

      {/* Scanner Dialog Modal */}
      {isScannerOpen && (
        <div className="ph-modal-overlay" onClick={() => setIsScannerOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div className="ph-modal" onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div className="ph-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12, marginBottom: 16 }}>
              <span className="ph-modal-title" style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>📷 Scanner / Attendance Scan</span>
              <button className="ph-modal-close" onClick={() => setIsScannerOpen(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>✕</button>
            </div>

            {scanSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{ fontSize: 50, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#15803D', margin: '0 0 8px 0' }}>
                  {successAction === 'check-in' ? 'Check-In Successful!' : 'Check-Out Successful!'}
                </h3>
                <p style={{ color: '#475569', fontSize: 14, margin: '0 0 20px 0' }}>
                  Your attendance has been recorded successfully for {scannerClient} ({scannerShift} Shift).
                </p>
                <button 
                  onClick={() => setIsScannerOpen(false)} 
                  className="mgt-btn primary"
                  style={{ width: '100%', padding: 12, borderRadius: 10, background: '#10B981', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                {scanError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16, lineHeight: 1.4 }}>
                    ⚠️ {scanError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Select Property / Client</label>
                  <select 
                    value={scannerClient} 
                    onChange={e => setScannerClient(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  >
                    <option value="Acme Corp">Acme Corp</option>
                    <option value="Apex">Apex</option>
                    <option value="Nexus">Nexus</option>
                    <option value="Renaissance Bengaluru Race Course Hotel">Renaissance Hotel</option>
                    <option value="Holiday Inn Express Bengaluru Whitefield Itpl, an IHG Hotel">Holiday Inn</option>
                    <option value="JW Marriott Hotel Kolkata">JW Marriott</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Select Assigned Shift</label>
                  <select 
                    value={scannerShift} 
                    onChange={e => setScannerShift(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  >
                    <option value="Day">☀️ Day Shift</option>
                    <option value="Night">🌙 Night Shift</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => handleScanAction('check-in')}
                    className="mgt-btn primary"
                    style={{ flex: 1, padding: 12, borderRadius: 10, background: '#2563EB', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📥 Scan Check-In
                  </button>
                  <button 
                    onClick={() => handleScanAction('check-out')}
                    className="mgt-btn secondary"
                    style={{ flex: 1, padding: 12, borderRadius: 10, background: '#475569', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📤 Scan Check-Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* All other placeholder exports — unchanged                   */
/* ─────────────────────────────────────────────────────────── */
const PlaceholderPage = ({ title, showDescription = true }) => (
  <div className="worker-placeholder-page">
    <div className="placeholder-card">
      <h1 className="placeholder-title">{title}</h1>
      {showDescription && (
        <p className="placeholder-text">This section will be added later.</p>
      )}
      <div className="placeholder-illustration">
        <div className="illustration-box"></div>
        <div className="illustration-line short"></div>
        <div className="illustration-line long"></div>
      </div>
    </div>
  </div>
);

export const WorkerMember = () => <MemberPortal />;
export const WorkerHome = () => <HomePage />;
export const WorkerManagement = () => <ManagementPortal />;
export const WorkerAttendanceBreakdown = () => <PlaceholderPage title="Attendance Breakdown" />;
export const WorkerTaskManager = () => <PlaceholderPage title="Task Manager" />;
export const WorkerRequest = () => <PlaceholderPage title="General Requests" />;
export const WorkerComplaint = () => <WorkerComplaintsView />;
export const WorkerMaterialRequirement = () => <Navigate to="/worker/management" replace state={{ view: 'materials' }} />;
export const WorkerTicket = () => <PlaceholderPage title="Tickets" />;
export const WorkerPayment = () => <PlaceholderPage title="Payment & Settlements" />;
export const WorkerTechnicalTeam = () => <PlaceholderPage title="Technical Team" />;
export const WorkerRoasterMaster = () => <Navigate to="/worker/management" replace state={{ view: 'roster' }} />;
export const WorkerProfile = () => <PlaceholderPage title="Worker Profile" />;
export const WorkerSettings = () => <PlaceholderPage title="Settings" />;
