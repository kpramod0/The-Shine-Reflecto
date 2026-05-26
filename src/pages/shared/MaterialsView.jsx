import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getMaterialRequests, 
  saveMaterialRequests,
  SUPERVISOR_SCOPES,
  addNotification
} from './ManagementPortal';

const MATERIAL_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_SUPERVISOR_REVIEW: 'Under Supervisor Review',
  SUPERVISOR_APPROVED: 'Supervisor Approved',
  SUPERVISOR_REJECTED: 'Supervisor Rejected',
  SENT_TO_ADMIN: 'Sent to Admin',
  UNDER_ADMIN_REVIEW: 'Under Admin Review',
  ADMIN_APPROVED: 'Admin Approved',
  ADMIN_REJECTED: 'Admin Rejected',
  ON_HOLD: 'On Hold',
  PROCUREMENT_STARTED: 'Procurement Started',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed'
};

const MATERIAL_UNITS = ['Bags', 'Litres', 'Pieces', 'Pairs', 'Rolls', 'Boxes', 'Kg', 'Metres', 'Packets', 'Sets'];

const MATERIAL_SUGGESTIONS = [
  'White Powder', 'Grinder', 'Polishing Chemical', 'Cleaning Cloth', 'Machine Parts',
  'Safety Gloves', 'Floor Polish', 'Wax Stripper', 'Mop', 'Scrubbing Pad',
  'Diamond Pads', 'Marble Sealer', 'Spray Bottle', 'Vacuum Cleaner Bag',
  'Knee Pads', 'Eye Protection Goggles', 'Face Mask', 'Burnishing Pads', 'Degreaser'
];

