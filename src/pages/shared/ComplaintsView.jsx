import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getComplaints, 
  saveComplaints,
  SUPERVISOR_SCOPES,
  addNotification,
  COMPLAINT_STATUS
} from './ManagementPortal';
import './Dashboards.css'; // For shared modal styles

export function ComplaintsView({ onBack, user }) {
  const role = user?.role;
  const [complaints, setComplaints] = useState(() => getComplaints());
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'detail'
  const [selectedCmp, setSelectedCmp] = useState(null);

  // Action State
  const [actionModal, setActionModal] = useState(null); // { type: 'approve', cmpId: '...' }
  const [actionNotes, setActionNotes] = useState('');

  // Isolation
  const accessibleComplaints = useMemo(() => {
    let raw = complaints;
    if (role === 'worker' || role === 'client') {
      return raw.filter(c => c.createdByMobile === user.mobile);
    } else if (role === 'supervisor') {
      const scope = SUPERVISOR_SCOPES[user.mobile];
      if (scope) {
        const workerMobiles = scope.workers.map(w => w.phone);
        // Show complaints from assigned workers + client complaints + own complaints
        return raw.filter(c => 
          workerMobiles.includes(c.createdByMobile) || 
          c.supervisorMobile === user.mobile || 
          c.createdByMobile === user.mobile ||
          (c.role === 'client' && scope.clients.includes(c.clientName))
        );
      }
      return raw;
    }
    return raw; // Admin sees all
  }, [complaints, role, user.mobile]);

  const handleAction = () => {
    if (!actionModal) return;
    const { type, cmpId } = actionModal;
    
    const idx = complaints.findIndex(c => c.id === cmpId);
    if (idx === -1) return;

    const cmp = { ...complaints[idx] };
    const now = new Date().toISOString();
    
    let newStatus = cmp.status;
    let timelineAction = '';

    if (role === 'supervisor') {
      if (type === 'approve') {
        newStatus = COMPLAINT_STATUS.SUPERVISOR_APPROVED;
        timelineAction = 'Approved & Forwarded to Admin';
        addNotification('8830227359', 'Admin User', `Supervisor ${user.name} forwarded a complaint: ${cmp.title}`);
        addNotification(cmp.createdByMobile, cmp.createdBy, `Your complaint was forwarded to Admin.`);
      } else if (type === 'reject') {
        newStatus = COMPLAINT_STATUS.SUPERVISOR_REJECTED;
        timelineAction = 'Rejected by Supervisor';
        addNotification(cmp.createdByMobile, cmp.createdBy, `Your complaint was REJECTED by supervisor.`);
      }
    } else if (role === 'admin') {
      if (type === 'approve') {
        newStatus = COMPLAINT_STATUS.ADMIN_APPROVED;
        timelineAction = 'Admin Approved';
        addNotification(cmp.createdByMobile, cmp.createdBy, `Your complaint was APPROVED by Admin.`);
      } else if (type === 'reject') {
        newStatus = COMPLAINT_STATUS.ADMIN_REJECTED;
        timelineAction = 'Rejected by Admin';
        addNotification(cmp.createdByMobile, cmp.createdBy, `Your complaint was REJECTED by Admin.`);
      } else if (type === 'close') {
        newStatus = COMPLAINT_STATUS.CLOSED;
        timelineAction = 'Complaint Closed';
        addNotification(cmp.createdByMobile, cmp.createdBy, `Your complaint has been marked as CLOSED.`);
      }
    }

    cmp.status = newStatus;
    cmp.timeline.push({
      actor: user.name,
      role: role,
      action: timelineAction,
      timestamp: now,
      note: actionNotes
    });

    const updated = [...complaints];
    updated[idx] = cmp;
    saveComplaints(updated);
    setComplaints(updated);
    
    setActionModal(null);
    setActionNotes('');
    if (selectedCmp?.id === cmp.id) setSelectedCmp(cmp);
  };

  const renderBadge = (status) => {
    let cls = 'pending';
    if (status.includes('Approved') || status === 'Closed') cls = 'completed';
    if (status.includes('Rejected')) cls = 'cancelled';
    if (status.includes('Review')) cls = 'in-progress';
    return <span className={`mgt-badge ${cls}`}>{status}</span>;
  };

  return (
    <div className="mgt-view-container">
      <div className="mgt-header">
        <div>
          <h1 className="mgt-title">
            <span style={{ cursor: 'pointer', color: '#64748B' }} onClick={onBack}>Services & Reports &rsaquo; </span>
            Requests & Complaints
          </h1>
          <p className="mgt-subtitle">Manage worker and client complaints.</p>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="mgt-card" style={{ padding: 20 }}>
          <table className="mgt-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accessibleComplaints.map(c => (
                <tr key={c.id}>
                  <td style={{ fontSize: 12, color: '#64748B' }}>{c.id}</td>
                  <td><strong>{c.title}</strong></td>
                  <td>
                    <span style={{ color: c.priority === 'High' ? '#EF4444' : c.priority === 'Medium' ? '#F59E0B' : '#64748B', fontWeight: c.priority === 'High' ? 'bold' : 'normal' }}>
                      {c.priority}
                    </span>
                  </td>
                  <td>{renderBadge(c.status)}</td>
                  <td>{c.createdBy} <div style={{ fontSize: 11, color: '#64748B' }}>{c.role}</div></td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="mgt-btn secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => { setSelectedCmp(c); setActiveTab('detail'); }}>View</button>
                  </td>
                </tr>
              ))}
              {accessibleComplaints.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>No complaints found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'detail' && selectedCmp && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div className="mgt-card" style={{ flex: 2, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: 20 }}>{selectedCmp.title}</h2>
                <span style={{ fontSize: 13, color: '#64748B' }}>CMP ID: {selectedCmp.id}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 6 }}>{renderBadge(selectedCmp.status)}</div>
                <span style={{ fontSize: 12, fontWeight: 'bold', color: selectedCmp.priority === 'High' ? '#EF4444' : '#64748B' }}>Priority: {selectedCmp.priority}</span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Description</label>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{selectedCmp.description}</div>
            </div>

            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
              <button className="mgt-btn secondary" onClick={() => setActiveTab('list')}>&larr; Back to List</button>
              
              {role === 'supervisor' && [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.UNDER_REVIEW].includes(selectedCmp.status) && selectedCmp.role !== 'supervisor' && (
                <>
                  <button className="mgt-btn primary" onClick={() => setActionModal({ type: 'approve', cmpId: selectedCmp.id })}>Approve & Forward</button>
                  <button className="mgt-btn" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }} onClick={() => setActionModal({ type: 'reject', cmpId: selectedCmp.id })}>Reject</button>
                </>
              )}

              {role === 'admin' && [COMPLAINT_STATUS.SUPERVISOR_APPROVED, COMPLAINT_STATUS.SUBMITTED].includes(selectedCmp.status) && (
                <>
                  <button className="mgt-btn primary" onClick={() => setActionModal({ type: 'approve', cmpId: selectedCmp.id })}>Final Approve</button>
                  <button className="mgt-btn" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }} onClick={() => setActionModal({ type: 'reject', cmpId: selectedCmp.id })}>Reject</button>
                </>
              )}

              {role === 'admin' && [COMPLAINT_STATUS.ADMIN_APPROVED, COMPLAINT_STATUS.ADMIN_REJECTED].includes(selectedCmp.status) && (
                <button className="mgt-btn secondary" onClick={() => setActionModal({ type: 'close', cmpId: selectedCmp.id })}>Mark as Closed</button>
              )}
            </div>
          </div>

          <div className="mgt-card" style={{ flex: 1, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 16 }}>History Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedCmp.timeline.map((event, idx) => (
                <div key={idx} style={{ position: 'relative', paddingLeft: 20, borderLeft: '2px solid #E2E8F0', paddingBottom: idx === selectedCmp.timeline.length - 1 ? 0 : 16 }}>
                  <div style={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', background: '#3B82F6', border: '2px solid #FFF' }} />
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{new Date(event.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{event.action}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>by {event.actor} <span style={{ color: '#94A3B8' }}>({event.role})</span></div>
                  {event.note && (
                    <div style={{ fontSize: 12, color: '#334155', background: '#F8FAFC', padding: '6px 10px', borderRadius: 6, marginTop: 8, fontStyle: 'italic' }}>"{event.note}"</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="mgt-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="mgt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mgt-modal-header">
              <span className="mgt-modal-title">
                {actionModal.type === 'approve' ? 'Approve Complaint' : actionModal.type === 'reject' ? 'Reject Complaint' : 'Close Complaint'}
              </span>
              <button className="mgt-modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Notes / Remarks (Optional)</label>
                <textarea 
                  className="mgt-input" 
                  style={{ width: '100%', height: 80, resize: 'vertical' }} 
                  value={actionNotes} 
                  onChange={e => setActionNotes(e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="mgt-btn secondary" onClick={() => setActionModal(null)}>Cancel</button>
                <button className="mgt-btn primary" style={{ background: actionModal.type === 'reject' ? '#DC2626' : undefined }} onClick={handleAction}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
