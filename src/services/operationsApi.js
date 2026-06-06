import { API_BASE_URL, apiRequest } from './apiClient';
import { getStoredTokens } from './tokenStorage';
import { listUsers, toDirectoryClient, toDirectoryUser } from './usersApi';

const SHIFT_FROM_API = {
  1: 'Day',
  2: 'Night',
};

const SHIFT_TO_API = {
  day: 1,
  night: 2,
};

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
}

function durationToHours(duration) {
  if (!duration || typeof duration !== 'string') return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length < 2 || parts.some(Number.isNaN)) return 0;
  const [hours, minutes, seconds = 0] = parts;
  return Number((hours + minutes / 60 + seconds / 3600).toFixed(2));
}

function userName(user) {
  if (!user) return '';
  return user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile || '';
}

function findUser(users, id) {
  return users.find(user => user.id === id || user.apiId === id || user.mobile === id);
}

function findByName(items, name) {
  return items.find(item => item.name === name || item.mobile === name || item.id === name || item.apiId === name);
}

export function shiftFromApi(value) {
  if (typeof value === 'number') return SHIFT_FROM_API[value] || String(value);
  if (/^\d+$/.test(String(value))) return SHIFT_FROM_API[Number(value)] || String(value);
  const normalized = String(value || '').toLowerCase();
  return normalized === 'night' ? 'Night' : 'Day';
}

export function shiftToApi(value) {
  const normalized = String(value || '').toLowerCase();
  return SHIFT_TO_API[normalized] || Number(value) || 1;
}

export function toUiRoster(apiRoster, apiUsers = []) {
  const users = apiUsers.map(user => user.mobile ? user : toDirectoryUser(user));
  const clients = apiUsers.map(toDirectoryClient);
  const worker = findUser(users, apiRoster.worker);
  const client = findUser(clients, apiRoster.client) || findUser(users, apiRoster.client);
  const shift = shiftFromApi(apiRoster.shift);
  const workerLabel = apiRoster.worker_name || userName(worker) || apiRoster.worker || 'Worker';
  const clientLabel = userName(client) || apiRoster.client || 'Client';

  return {
    id: apiRoster.id,
    apiId: apiRoster.id,
    clientId: apiRoster.client,
    workerId: apiRoster.worker,
    rosterDate: apiRoster.date,
    shift,
    name: `${shift} Shift`,
    createdAt: apiRoster.created_at || new Date().toISOString(),
    createdBy: 'API',
    clients: [clientLabel],
    supervisor: 'API Supervisor',
    workers: [{
      id: apiRoster.worker,
      apiId: apiRoster.worker,
      name: workerLabel,
      phone: worker?.mobile || '',
    }],
    apiRoster,
  };
}

export function toUiAttendance(apiAttendance, rosters = []) {
  const roster = rosters.find(item => String(item.apiId || item.id) === String(apiAttendance.roster));
  const entryDate = apiAttendance.entry_timestamp ? formatDate(apiAttendance.entry_timestamp) : '';
  const hasExit = Boolean(apiAttendance.exit_timestamp);

  return {
    id: apiAttendance.id,
    apiId: apiAttendance.id,
    rosterId: apiAttendance.roster,
    date: entryDate,
    workerName: apiAttendance.worker_name || roster?.workers?.[0]?.name || 'Worker',
    workerMobile: roster?.workers?.[0]?.phone || '',
    supervisorMobile: '',
    client: roster?.clients?.[0] || '',
    shift: roster?.shift || '',
    status: hasExit ? 'Present' : 'Pending Approval',
    checkIn: formatTime(apiAttendance.entry_timestamp),
    checkOut: formatTime(apiAttendance.exit_timestamp),
    totalHours: durationToHours(apiAttendance.duration),
    notes: 'Synced from API',
    apiAttendance,
  };
}

export async function listRosters(apiUsers = []) {
  const data = await apiRequest('/rosters/');
  return unwrapList(data).map(roster => toUiRoster(roster, apiUsers));
}

export async function getRoster(id, apiUsers = []) {
  const roster = await apiRequest(`/rosters/${id}/`);
  return toUiRoster(roster, apiUsers);
}

export async function loadRosterSnapshot() {
  const users = await listUsers();
  const rosters = await listRosters(users);
  return { users, rosters };
}

export async function createRosterFromUi(uiRoster, directory = {}) {
  const clients = directory.clients || [];
  const client = findByName(clients, uiRoster.clients?.[0]) || { id: uiRoster.clientId };
  const clientId = client?.apiId || client?.id || uiRoster.clientId;

  if (!clientId) {
    throw new Error('Cannot create roster: selected client is missing an API id.');
  }

  const workers = uiRoster.workers || [];
  const created = [];

  for (const worker of workers) {
    const workerId = worker.apiId || worker.id;
    if (!workerId) {
      throw new Error(`Cannot create roster: ${worker.name} is missing an API id.`);
    }

    const payload = {
      client: clientId,
      worker: workerId,
      shift: shiftToApi(uiRoster.shift),
      date: uiRoster.rosterDate,
    };

    created.push(await apiRequest('/rosters/', { body: payload }));
  }

  return created;
}

export async function updateRosterFromUi(id, uiRoster, directory = {}) {
  const clients = directory.clients || [];
  const client = findByName(clients, uiRoster.clients?.[0]) || { id: uiRoster.clientId };
  const worker = uiRoster.workers?.[0] || {};

  return apiRequest(`/rosters/${id}/`, {
    method: 'PATCH',
    body: {
      client: client?.apiId || client?.id || uiRoster.clientId,
      worker: worker.apiId || worker.id || uiRoster.workerId,
      shift: shiftToApi(uiRoster.shift),
      date: uiRoster.rosterDate,
    },
  });
}

export async function replaceRoster(id, payload) {
  return apiRequest(`/rosters/${id}/`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteRoster(id) {
  return apiRequest(`/rosters/${id}/`, { method: 'DELETE' });
}

export async function listAttendance(rosters = []) {
  const data = await apiRequest('/rosters/attendance/');
  return unwrapList(data).map(record => toUiAttendance(record, rosters));
}

export async function getAttendance(id, rosters = []) {
  const record = await apiRequest(`/rosters/attendance/${id}/`);
  return toUiAttendance(record, rosters);
}

export async function createAttendance(payload) {
  return apiRequest('/rosters/attendance/', { body: payload });
}

export async function replaceAttendance(id, payload) {
  return apiRequest(`/rosters/attendance/${id}/`, {
    method: 'PUT',
    body: payload,
  });
}

export async function loadAttendanceSnapshot() {
  const snapshot = await loadRosterSnapshot();
  const attendance = await listAttendance(snapshot.rosters);
  return { ...snapshot, attendance };
}

export async function updateAttendance(id, payload) {
  return apiRequest(`/rosters/attendance/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteAttendance(id) {
  return apiRequest(`/rosters/attendance/${id}/`, { method: 'DELETE' });
}

export async function scanAttendance(clientId) {
  return apiRequest(`/rosters/attendance/scan/${clientId}/`, {
    method: 'POST',
  });
}

export async function downloadAttendancePdf() {
  const tokens = getStoredTokens();
  const response = await fetch(`${API_BASE_URL}/rosters/attendance/export-pdf/`, {
    headers: {
      ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Attendance PDF export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'attendance_export.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