export function MaterialsView({ onBack, user }) {
  const role = user?.role;
  const [requests, setRequests] = useState(() => getMaterialRequests());
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'detail'
  const [selectedReq, setSelectedReq] = useState(null);

  // Form State
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Pieces');
  const [priority, setPriority] = useState('Medium');
  const [reason, setReason] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [client, setClient] = useState('Acme Corp');
  const [shift, setShift] = useState('Day');

  // Action State (Supervisor/Admin)
  const [actionModal, setActionModal] = useState(null); // { type: 'approve', reqId: '...' }
  const [actionNotes, setActionNotes] = useState('');
  const [actionQuantity, setActionQuantity] = useState('');

  // 1. Data Isolation
  const accessibleRequests = useMemo(() => {
    let raw = requests;
    if (role === 'worker') {
      return raw.filter(r => r.createdByMobile === user.mobile);
    } else if (role === 'supervisor') {
      const scope = SUPERVISOR_SCOPES[user.mobile];
      if (scope) {
        const workerMobiles = scope.workers.map(w => w.phone);
        return raw.filter(r => workerMobiles.includes(r.createdByMobile) || r.supervisorMobile === user.mobile || r.createdByMobile === user.mobile);
      }
      return raw; // fallback
    }
    // client shouldn't be here, admin sees all
    return raw.filter(r => !r.isDraft || r.createdByMobile === user.mobile); // don't show drafts of others
  }, [requests, role, user.mobile]);

  // Analytics
  const totalReqs = accessibleRequests.length;
  const pendingCount = accessibleRequests.filter(r => 
    [MATERIAL_STATUS.SUBMITTED, MATERIAL_STATUS.UNDER_SUPERVISOR_REVIEW, MATERIAL_STATUS.SENT_TO_ADMIN, MATERIAL_STATUS.UNDER_ADMIN_REVIEW].includes(r.status)
  ).length;
  const deliveredCount = accessibleRequests.filter(r => r.status === MATERIAL_STATUS.DELIVERED).length;

  const handleCreateSubmit = (isDraft) => {
    if (!materialName || !quantity || !requiredDate || !reason) {
      alert('Please fill all required fields (Material, Quantity, Date, Reason).');
      return;
    }

    const newReq = {
      id: 'MR_' + Date.now(),
      materialName,
      quantity: Number(quantity),
      unit,
      priority,
      reason,
      requiredDate,
      client,
      shift,
      status: isDraft ? MATERIAL_STATUS.DRAFT : (role === 'supervisor' ? MATERIAL_STATUS.SENT_TO_ADMIN : MATERIAL_STATUS.SUBMITTED),
      isDraft,
      createdBy: user.name,
      createdByMobile: user.mobile,
      supervisorMobile: role === 'supervisor' ? user.mobile : '9999999991', // Mock supervisor assignment
      supervisorName: role === 'supervisor' ? user.name : 'Supervisor One',
      supervisorNotes: '',
      adminNotes: '',
      quantityModified: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        { 
          actor: user.name, 
          role: role, 
          action: isDraft ? 'Saved as Draft' : 'Created request', 
          timestamp: new Date().toISOString(), 
          note: reason 
        }
      ]
    };

    const updated = [newReq, ...requests];
    saveMaterialRequests(updated);
    setRequests(updated);

    if (!isDraft) {
      if (role === 'worker') {
        addNotification(newReq.supervisorMobile, newReq.supervisorName, `New material request received from Worker ${user.name}`);
      } else if (role === 'supervisor') {
        addNotification('8830227359', 'Admin User', `New material request from Supervisor ${user.name}`);
      }
    }

    alert(isDraft ? 'Saved as Draft' : 'Request Submitted Successfully!');
    resetForm();
    setActiveTab('list');
  };

  const resetForm = () => {
    setMaterialName('');
    setQuantity(1);
    setUnit('Pieces');
    setPriority('Medium');
    setReason('');
    setRequiredDate('');
  };

  const handleAction = () => {
    if (!actionModal) return;
    const { type, reqId } = actionModal;
    
    const idx = requests.findIndex(r => r.id === reqId);
    if (idx === -1) return;

    const req = { ...requests[idx] };
    const now = new Date().toISOString();
    
    let newStatus = req.status;
    let timelineAction = '';
    
    const modifiedQty = actionQuantity ? Number(actionQuantity) : null;
    if (modifiedQty !== null && modifiedQty !== (req.quantityModified || req.quantity)) {
        req.quantityModified = modifiedQty;
        timelineAction += `Modified quantity to ${modifiedQty}. `;
    }

    if (role === 'supervisor') {
      if (type === 'approve') {
        newStatus = MATERIAL_STATUS.SENT_TO_ADMIN;
        timelineAction += 'Approved & Forwarded to Admin';
        req.supervisorNotes = actionNotes;
        addNotification('8830227359', 'Admin User', `Supervisor ${user.name} forwarded material request for ${req.materialName}`);
        addNotification(req.createdByMobile, req.createdBy, `Your material request was forwarded to Admin.`);
      } else if (type === 'reject') {
        newStatus = MATERIAL_STATUS.SUPERVISOR_REJECTED;
        timelineAction += 'Rejected by Supervisor';
        req.supervisorNotes = actionNotes;
        addNotification(req.createdByMobile, req.createdBy, `Your material request was REJECTED by supervisor.`);
      }
    } else if (role === 'admin') {
      if (type === 'approve') {
        newStatus = MATERIAL_STATUS.PROCUREMENT_STARTED;
        timelineAction += 'Admin Approved — Procurement Started';
        req.adminNotes = actionNotes;
        addNotification(req.supervisorMobile, req.supervisorName, `Material request for ${req.materialName} approved by Admin.`);
        addNotification(req.createdByMobile, req.createdBy, `Your material request was approved! Procurement started.`);
      } else if (type === 'reject') {
        newStatus = MATERIAL_STATUS.ADMIN_REJECTED;
        timelineAction += 'Rejected by Admin';
        req.adminNotes = actionNotes;
        addNotification(req.supervisorMobile, req.supervisorName, `Material request for ${req.materialName} REJECTED by Admin.`);
      } else if (type === 'deliver') {
        newStatus = MATERIAL_STATUS.DELIVERED;
        timelineAction += 'Marked as Delivered';
        req.adminNotes = actionNotes;
        addNotification(req.createdByMobile, req.createdBy, `Materials for your request have been delivered.`);
      }
    }

    req.status = newStatus;
    req.updatedAt = now;
    req.timeline.push({
      actor: user.name,
      role: role,
      action: timelineAction,
      timestamp: now,
      note: actionNotes
    });

    const updated = [...requests];
    updated[idx] = req;
    saveMaterialRequests(updated);
    setRequests(updated);
    
    setActionModal(null);
    setActionNotes('');
    setActionQuantity('');
    if (selectedReq?.id === req.id) {
        setSelectedReq(req);
    }
  };

  const renderBadge = (status) => {
    let cls = 'pending';
    if (status.includes('Delivered') || status.includes('Approved')) cls = 'completed';
    if (status.includes('Rejected')) cls = 'cancelled';
    if (status.includes('Procurement') || status.includes('Forwarded')) cls = 'in-progress';
    if (status.includes('Hold')) cls = 'on-hold';
    return <span className={`mgt-badge ${cls}`}>{status}</span>;
  };

  return (
    <div className="mgt-view-container">
      {/* Header */}
      <div className="mgt-header">
        <div>
          <h1 className="mgt-title">
            <span style={{ cursor: 'pointer', color: '#64748B' }} onClick={onBack}>Services & Reports &rsaquo; </span>
            Materials Management
          </h1>
          <p className="mgt-subtitle">Manage material requirements, approvals, and procurement tracking.</p>
        </div>
        {activeTab === 'list' && (
          <button className="mgt-btn primary" onClick={() => setActiveTab('create')}>
            ➕ Create Request
          </button>
        )}
      </div>

      {activeTab === 'list' && (
        <>
          {/* Analytics Summary */}
          <div className="mgt-stats-row" style={{ marginBottom: 20 }}>
            <div className="mgt-stat-card">
              <h3>Total Requests</h3>
              <p className="mgt-stat-val">{totalReqs}</p>
            </div>
            <div className="mgt-stat-card">
              <h3>Pending / Under Review</h3>
              <p className="mgt-stat-val" style={{ color: '#F59E0B' }}>{pendingCount}</p>
            </div>
            <div className="mgt-stat-card">
              <h3>Delivered</h3>
              <p className="mgt-stat-val" style={{ color: '#10B981' }}>{deliveredCount}</p>
            </div>
          </div>

          {/* Requests List */}
          <div className="mgt-card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Material Requests</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="mgt-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Material</th>
                    <th>Qty</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Requested By</th>
                    <th>Required Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessibleRequests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 12, color: '#64748B' }}>{r.id}</td>
                      <td><strong>{r.materialName}</strong></td>
                      <td>{r.quantityModified || r.quantity} {r.unit}</td>
                      <td>
                        <span style={{ 
                          color: r.priority === 'Urgent' ? '#EF4444' : r.priority === 'High' ? '#F59E0B' : '#64748B',
                          fontWeight: r.priority === 'Urgent' ? 'bold' : 'normal'
                        }}>
                          {r.priority}
                        </span>
                      </td>
                      <td>{renderBadge(r.status)}</td>
                      <td>
                        {r.createdBy}
                        <div style={{ fontSize: 11, color: '#64748B' }}>{r.role === 'worker' ? 'Worker' : 'Supervisor'}</div>
                      </td>
                      <td>{new Date(r.requiredDate).toLocaleDateString()}</td>
                      <td>
                        <button className="mgt-btn secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => { setSelectedReq(r); setActiveTab('detail'); }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {accessibleRequests.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>No material requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'create' && (
        <div className="mgt-card" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ marginTop: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>➕ New Material Request</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Material Name</label>
              <input 
                type="text" 
                className="mgt-input" 
                value={materialName} 
                onChange={e => setMaterialName(e.target.value)} 
                placeholder="e.g. White Powder, Mop..." 
                list="material-suggestions"
              />
              <datalist id="material-suggestions">
                {MATERIAL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Quantity</label>
                <input type="number" min="1" className="mgt-input" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Unit</label>
                <select className="mgt-select" value={unit} onChange={e => setUnit(e.target.value)}>
                  {MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Required Date</label>
                <input type="date" className="mgt-input" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Priority</label>
                <select className="mgt-select" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Property / Client</label>
              <select className="mgt-select" value={client} onChange={e => setClient(e.target.value)}>
                <option value="Acme Corp">Acme Corp</option>
                <option value="Apex">Apex</option>
                <option value="Renaissance Bengaluru Race Course Hotel">Renaissance Hotel</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Reason / Notes</label>
              <textarea 
                className="mgt-input" 
                style={{ height: 80, resize: 'vertical' }} 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Why is this material needed?"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
            <button className="mgt-btn secondary" onClick={() => setActiveTab('list')}>Cancel</button>
            <button className="mgt-btn secondary" onClick={() => handleCreateSubmit(true)}>Save Draft</button>
            <button className="mgt-btn primary" onClick={() => handleCreateSubmit(false)}>Submit Request</button>
          </div>
        </div>
      )}

      {activeTab === 'detail' && selectedReq && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Details Column */}
          <div className="mgt-card" style={{ flex: 2, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: 20 }}>{selectedReq.materialName}</h2>
                <span style={{ fontSize: 13, color: '#64748B' }}>Req ID: {selectedReq.id}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 6 }}>{renderBadge(selectedReq.status)}</div>
                <span style={{ fontSize: 12, fontWeight: 'bold', color: selectedReq.priority === 'Urgent' ? '#EF4444' : '#64748B' }}>
                  Priority: {selectedReq.priority}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Quantity</label>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {selectedReq.quantityModified ? (
                    <span>{selectedReq.quantityModified} {selectedReq.unit} <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontSize: 12 }}>{selectedReq.quantity} {selectedReq.unit}</span></span>
                  ) : (
                    <span>{selectedReq.quantity} {selectedReq.unit}</span>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Required Date</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(selectedReq.requiredDate).toLocaleDateString()}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Client / Property</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedReq.client} ({selectedReq.shift} Shift)</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Requested By</label>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedReq.createdBy} <span style={{ fontSize: 12, color: '#64748B' }}>({selectedReq.createdByMobile})</span></div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Reason / Notes</label>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{selectedReq.reason}</div>
            </div>

            {/* Action Buttons based on Role */}
            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
              <button className="mgt-btn secondary" onClick={() => setActiveTab('list')}>&larr; Back to List</button>
              
              {role === 'supervisor' && [MATERIAL_STATUS.SUBMITTED, MATERIAL_STATUS.DRAFT].includes(selectedReq.status) && (
                <>
                  <button className="mgt-btn primary" onClick={() => setActionModal({ type: 'approve', reqId: selectedReq.id })}>Approve & Forward</button>
                  <button className="mgt-btn" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }} onClick={() => setActionModal({ type: 'reject', reqId: selectedReq.id })}>Reject</button>
                </>
              )}

              {role === 'admin' && [MATERIAL_STATUS.SENT_TO_ADMIN, MATERIAL_STATUS.UNDER_ADMIN_REVIEW].includes(selectedReq.status) && (
                <>
                  <button className="mgt-btn primary" onClick={() => setActionModal({ type: 'approve', reqId: selectedReq.id })}>Final Approve / Start Procurement</button>
                  <button className="mgt-btn" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }} onClick={() => setActionModal({ type: 'reject', reqId: selectedReq.id })}>Reject</button>
                </>
              )}

              {role === 'admin' && selectedReq.status === MATERIAL_STATUS.PROCUREMENT_STARTED && (
                <button className="mgt-btn primary" style={{ background: '#10B981' }} onClick={() => setActionModal({ type: 'deliver', reqId: selectedReq.id })}>Mark as Delivered</button>
              )}
            </div>
          </div>

          {/* Timeline Column */}
          <div className="mgt-card" style={{ flex: 1, padding: 20 }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 16 }}>History Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedReq.timeline.map((event, idx) => (
                <div key={idx} style={{ position: 'relative', paddingLeft: 20, borderLeft: '2px solid #E2E8F0', paddingBottom: idx === selectedReq.timeline.length - 1 ? 0 : 16 }}>
                  <div style={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', background: '#3B82F6', border: '2px solid #FFF' }} />
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{event.action}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>by {event.actor} <span style={{ color: '#94A3B8' }}>({event.role})</span></div>
                  {event.note && (
                    <div style={{ fontSize: 12, color: '#334155', background: '#F8FAFC', padding: '6px 10px', borderRadius: 6, marginTop: 8, fontStyle: 'italic' }}>
                      "{event.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="mgt-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="mgt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="mgt-modal-header">
              <span className="mgt-modal-title">
                {actionModal.type === 'approve' ? 'Approve Request' : actionModal.type === 'reject' ? 'Reject Request' : 'Mark Delivered'}
              </span>
              <button className="mgt-modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              {actionModal.type === 'approve' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Modify Quantity (Optional)</label>
                  <input type="number" className="mgt-input" style={{ width: '100%' }} value={actionQuantity} onChange={e => setActionQuantity(e.target.value)} placeholder="Leave blank to keep original" />
                </div>
              )}
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Notes / Remarks</label>
                <textarea 
                  className="mgt-input" 
                  style={{ width: '100%', height: 80, resize: 'vertical' }} 
                  value={actionNotes} 
                  onChange={e => setActionNotes(e.target.value)} 
                  placeholder={actionModal.type === 'reject' ? 'Reason for rejection...' : 'Any comments...'}
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
