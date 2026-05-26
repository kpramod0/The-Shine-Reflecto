import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  addNotification,
  COMPLAINT_STATUS,
  getComplaints,
  saveComplaints,
  SUPERVISOR_SCOPES
} from '../shared/ManagementPortal';
import '../shared/Dashboards.css';

function getSupervisorForWorker(mobile) {
  const entry = Object.entries(SUPERVISOR_SCOPES).find(([, scope]) =>
    scope.workers.some(worker => worker.phone === mobile)
  );
  if (!entry) {
    return { mobile: '9999999991', name: 'Supervisor One' };
  }
  return { mobile: entry[0], name: entry[1].name };
}

function statusClass(status) {
  if (status.includes('Rejected')) return 'rejected';
  if (status.includes('Admin Approved') || status === COMPLAINT_STATUS.CLOSED) return 'approved';
  if (status.includes('Supervisor Approved')) return 'forwarded';
  if (status.includes('Review')) return 'review';
  return 'submitted';
}

export default function WorkerComplaintsView() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState(() => getComplaints());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [attachmentName, setAttachmentName] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const workerComplaints = useMemo(() => {
    return complaints.filter(complaint => complaint.createdByMobile === user?.mobile);
  }, [complaints, user?.mobile]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please enter a complaint title and description.');
      return;
    }

    const supervisor = getSupervisorForWorker(user?.mobile);
    const now = new Date().toISOString();
    const nextComplaint = {
      id: 'CMP_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      priority,
      role: 'worker',
      status: COMPLAINT_STATUS.SUBMITTED,
      createdBy: user?.name || 'Worker',
      createdByMobile: user?.mobile,
      supervisorMobile: supervisor.mobile,
      supervisorName: supervisor.name,
      attachmentName,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          actor: user?.name || 'Worker',
          role: 'worker',
          action: 'Submitted complaint',
          timestamp: now,
          note: description.trim()
        }
      ]
    };

    const updated = [nextComplaint, ...complaints];
    saveComplaints(updated);
    setComplaints(updated);
    addNotification(supervisor.mobile, supervisor.name, `New complaint from ${nextComplaint.createdBy}: ${nextComplaint.title}`);
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setAttachmentName('');
    setExpandedId(nextComplaint.id);
    alert('Complaint submitted successfully.');
  };

  return (
    <div className="dash-page" id="worker-complaints-page">
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h1 className="dash-section-title">Complaints</h1>
            <p className="dash-section-subtitle">Submit a complaint and track the approval timeline.</p>
          </div>
        </div>

        <form className="dash-form-grid" onSubmit={handleSubmit}>
          <div>
            <label className="dash-field-label" htmlFor="worker-complaint-title">Title</label>
            <input
              id="worker-complaint-title"
              className="dash-field"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Short complaint title"
            />
          </div>
          <div>
            <label className="dash-field-label" htmlFor="worker-complaint-description">Description</label>
            <textarea
              id="worker-complaint-description"
              className="dash-textarea"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Describe what happened and where support is needed"
            />
          </div>
          <div className="dash-form-row">
            <div>
              <label className="dash-field-label" htmlFor="worker-complaint-priority">Priority</label>
              <select
                id="worker-complaint-priority"
                className="dash-field"
                value={priority}
                onChange={event => setPriority(event.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="dash-field-label" htmlFor="worker-complaint-image">Image Upload</label>
              <input
                id="worker-complaint-image"
                className="dash-field"
                type="file"
                accept="image/*"
                onChange={event => setAttachmentName(event.target.files?.[0]?.name || '')}
              />
            </div>
          </div>
          <button type="submit" className="dash-btn primary">
            <Send size={16} />
            Submit Complaint
          </button>
        </form>
      </section>

      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2 className="dash-section-title">My Complaints</h2>
            <p className="dash-section-subtitle">Status moves from Submitted to Supervisor Approved to Admin Approved or Closed.</p>
          </div>
        </div>

        <div className="dash-complaint-list">
          {workerComplaints.map(complaint => (
            <article className="dash-complaint-card" key={complaint.id}>
              <div className="dash-complaint-head">
                <div>
                  <h3 className="dash-complaint-title">{complaint.title}</h3>
                  <p className="dash-complaint-meta">
                    {complaint.priority} priority | {new Date(complaint.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`dash-status-pill ${statusClass(complaint.status)}`}>{complaint.status}</span>
              </div>
              <p className="dash-complaint-meta">{complaint.description}</p>
              {complaint.attachmentName && (
                <p className="dash-complaint-meta">Attachment: {complaint.attachmentName}</p>
              )}
              <button
                type="button"
                className="dash-btn"
                style={{ marginTop: 14 }}
                onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
              >
                {expandedId === complaint.id ? 'Hide Timeline' : 'View Timeline'}
              </button>
              {expandedId === complaint.id && (
                <div className="dash-timeline">
                  {complaint.timeline.map((event, index) => (
                    <div className="dash-timeline-item" key={`${complaint.id}-${index}`}>
                      <strong>{event.action}</strong> by {event.actor} ({event.role})
                      <div>{new Date(event.timestamp).toLocaleString()}</div>
                      {event.note && <div>{event.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
          {workerComplaints.length === 0 && (
            <p className="dash-empty">No complaints submitted yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
