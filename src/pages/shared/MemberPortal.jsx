import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './MemberPortal.css';

/* ── Mock Data Engine ────────────────────────────────────────── */

const MOCK_CLIENTS = [
  { id: 'C1', name: 'TechCorp Industries', category: 'Information Technology Services', address: '123 Tech Street, Silicon Valley', mapsUrl: 'https://maps.google.com/?q=123+Tech+Street', status: 'Active Contract', active: true, assignedSupervisorId: '9999999991', contactEmail: 'contact@techcorp.com', contactPhone: '+1 (555) 123-4567', contractStart: 'Jan 2023', serviceType: 'IT Support', teamSize: '28 Employees', hodName: 'Robert Johnson', hodRole: 'IT Director', hodEmail: 'robert.johnson@techcorp.com', photo: 'TC' },
  { id: 'C2', name: 'BlueStone Facilities', category: 'Facilities Management', address: '77 Harbor Road, Seattle WA', mapsUrl: 'https://maps.google.com/?q=77+Harbor+Road', status: 'Active Contract', active: true, assignedSupervisorId: '9999999991', contactEmail: 'ops@bluestone.com', contactPhone: '+1 (555) 987-6543', contractStart: 'Mar 2024', serviceType: 'Maintenance', teamSize: '15 Employees', hodName: 'Sarah Smith', hodRole: 'Operations Head', hodEmail: 'sarah@bluestone.com', photo: 'BS' },
  { id: 'C3', name: 'GreenField Logistics', category: 'Logistics & Supply Chain', address: '410 Meadow Ave, Denver CO', mapsUrl: 'https://maps.google.com/?q=410+Meadow+Ave', status: 'Inactive', active: false, assignedSupervisorId: '9999999999', contactEmail: 'info@greenfield.com', contactPhone: '+1 (555) 111-2222', contractStart: 'Feb 2022', serviceType: 'Security', teamSize: '5 Employees', hodName: 'Mike Davis', hodRole: 'Facility Manager', hodEmail: 'mike@greenfield.com', photo: 'GF' },
  { id: 'C4', name: 'Acme Corp', category: 'Manufacturing', address: '901 Industrial Blvd, Austin TX', mapsUrl: 'https://maps.google.com/?q=901+Industrial+Blvd', status: 'Active Contract', active: true, assignedSupervisorId: '9999999991', contactEmail: 'admin@acme.com', contactPhone: '+1 (555) 333-4444', contractStart: 'Aug 2023', serviceType: 'Housekeeping', teamSize: '12 Employees', hodName: 'Jane Doe', hodRole: 'Plant Manager', hodEmail: 'jane@acme.com', photo: 'AC' },
];

const MOCK_USERS = [
  { id: 'U1', name: 'Aarav Sharma', employeeId: 'EMP001', mobile: '9876543210', role: 'Worker', aadhar: '1234 5678 9012', pan: 'ABCDE1234F', client: 'Acme Corp', city: 'Delhi', status: 'Active', active: true, assignedSupervisorId: '9999999991' },
  { id: 'U2', name: 'Neha Verma', employeeId: 'EMP002', mobile: '9999999992', role: 'Client', aadhar: '4321 8765 2109', pan: 'PQRSX4321K', client: 'Acme Corp', city: 'Mumbai', status: 'Active', active: true, assignedSupervisorId: '9999999991' },
  { id: 'U3', name: 'Rohan Singh', employeeId: 'EMP003', mobile: '9999999991', role: 'Supervisor', aadhar: '1111 2222 3333', pan: 'ROHNS9999L', client: 'Nexus', city: 'Chennai', status: 'Inactive', active: false, assignedSupervisorId: null },
  { id: 'U4', name: 'Priya Patel', employeeId: 'EMP004', mobile: '9999999993', role: 'Worker', aadhar: '2222 3333 4444', pan: 'PRIYA1234Z', client: 'Apex', city: 'Bangalore', status: 'Active', active: true, assignedSupervisorId: '9999999991' },
  { id: 'U5', name: 'Vikram Rao', employeeId: 'EMP005', mobile: '8830227359', role: 'Admin', aadhar: '5555 6666 7777', pan: 'VIKRM5555A', client: '-', city: 'Pune', status: 'Active', active: true, assignedSupervisorId: null },
];

