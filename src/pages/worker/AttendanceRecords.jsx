import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AttendanceRecords.css';

/* ── Mock Data ─────────────────────────────────────────────────── */
const MOCK_ATTENDANCE = [
  { id: 1, date: "2025-01-31", client: "Client A", checkIn: "09:15 AM", checkOut: "06:30 PM", totalHours: 9.25, shift: "Day", status: "Present", notes: "Regular workday" },
  { id: 2, date: "2025-01-08", client: "",         checkIn: "",         checkOut: "",         totalHours: 0,    shift: "",    status: "Official Leave", notes: "Approved leave" },
  { id: 3, date: "2025-01-15", client: "Client A", checkIn: "",         checkOut: "",         totalHours: 0,    shift: "Day", status: "Absent (Unofficial)", notes: "Duty assigned but attendance not marked" },
  { id: 4, date: "2025-01-01", client: "Client B", checkIn: "09:00 AM", checkOut: "06:00 PM", totalHours: 9.00, shift: "Day", status: "Present", notes: "On time arrival" },
  { id: 5, date: "2025-01-29", client: "Client C", checkIn: "08:45 AM", checkOut: "05:45 PM", totalHours: 9.00, shift: "Day", status: "Present", notes: "Early arrival" },
  { id: 6, date: "2025-01-28", client: "Client A", checkIn: "09:10 AM", checkOut: "06:15 PM", totalHours: 9.08, shift: "Day", status: "Present", notes: "Regular workday" },
];

// Generate more mock data for May 2026 as per screenshot
const MAY_2026_RECORDS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
  const isWeekend = [0, 6].includes(new Date(2026, 4, day).getDay());
  
  if (isWeekend) return { id: 100 + i, date: dateStr, status: "Weekend/Holiday", client: "", checkIn: "", checkOut: "", totalHours: 0, shift: "", notes: "" };
  
  // Mix of present, leaves, etc.
  if (day === 5) return { id: 100 + i, date: dateStr, status: "Official Leave", client: "", checkIn: "", checkOut: "", totalHours: 0, shift: "", notes: "Personal work" };
  if (day === 15) return { id: 100 + i, date: dateStr, status: "Absent (Unofficial)", client: "Client A", checkIn: "", checkOut: "", totalHours: 0, shift: "Day", notes: "Emergency" };
  
  return { id: 100 + i, date: dateStr, status: "Present", client: "Client A", checkIn: "09:00 AM", checkOut: "06:00 PM", totalHours: 9.0, shift: "Day", notes: "Completed task" };
});

const ALL_RECORDS = [...MOCK_ATTENDANCE, ...MAY_2026_RECORDS];

/* ── Helper Functions ───────────────────────────────────────────── */
const calculateStats = (records, workingDays = 21) => {
  const daysWorked = records.filter(r => r.status === "Present").length;
  const officialLeaves = records.filter(r => r.status === "Official Leave").length;
  const unofficialAbsences = records.filter(r => r.status === "Absent (Unofficial)").length;
  const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const avgHoursPerDay = daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : 0;
  const punctualityScore = (daysWorked + unofficialAbsences) > 0 
    ? Math.round((daysWorked / (daysWorked + unofficialAbsences)) * 100) 
    : 100;
  const avgAbsences = workingDays > 0 
    ? ((officialLeaves + unofficialAbsences) / workingDays).toFixed(2) 
    : 0;

  return { daysWorked, officialLeaves, unofficialAbsences, totalHours, avgHoursPerDay, punctualityScore, avgAbsences, workingDays };
};

const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month, year) => {
  return new Date(year, month, 1).getDay();
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026];

