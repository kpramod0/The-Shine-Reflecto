import React from 'react';
import './Home.css';

/* ── Helper ── */
const openGoogleMaps = (location) => {
  if (!location) return;
  const encodedLocation = encodeURIComponent(location);
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, "_blank");
};

/* ── Icons (SVG) ── */
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

/* ── Empty State ── */
export const EmptyState = ({ message }) => (
  <div className="home-empty-state">{message}</div>
);

/* ── Attendance Scanner Button ── */
export const AttendanceScannerButton = ({ onClick }) => (
  <button className="attendance-scanner-fab" onClick={onClick}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
    Attendance Scanner
  </button>
);

/* ── Directory Section ── */
export const DirectoryCard = ({ label, value, icon, accentColor, bgColor }) => (
  <div className="home-card directory-card" style={{ borderLeftColor: accentColor }}>
    <div className="directory-icon-wrap" style={{ background: bgColor, color: accentColor }}>
      {icon}
    </div>
    <div className="directory-info">
      <span className="directory-label">{label}</span>
      <span className="directory-value" style={{ color: accentColor }}>{value}</span>
    </div>
  </div>
);

export const DirectorySection = ({ data }) => {
  if (!data) return null;
  return (
    <div className="home-section">
      <h2 className="home-section-title">Directory</h2>
      <div className="home-grid-3">
        <DirectoryCard 
          label="Active Users" 
          value={data.activeUsers} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          accentColor="#2563EB" 
          bgColor="#EFF6FF" 
        />
        <DirectoryCard 
          label="Active Clients" 
          value={data.activeClients} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>}
          accentColor="#14B8A6" 
          bgColor="#F0FDFA" 
        />
        <DirectoryCard 
          label="Field Workers" 
          value={data.fieldWorkers} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
          accentColor="#10B981" 
          bgColor="#ECFDF5" 
        />
      </div>
    </div>
  );
};

/* ── Assigned Duty Section ── */
export const AssignedDutyCard = ({ duty }) => {
  return (
    <div className="home-card duty-card clickable" onClick={() => openGoogleMaps(duty.location)}>
      <div className="duty-icon-wrap">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
      </div>
      <div className="duty-content">
        <h3 className="duty-title">Property: {duty.propertyName}</h3>
        <p className="duty-sub">{duty.shift}</p>
        <p className="duty-sub">Client: {duty.clientName}</p>
      </div>
      <div className="duty-action">
        <ArrowRightIcon />
      </div>
    </div>
  );
};

export const ClientAssignedWorkerCard = ({ worker }) => {
  return (
    <div className="home-card duty-card clickable" onClick={() => openGoogleMaps(worker.location)}>
      <div className="duty-icon-wrap" style={{ borderRadius: '50%' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
      </div>
      <div className="duty-content">
        <h3 className="duty-title">{worker.workerName} <span style={{fontSize: 12, fontWeight: 600, color: '#10B981', background: '#ECFDF5', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>{worker.status}</span></h3>
        <p className="duty-sub">{worker.phone} · {worker.shift}</p>
        <p className="duty-sub">{worker.propertyName}</p>
      </div>
      <div className="duty-action">
        <LocationIcon />
      </div>
    </div>
  );
};

export const AssignedDutySection = ({ assignedDuty, clientWorkers, role }) => {
  return (
    <div className="home-section">
      <h2 className="home-section-title">Assigned Duty</h2>
      
      {role === 'Client' ? (
        clientWorkers && clientWorkers.length > 0 ? (
          <div className="home-grid-2">
            {clientWorkers.map((w, i) => <ClientAssignedWorkerCard key={i} worker={w} />)}
          </div>
        ) : <EmptyState message="No workers assigned today." />
      ) : (
        assignedDuty ? (
          <AssignedDutyCard duty={assignedDuty} />
        ) : <EmptyState message="No duty assigned today." />
      )}
    </div>
  );
};

/* ── Today's Tasks Section ── */
export const TaskSummaryCard = ({ title, data, icon }) => (
  <div className="home-card task-card clickable">
    <div className="task-icon-wrap">
      {icon}
    </div>
    <div className="task-content">
      <h3 className="task-title">{title}: {data.count}</h3>
      {data.deadline && <p className="task-sub">Deadline: {data.deadline}</p>}
      {data.priority && <p className="task-sub">Priority: {data.priority}</p>}
    </div>
    <div className="task-action">
      <ArrowRightIcon />
    </div>
  </div>
);

export const TodaysTasksSection = ({ tasks }) => {
  if (!tasks) return null;
  return (
    <div className="home-section">
      <h2 className="home-section-title">Today's Tasks</h2>
      <div className="home-grid-2">
        <TaskSummaryCard 
          title="Assigned Tasks" 
          data={tasks.assignedTasks} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} 
        />
        <TaskSummaryCard 
          title="Pending Tasks Summary" 
          data={tasks.pendingTasks} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>} 
        />
      </div>
    </div>
  );
};

/* ── Roaster & Tasks Section ── */
export const RoasterTaskSection = () => {
  return (
    <div className="home-section">
      <h2 className="home-section-title">Roaster & Tasks</h2>
      <div className="rt-btn-row">
        <button className="rt-btn rt-btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Roaster
        </button>
        <button className="rt-btn rt-btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
          Add Task
        </button>
      </div>
    </div>
  );
};

/* ── Analysis Section ── */
export const AnalysisCard = ({ title, progressItems }) => (
  <div className="home-card analysis-card">
    <div className="analysis-header">
      <h3 className="analysis-title">{title}</h3>
      <div className="analysis-filters">
        <select className="analysis-select"><option>All Supervisors</option></select>
        <select className="analysis-select"><option>All Clients</option></select>
        <select className="analysis-select"><option>All Shifts</option></select>
        <select className="analysis-select"><option>Date Wise</option></select>
      </div>
    </div>
    <div className="progress-group">
      {progressItems.map((item, i) => (
        <div key={i} className="progress-item">
          <span className="progress-label">{item.label}</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: item.percent, background: item.color }}>
              {item.percent}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AnalysisSection = () => {
  const attendanceProgress = [
    { label: 'Marked Attendance', percent: '72%', color: '#22C55E' },
    { label: 'Pending Attendance', percent: '28%', color: '#EF4444' },
  ];
  const taskProgress = [
    { label: 'Completed', percent: '52%', color: '#2563EB' },
    { label: 'Defaulted', percent: '28%', color: '#F59E0B' },
    { label: 'Not Completed', percent: '20%', color: '#8B5CF6' },
  ];

  return (
    <div className="home-section">
      <h2 className="home-section-title">Analysis</h2>
      <div className="home-grid-2">
        <AnalysisCard title="Employee Attendance" progressItems={attendanceProgress} />
        <AnalysisCard title="Task History" progressItems={taskProgress} />
      </div>
    </div>
  );
};

/* ── Requests Section ── */
export const RequestsSection = ({ requests }) => {
  return (
    <div className="home-section">
      <h2 className="home-section-title">Requests</h2>
      <div className="home-card">
        {requests && requests.length > 0 ? (
          <div>
            {/* Map requests here if provided, else NA */}
          </div>
        ) : (
          <EmptyState message="NA" />
        )}
      </div>
    </div>
  );
};