/* ── Components ──────────────────────────────────────────────── */

function GoogleMapLink({ address, url }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mp-link" title="Open in Google Maps">
      {address}
    </a>
  );
}

export default function MemberPortal() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('hub'); // 'hub', 'users', 'clients'
  
  // -- View routing
  const navigateTo = (view) => setCurrentView(view);

  return (
    <div className="mp-page" id="member-portal-page">
      {currentView === 'hub' && <HubView onNavigate={navigateTo} user={user} />}
      {currentView === 'users' && <UsersView onBack={() => navigateTo('hub')} user={user} />}
      {currentView === 'clients' && <ClientsView onBack={() => navigateTo('hub')} user={user} />}
    </div>
  );
}

/* ── Hub View ────────────────────────────────────────────────── */

function HubView({ onNavigate, user }) {
  const role = user?.role;
  const isWorkerOrClient = role === 'worker' || role === 'client';

  return (
    <>
      <div className="mp-header">
        <div>
          <h1 className="mp-title">Member Portal</h1>
          <p className="mp-subtitle">Quick access to directory and management</p>
        </div>
      </div>

      <div className="mp-hub-grid">
        <div className="mp-hub-card" onClick={() => onNavigate('users')} id="hub-users-card">
          <div className="mp-hub-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>👤</div>
          <div className="mp-hub-info">
            <h3 className="mp-hub-name">Users</h3>
            <p className="mp-hub-desc">Manage system users and details</p>
          </div>
          <svg className="mp-hub-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>

        {!isWorkerOrClient && (
          <div className="mp-hub-card" onClick={() => onNavigate('clients')} id="hub-clients-card">
            <div className="mp-hub-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>🤝</div>
            <div className="mp-hub-info">
              <h3 className="mp-hub-name">Clients</h3>
              <p className="mp-hub-desc">View and manage client records</p>
            </div>
            <svg className="mp-hub-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        )}

        {role === 'admin' && (
          <div className="mp-hub-card">
            <div className="mp-hub-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>🛠️</div>
            <div className="mp-hub-info">
              <h3 className="mp-hub-name">Supervisor Workers</h3>
              <p className="mp-hub-desc">Assign and track supervisor tasks</p>
            </div>
            <svg className="mp-hub-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Users View ──────────────────────────────────────────────── */

function UsersView({ onBack, user }) {
  const role = user?.role;
  const isAdmin = role === 'admin';

  // 1. Data Isolation
  let accessibleUsers = MOCK_USERS;
  if (role === 'supervisor') {
    accessibleUsers = MOCK_USERS.filter(u => u.assignedSupervisorId === user.mobile || u.mobile === user.mobile);
  } else if (role === 'client' || role === 'worker') {
    const me = MOCK_USERS.find(u => u.mobile === user.mobile);
    const mySupervisorId = me?.assignedSupervisorId;
    accessibleUsers = MOCK_USERS.filter(u => u.mobile === user.mobile || u.mobile === mySupervisorId);
  }

  // 2. Filters
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('All clients');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [cityFilter, setCityFilter] = useState('All cities');
  const [statusFilter, setStatusFilter] = useState('All');

  const uniqueClients = [...new Set(accessibleUsers.map(u => u.client).filter(c => c && c !== '-'))];
  
  const filteredUsers = accessibleUsers.filter(u => {
    const matchSearch = search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.employeeId.toLowerCase().includes(search.toLowerCase()) || u.mobile.includes(search);
    const matchClient = clientFilter === 'All clients' || u.client === clientFilter;
    const matchRole = roleFilter === 'All roles' || u.role === roleFilter;
    const matchCity = cityFilter === 'All cities' || u.city === cityFilter;
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchSearch && matchClient && matchRole && matchCity && matchStatus;
  });

  const clearFilters = () => {
    setSearch(''); setClientFilter('All clients'); setRoleFilter('All roles'); setCityFilter('All cities'); setStatusFilter('All');
  };

  const exportCSV = () => {
    const headers = ['Name', 'Employee ID', 'Mobile', 'Role', 'Aadhar', 'PAN', 'Client', 'City', 'Status'];
    const rows = filteredUsers.map(u => [u.name, u.employeeId, u.mobile, u.role, u.aadhar, u.pan, u.client, u.city, u.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="mp-header">
        <div>
          <h1 className="mp-title">
            <span style={{cursor:'pointer', color:'#64748B'}} onClick={onBack}>Member Portal &rsaquo; </span> 
            Users
          </h1>
          <p className="mp-subtitle">All workers, client HODs, supervisors, and admins</p>
        </div>
        {isAdmin && <button className="mp-btn mp-btn-primary">+ Add User</button>}
      </div>

      <div className="mp-filter-card">
        <div className="mp-filter-row">
          <div className="mp-filter-group search">
            <span className="mp-filter-label">Search</span>
            <input type="text" className="mp-input" placeholder="Search by name, ID, mobile..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="mp-filter-group">
            <span className="mp-filter-label">Client</span>
            <select className="mp-select" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
              <option value="All clients">All clients</option>
              {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="mp-filter-group">
            <span className="mp-filter-label">Role</span>
            <select className="mp-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All roles">All roles</option>
              <option value="Worker">Worker</option>
              <option value="Client">Client</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="mp-filter-group">
            <span className="mp-filter-label">City</span>
            <select className="mp-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
              <option value="All cities">All cities</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>
          <div className="mp-filter-group">
            <span className="mp-filter-label">Status</span>
            <select className="mp-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="mp-filter-actions" style={{paddingBottom: '2px'}}>
            <button className="mp-btn" onClick={clearFilters}>Clear filters</button>
            <button className="mp-btn" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="mp-table-card">
        <table className="mp-table">
          <thead>
            <tr>
              <th>User</th><th>Employee ID</th><th>Mobile</th><th>Role</th><th>Aadhar</th><th>PAN</th><th>Client</th><th>City</th><th>Status</th>
              {isAdmin && <th>Active</th>}
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td style={{fontWeight:800, color:'#0B0E17'}}>{u.name}</td>
                <td>{u.employeeId}</td>
                <td>{u.mobile}</td>
                <td>{u.role}</td>
                <td>{u.aadhar}</td>
                <td>{u.pan}</td>
                <td>{u.client}</td>
                <td>
                  {isAdmin ? <span className="mp-link" title="Edit City">{u.city} ✎</span> : u.city}
                </td>
                <td>
                  <span className={`mp-status-pill ${u.active ? 'active' : 'inactive'}`}>
                    <span className="mp-status-dot"></span> {u.status}
                  </span>
                </td>
                {isAdmin && (
                  <td>
                    <div className={`mp-toggle ${u.active ? 'on' : ''}`}></div>
                  </td>
                )}
                {isAdmin && (
                  <td>
                    <button className="mp-action-btn">✎</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mp-mobile-list">
        {filteredUsers.map(u => <MobileUserCard key={u.id} user={u} />)}
      </div>
    </>
  );
}

function MobileUserCard({ user }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mp-mobile-card">
      <div className="mp-mc-header" onClick={() => setOpen(!open)}>
        <div className="mp-mc-left">
          <div>
            <h4 className="mp-mc-title">{user.name}</h4>
            <p className="mp-mc-sub">{user.role} • {user.employeeId}</p>
          </div>
        </div>
        <div className="mp-mc-right">
          <div className={`mp-mc-dot ${user.active ? 'active' : 'inactive'}`}></div>
          <svg className={`mp-mc-chevron ${open ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      {open && (
        <div className="mp-mc-body">
          <div className="mp-mc-row"><span className="mp-mc-label">Mobile</span><span className="mp-mc-value">{user.mobile}</span></div>
          <div className="mp-mc-row"><span className="mp-mc-label">Aadhar</span><span className="mp-mc-value">{user.aadhar}</span></div>
          <div className="mp-mc-row"><span className="mp-mc-label">PAN</span><span className="mp-mc-value">{user.pan}</span></div>
          <div className="mp-mc-row"><span className="mp-mc-label">Client</span><span className="mp-mc-value">{user.client}</span></div>
          <div className="mp-mc-row"><span className="mp-mc-label">City</span><span className="mp-mc-value">{user.city}</span></div>
        </div>
      )}
    </div>
  );
}

/* ── Clients View ────────────────────────────────────────────── */

function ClientsView({ onBack, user }) {
  const role = user?.role;
  const isAdmin = role === 'admin';

  // Strict check
  if (role !== 'admin' && role !== 'supervisor') {
    return <div style={{padding:20}}>Unauthorized Access.</div>;
  }

  let accessibleClients = MOCK_CLIENTS;
  if (role === 'supervisor') {
    accessibleClients = MOCK_CLIENTS.filter(c => c.assignedSupervisorId === user.mobile);
  }

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All cities');

  const filteredClients = accessibleClients.filter(c => {
    const term = search.toLowerCase();
    const matchSearch = term === '' || 
      c.name.toLowerCase().includes(term) || 
      c.category.toLowerCase().includes(term) || 
      c.address.toLowerCase().includes(term) ||
      c.contactEmail.toLowerCase().includes(term) ||
      c.contactPhone.toLowerCase().includes(term);
    const matchCity = cityFilter === 'All cities' || c.address.includes(cityFilter); // Simplistic city check for mock
    return matchSearch && matchCity;
  });

  const clearFilters = () => {
    setSearch(''); setCityFilter('All cities');
  };

  const [expandedRowId, setExpandedRowId] = useState(null);
  const toggleRow = (id) => setExpandedRowId(prev => prev === id ? null : id);

  return (
    <>
      <div className="mp-header">
        <div>
          <h1 className="mp-title">
            <span style={{cursor:'pointer', color:'#64748B'}} onClick={onBack}>Member Portal &rsaquo; </span> 
            Clients
          </h1>
          <p className="mp-subtitle">View client records, contact information, service details and HOD</p>
        </div>
        {isAdmin && <button className="mp-btn mp-btn-primary">+ Add Client</button>}
      </div>

      <div className="mp-filter-card">
        <div className="mp-filter-row">
          <div className="mp-filter-group search">
            <span className="mp-filter-label">Search</span>
            <input type="text" className="mp-input" placeholder="Search by name, category, email, phone, address..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="mp-filter-group">
            <span className="mp-filter-label">City</span>
            <select className="mp-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
              <option value="All cities">All cities</option>
              <option value="Silicon Valley">Silicon Valley</option>
              <option value="Seattle">Seattle</option>
              <option value="Denver">Denver</option>
              <option value="Austin">Austin</option>
            </select>
          </div>
          <div className="mp-filter-actions" style={{paddingBottom: '2px'}}>
            <button className="mp-btn" onClick={clearFilters}>Clear filters</button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="mp-table-card">
        <table className="mp-table">
          <thead>
            <tr>
              <th>Photo</th><th>Client</th><th>Category</th><th>Address</th><th>Status</th>
              {isAdmin && <th>Active</th>}
              {isAdmin && <th>Action</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(c => (
              <React.Fragment key={c.id}>
                <tr>
                  <td><div className="mp-photo-box">{c.photo}</div></td>
                  <td style={{fontWeight:800, color:'#0B0E17'}}>{c.name}</td>
                  <td>{c.category}</td>
                  <td><GoogleMapLink address={c.address} url={c.mapsUrl} /></td>
                  <td>
                    <span className={`mp-status-pill ${c.active ? 'active' : 'inactive'}`}>
                      <span className="mp-status-dot"></span> {c.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td><div className={`mp-toggle ${c.active ? 'on' : ''}`}></div></td>
                  )}
                  {isAdmin && (
                    <td><button className="mp-action-btn">✎</button></td>
                  )}
                  <td>
                    <button className="mp-action-btn" onClick={() => toggleRow(c.id)}>
                      {expandedRowId === c.id ? '▴' : '▾'}
                    </button>
                  </td>
                </tr>
                {expandedRowId === c.id && (
                  <tr className="mp-expanded-row">
                    <td colSpan={isAdmin ? 8 : 6}>
                      <div className="mp-expanded-content">
                        <div>
                          <h4 className="mp-expand-col-title">Contact Information</h4>
                          <div className="mp-expand-item">
                            <span className="mp-expand-icon">✉</span>
                            <a href={`mailto:${c.contactEmail}`} className="mp-link">{c.contactEmail}</a>
                          </div>
                          <div className="mp-expand-item">
                            <span className="mp-expand-icon">📞</span>
                            <a href={`tel:${c.contactPhone}`} className="mp-link">{c.contactPhone}</a>
                          </div>
                          <div className="mp-expand-item">
                            <span className="mp-expand-icon">📍</span>
                            <GoogleMapLink address={c.address} url={c.mapsUrl} />
                          </div>
                        </div>
                        <div>
                          <h4 className="mp-expand-col-title">Service Details</h4>
                          <div className="mp-expand-item"><strong>Contract Start:</strong> <span style={{marginLeft:'auto'}}>{c.contractStart}</span></div>
                          <div className="mp-expand-item"><strong>Service Type:</strong> <span style={{marginLeft:'auto'}}>{c.serviceType}</span></div>
                          <div className="mp-expand-item"><strong>Team Size:</strong> <span style={{marginLeft:'auto'}}>{c.teamSize}</span></div>
                        </div>
                        <div>
                          <h4 className="mp-expand-col-title">Client HOD</h4>
                          <div className="mp-hod-card">
                            <div className="mp-hod-avatar">{c.photo}</div>
                            <div>
                              <div className="mp-hod-name">{c.hodName}</div>
                              <div className="mp-hod-role">{c.hodRole}</div>
                              <a href={`mailto:${c.hodEmail}`} className="mp-link">{c.hodEmail}</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mp-mobile-list">
        {filteredClients.map(c => <MobileClientCard key={c.id} client={c} />)}
      </div>
    </>
  );
}

function MobileClientCard({ client }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mp-mobile-card">
      <div className="mp-mc-header" onClick={() => setOpen(!open)}>
        <div className="mp-mc-left">
          <div className="mp-photo-box">{client.photo}</div>
          <div>
            <h4 className="mp-mc-title">{client.name}</h4>
            <GoogleMapLink address={client.address} url={client.mapsUrl} />
          </div>
        </div>
        <div className="mp-mc-right">
          <div className={`mp-mc-dot ${client.active ? 'active' : 'inactive'}`}></div>
          <svg className={`mp-mc-chevron ${open ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      {open && (
        <div className="mp-mc-body">
          <h4 className="mp-expand-col-title">Contact Information</h4>
          <div className="mp-mc-row"><span className="mp-mc-label">Email</span><a href={`mailto:${client.contactEmail}`} className="mp-link">{client.contactEmail}</a></div>
          <div className="mp-mc-row"><span className="mp-mc-label">Phone</span><a href={`tel:${client.contactPhone}`} className="mp-link">{client.contactPhone}</a></div>
          
          <h4 className="mp-expand-col-title" style={{marginTop:12}}>Service Details</h4>
          <div className="mp-mc-row"><span className="mp-mc-label">Contract Start</span><span className="mp-mc-value">{client.contractStart}</span></div>
          <div className="mp-mc-row"><span className="mp-mc-label">Service Type</span><span className="mp-mc-value">{client.serviceType}</span></div>
          <div className="mp-mc-row"><span className="mp-mc-label">Team Size</span><span className="mp-mc-value">{client.teamSize}</span></div>
          
          <h4 className="mp-expand-col-title" style={{marginTop:12}}>Client HOD</h4>
          <div className="mp-mc-row"><span className="mp-mc-label">{client.hodName}</span><span className="mp-mc-value">{client.hodRole}</span></div>
        </div>
      )}
    </div>
  );
}