/* ── Main Component ─────────────────────────────────────────────── */
export default function AttendanceRecords() {
  const { user } = useAuth();
  
  // Section Visibility
  const [visibleSections, setVisibleSections] = useState({
    calendar: true,
    summary: true,
    detailed: true,
    quickActions: true
  });

  const toggleSection = (section) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAll = (show) => {
    setVisibleSections({
      calendar: show,
      summary: show,
      detailed: show,
      quickActions: show
    });
  };

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(4); // May (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2026);
  
  const [drDateFrom, setDrDateFrom] = useState("2025-01-01");
  const [drDateTo, setDrDateTo] = useState("2025-01-31");
  const [drStatus, setDrStatus] = useState("All Status");
  const [drSearch, setDrSearch] = useState("");

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Selected Day Details
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);

  // Derived Data for Monthly
  const monthlyRecords = useMemo(() => {
    return ALL_RECORDS.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [selectedMonth, selectedYear]);

  const monthlyStats = useMemo(() => calculateStats(monthlyRecords), [monthlyRecords]);

  // Derived Data for Detailed Table
  const filteredRecords = useMemo(() => {
    return ALL_RECORDS.filter(r => {
      const d = new Date(r.date);
      const from = new Date(drDateFrom);
      const to = new Date(drDateTo);
      
      const inDateRange = d >= from && d <= to;
      const statusMatch = drStatus === "All Status" || r.status.includes(drStatus);
      const searchMatch = !drSearch || 
        r.date.includes(drSearch) || 
        r.notes.toLowerCase().includes(drSearch.toLowerCase()) || 
        r.client.toLowerCase().includes(drSearch.toLowerCase());
      
      return inDateRange && statusMatch && searchMatch;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [drDateFrom, drDateTo, drStatus, drSearch]);

  const drStats = useMemo(() => calculateStats(filteredRecords), [filteredRecords]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  return (
    <div className="ar-page">
      {/* ── Header & Breadcrumbs ── */}
      <div className="ar-header">
        <nav className="ar-breadcrumbs">
          <span>Dashboard</span>
          <span className="ar-sep">•</span>
          <span className="ar-active">Attendance Records</span>
        </nav>
        <div className="ar-title-row">
          <div>
            <h1 className="ar-page-title">Attendance Records</h1>
            <p className="ar-page-subtitle">Track your attendance history and Your Performance</p>
          </div>
          
          <div className="ar-month-selectors">
            <button className="ar-nav-btn" onClick={handlePrevMonth}>◀</button>
            <select className="ar-select" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="ar-select" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="ar-nav-btn" onClick={handleNextMonth}>▶</button>
          </div>
        </div>
      </div>

      {/* ── Global Controls ── */}
      <div className="ar-global-controls">
        <button className="ar-control-btn" onClick={() => toggleAll(true)}>Show All</button>
        <button className="ar-control-btn" onClick={() => toggleAll(false)}>Hide All</button>
      </div>

      <div className="ar-grid">
        {/* ── Left Column: Calendar ── */}
        <div className="ar-col-left">
          <SectionWrapper 
            title={`${MONTHS[selectedMonth]} ${selectedYear}`} 
            visible={visibleSections.calendar} 
            onToggle={() => toggleSection('calendar')}
          >
            <AttendanceCalendar 
              month={selectedMonth} 
              year={selectedYear} 
              records={monthlyRecords} 
              onDayClick={(rec) => setSelectedDayRecord(rec)}
            />
            {selectedDayRecord && (
              <div className="ar-day-details-overlay">
                <div className="ar-day-details-card">
                  <button className="close-btn" onClick={() => setSelectedDayRecord(null)}>×</button>
                  <h3 className="details-title">Day Details: {new Date(selectedDayRecord.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</h3>
                  <div className="details-grid">
                    <div className="detail-item"><span>Status:</span> <StatusBadge status={selectedDayRecord.status} /></div>
                    <div className="detail-item"><span>Client:</span> <strong>{selectedDayRecord.client || "N/A"}</strong></div>
                    <div className="detail-item"><span>In Time:</span> <strong>{selectedDayRecord.checkIn || "--:--"}</strong></div>
                    <div className="detail-item"><span>Out Time:</span> <strong>{selectedDayRecord.checkOut || "--:--"}</strong></div>
                    <div className="detail-item"><span>Total Hours:</span> <strong>{selectedDayRecord.totalHours > 0 ? `${Math.floor(selectedDayRecord.totalHours)}h ${Math.round((selectedDayRecord.totalHours % 1) * 60)}m` : "0h"}</strong></div>
                    <div className="detail-item full"><span>Notes:</span> <p>{selectedDayRecord.notes || "No notes available for this day."}</p></div>
                  </div>
                </div>
              </div>
            )}
          </SectionWrapper>

          <SectionWrapper 
            title="Detailed Records" 
            subtitle="Chronological attendance history with detailed information"
            visible={visibleSections.detailed} 
            onToggle={() => toggleSection('detailed')}
          >
            <DetailedRecordsSection 
              workerName={user?.name || "Parmeshwar"}
              records={filteredRecords}
              stats={drStats}
              filters={{ drDateFrom, setDrDateFrom, drDateTo, setDrDateTo, drStatus, setDrStatus, drSearch, setDrSearch }}
            />
          </SectionWrapper>
        </div>

        {/* ── Right Column: Summary & Actions ── */}
        <div className="ar-col-right">
          <SectionWrapper 
            title={`${MONTHS[selectedMonth]} ${selectedYear} Summary`} 
            visible={visibleSections.summary} 
            onToggle={() => toggleSection('summary')}
          >
            <MonthlySummary stats={monthlyStats} />
          </SectionWrapper>

          <SectionWrapper 
            title="Quick Actions" 
            visible={visibleSections.quickActions} 
            onToggle={() => toggleSection('quickActions')}
          >
            <QuickActions 
              onExportPDF={() => alert("Generating PDF...")}
              onExportCSV={() => alert("Generating CSV...")}
              onRequestLeave={() => setShowLeaveModal(true)}
              onReportIssue={() => setShowIssueModal(true)}
            />
          </SectionWrapper>
        </div>
      </div>

      {/* ── Modals ── */}
      {showLeaveModal && <LeaveRequestModal onClose={() => setShowLeaveModal(false)} />}
      {showIssueModal && <ReportIssueModal onClose={() => setShowIssueModal(false)} />}
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────────── */

function SectionWrapper({ title, subtitle, children, visible, onToggle }) {
  return (
    <div className="ar-section-card">
      <div className="ar-section-header">
        <div>
          <h2 className="ar-section-title">{title}</h2>
          {subtitle && <p className="ar-section-subtitle">{subtitle}</p>}
        </div>
        <button className="ar-hide-btn" onClick={onToggle}>
          {visible ? 'Hide' : 'Show'} 
          <span className={`ar-arrow ${visible ? '' : 'down'}`}>▾</span>
        </button>
      </div>
      {visible && <div className="ar-section-body">{children}</div>}
    </div>
  );
}

function AttendanceCalendar({ month, year, records }) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  
  const calendarDays = [];
  // Empty slots before month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="ar-cal-day empty" />);
  }
  
  // Real days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const record = records.find(r => r.date === dateStr);
    const isWeekend = [0, 6].includes(new Date(year, month, d).getDay());
    
    let statusClass = isWeekend ? "weekend" : "";
    if (record) {
      if (record.status === "Present") statusClass = "present";
      else if (record.status === "Official Leave") statusClass = "official-leave";
      else if (record.status === "Absent (Unofficial)") statusClass = "unofficial-absence";
    }

    calendarDays.push(
      <div 
        key={d} 
        className={`ar-cal-day ${statusClass}`} 
        title={record ? `${record.status}\n${record.client}\n${record.notes}` : ""}
        onClick={() => record && onDayClick(record)}
      >
        <span className="ar-day-num">{d}</span>
      </div>
    );
  }

  return (
    <div className="ar-calendar-wrap">
      <div className="ar-calendar-legend">
        <div className="legend-item"><span className="swatch present" /> Present</div>
        <div className="legend-item"><span className="swatch official-leave" /> Official Leave</div>
        <div className="legend-item"><span className="swatch unofficial-absence" /> Unofficial Absence</div>
        <div className="legend-item"><span className="swatch weekend" /> Weekend/Holiday</div>
      </div>
      <div className="ar-calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="ar-cal-head">{d}</div>)}
        {calendarDays}
      </div>
    </div>
  );
}

function MonthlySummary({ stats }) {
  return (
    <div className="ar-summary-stack">
      <SummaryItem label="Days Worked" value={stats.daysWorked} sub="This month" color="#10B981" />
      <SummaryItem label="Official Leaves" value={stats.officialLeaves} sub="Approved" color="#2563EB" />
      <SummaryItem label="Unofficial Absences" value={stats.unofficialAbsences} sub="Unplanned" color="#F59E0B" />
      <SummaryItem label="Average hours/day" value={`${stats.avgHoursPerDay}h`} sub="Worked ÷ Days worked" color="#64748B" />
      <SummaryItem label="Punctuality score" value={`${stats.punctualityScore}%`} sub="Present vs Unofficial" color="#3FA7A5" />
      <SummaryItem label="Total hours" value={`${Math.floor(stats.totalHours)}h ${Math.round((stats.totalHours % 1) * 60).toString().padStart(2, '0')}m`} sub="This month" color="#0B1220" />
      <div className="ar-summary-footer">out of {stats.workingDays} working days</div>
    </div>
  );
}

function SummaryItem({ label, value, sub, color }) {
  return (
    <div className="ar-summary-item" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="ar-summary-info">
        <span className="ar-summary-label">{label}</span>
        <span className="ar-summary-sub">{sub}</span>
      </div>
      <span className="ar-summary-value">{value}</span>
    </div>
  );
}

function DetailedRecordsSection({ workerName, records, stats, filters }) {
  return (
    <div className="ar-dr-wrap">
      <div className="ar-dr-filters">
        <div className="ar-filter-group">
          <label>Worker</label>
          <input type="text" value={workerName} disabled className="ar-input locked" />
        </div>
        <div className="ar-filter-group">
          <label>Date Range</label>
          <div className="ar-date-inputs">
            <input type="date" value={filters.drDateFrom} onChange={e => filters.setDrDateFrom(e.target.value)} className="ar-input" />
            <span>to</span>
            <input type="date" value={filters.drDateTo} onChange={e => filters.setDrDateTo(e.target.value)} className="ar-input" />
          </div>
        </div>
        <div className="ar-filter-group">
          <label>Status</label>
          <select className="ar-select" value={filters.drStatus} onChange={e => filters.setDrStatus(e.target.value)}>
            <option>All Status</option>
            <option>Present</option>
            <option>Official Leave</option>
            <option>Absent (Unofficial)</option>
          </select>
        </div>
        <div className="ar-filter-group wide">
          <label>Search by date, notes, or client</label>
          <div className="ar-search-wrap">
            <input type="text" placeholder="e.g., early arrival, Client A..." value={filters.drSearch} onChange={e => filters.setDrSearch(e.target.value)} className="ar-input" />
            <button className="ar-apply-btn">Apply</button>
          </div>
        </div>
      </div>

      <div className="ar-dr-mini-stats">
        <div className="mini-stat-card green">
          <span className="label">Days Worked</span>
          <span className="value">{stats.daysWorked}</span>
        </div>
        <div className="mini-stat-card blue">
          <span className="label">Official Leaves</span>
          <span className="value">{stats.officialLeaves}</span>
        </div>
        <div className="mini-stat-card orange">
          <span className="label">Unofficial Absences</span>
          <span className="value">{stats.unofficialAbsences}</span>
        </div>
      </div>

      <div className="ar-table-responsive">
        <table className="ar-table">
          <thead>
            <tr>
              <th>DATE</th><th>CLIENT</th><th>CHECK IN</th><th>CHECK OUT</th><th>TOTAL HOURS</th><th>SHIFT</th><th>STATUS</th><th>NOTES</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td>{r.client || "-"}</td>
                <td>{r.checkIn || "-"}</td>
                <td>{r.checkOut || "-"}</td>
                <td>{r.totalHours > 0 ? `${Math.floor(r.totalHours)}h ${Math.round((r.totalHours % 1) * 60)}m` : "0h 00m"}</td>
                <td>{r.shift || "-"}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="ar-td-notes">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view cards */}
      <div className="ar-mobile-records">
        {records.map(r => (
          <MobileRecordCard key={r.id} record={r} />
        ))}
      </div>
    </div>
  );
}

function MobileRecordCard({ record: r }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`ar-mobile-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="ar-mobile-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ar-mobile-header-left">
          <span className="ar-mobile-date">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
          <div className="ar-mobile-client-name">{r.client || "No Client"}</div>
        </div>
        <div className="ar-mobile-header-right">
          <StatusBadge status={r.status} />
          <span className={`ar-mobile-expand-icon ${isExpanded ? 'active' : ''}`}>▾</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="ar-mobile-card-body">
          <div className="ar-mobile-detail-grid">
            <div className="ar-mobile-detail-item">
              <span>Client:</span>
              <strong>{r.client || "N/A"}</strong>
            </div>
            <div className="ar-mobile-detail-item">
              <span>Hours:</span>
              <strong>{r.checkIn ? `${r.checkIn} - ${r.checkOut}` : "N/A"}</strong>
            </div>
            <div className="ar-mobile-detail-item">
              <span>Total:</span>
              <strong>{r.totalHours > 0 ? `${Math.floor(r.totalHours)}h ${Math.round((r.totalHours % 1) * 60)}m` : "0h"}</strong>
            </div>
            <div className="ar-mobile-detail-item">
              <span>Shift:</span>
              <strong>{r.shift || "N/A"}</strong>
            </div>
          </div>
          {r.notes && (
            <div className="ar-mobile-notes-section">
              <span>Notes:</span>
              <p>{r.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  let cls = "status-badge ";
  if (status.includes("Present")) cls += "present";
  else if (status.includes("Official Leave")) cls += "official";
  else if (status.includes("Absent")) cls += "absent";
  else cls += "default";
  
  return <span className={cls}>{status}</span>;
}

function QuickActions({ onExportPDF, onExportCSV, onRequestLeave, onReportIssue }) {
  return (
    <div className="ar-actions-stack">
      <div className="ar-action-item">
        <div className="ar-action-info">
          <strong>Export PDF</strong>
          <span>Create a printable report</span>
        </div>
        <button className="ar-action-btn blue" onClick={onExportPDF}>Download PDF</button>
      </div>
      <div className="ar-action-item">
        <div className="ar-action-info">
          <strong>Export CSV</strong>
          <span>Spreadsheet friendly data</span>
        </div>
        <button className="ar-action-btn green" onClick={onExportCSV}>Download CSV</button>
      </div>
      <div className="ar-action-item">
        <div className="ar-action-info">
          <strong>Request Leave</strong>
          <span>Submit a new leave</span>
        </div>
        <button className="ar-action-btn outline" onClick={onRequestLeave}>Open →</button>
      </div>
      <div className="ar-action-item">
        <div className="ar-action-info">
          <strong>Report Issue</strong>
          <span>Let us know a problem</span>
        </div>
        <button className="ar-action-btn outline" onClick={onReportIssue}>Open →</button>
      </div>
      <p className="ar-action-footer">Exports are generated from the filtered results.</p>
    </div>
  );
}

function LeaveRequestModal({ onClose }) {
  const [step, setStep] = useState(1); // 1=form, 2=pending
  const [leaveData, setLeaveData] = useState({ type: 'Sick Leave', from: '', to: '', reason: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="ar-modal-overlay">
      <div className="ar-modal">
        <button className="ar-modal-close" onClick={onClose}>×</button>
        {step === 1 ? (
          <>
            <h2 className="ar-modal-title">Request Leave</h2>
            <form className="ar-modal-form" onSubmit={handleSubmit}>
              <div className="ar-modal-field">
                <label>Leave Type</label>
                <select className="ar-select" value={leaveData.type} onChange={e => setLeaveData({...leaveData, type: e.target.value})}>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Paid Leave</option>
                  <option>Unpaid Leave</option>
                </select>
              </div>
              <div className="ar-modal-row">
                <div className="ar-modal-field">
                  <label>From Date</label>
                  <input type="date" required value={leaveData.from} onChange={e => setLeaveData({...leaveData, from: e.target.value})} className="ar-input" />
                </div>
                <div className="ar-modal-field">
                  <label>To Date</label>
                  <input type="date" required value={leaveData.to} onChange={e => setLeaveData({...leaveData, to: e.target.value})} className="ar-input" />
                </div>
              </div>
              <div className="ar-modal-field">
                <label>Reason</label>
                <textarea rows="3" required placeholder="Describe your reason..." value={leaveData.reason} onChange={e => setLeaveData({...leaveData, reason: e.target.value})} className="ar-input" />
              </div>
              <div className="ar-modal-field">
                <label>Attach Document (Optional)</label>
                <input type="file" className="ar-input" />
              </div>
              <button type="submit" className="ar-submit-btn">Submit Request</button>
            </form>
          </>
        ) : (
          <div className="ar-leave-status-view">
            <div className="ar-status-icon pending">⌛</div>
            <h2 className="ar-modal-title">Request Submitted</h2>
            <div className="ar-status-timeline">
              <div className="timeline-item active">
                <div className="dot" />
                <div className="content">
                  <strong>Pending Supervisor Approval</strong>
                  <span>Your request is being reviewed by the supervisor.</span>
                </div>
              </div>
              <div className="timeline-item disabled">
                <div className="dot" />
                <div className="content">
                  <strong>Admin Approval</strong>
                  <span>Waiting for supervisor acceptance.</span>
                </div>
              </div>
            </div>
            <button className="ar-submit-btn outline" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportIssueModal({ onClose }) {
  return (
    <div className="ar-modal-overlay">
      <div className="ar-modal">
        <button className="ar-modal-close" onClick={onClose}>×</button>
        <h2 className="ar-modal-title">Report Issue</h2>
        <form className="ar-modal-form" onSubmit={(e) => { e.preventDefault(); alert("Issue reported!"); onClose(); }}>
          <div className="ar-modal-field">
            <label>Issue Type</label>
            <select className="ar-select">
              <option>Attendance Mismatch</option>
              <option>Payment Issue</option>
              <option>Workplace Conflict</option>
              <option>Technical Problem</option>
              <option>Other</option>
            </select>
          </div>
          <div className="ar-modal-field">
            <label>Description</label>
            <textarea rows="4" required placeholder="Describe the issue in detail..." className="ar-input" />
          </div>
          <div className="ar-modal-field">
            <label>Attach Image (Optional)</label>
            <input type="file" className="ar-input" />
          </div>
          <button type="submit" className="ar-submit-btn">Submit Report</button>
        </form>
      </div>
    </div>
  );
}
