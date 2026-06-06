import { apiRequest } from './apiClient';
import { normalizeUser } from './authApi';

const ROLE_LABELS = {
  admin: 'Admin',
  client: 'Client',
  staff: 'Staff',
  supervisor: 'Supervisor',
  worker: 'Worker',
};

const API_ROLE_BY_LABEL = {
  Admin: 'SUPER_ADMIN',
  Client: 'CLIENT_HOD',
  Supervisor: 'SUPERVISOR',
  Worker: 'FIELD_WORKER',
};

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatAddress(addresses = []) {
  const address = addresses[0];
  if (!address) return '-';

  return [
    address.building_details,
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean).join(', ') || '-';
}

function getCity(addresses = []) {
  return addresses[0]?.city || '-';
}

function initials(name = '') {
  const chars = name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('');
  return (chars || 'U').slice(0, 2).toUpperCase();
}

export function toDirectoryUser(apiUser) {
  const user = normalizeUser(apiUser);
  const role = ROLE_LABELS[user.role] || 'Staff';

  return {
    id: user.id,
    apiId: user.id,
    name: user.name,
    employeeId: user.id ? user.id.slice(0, 8).toUpperCase() : user.mobile,
    mobile: user.mobile || '-',
    role,
    rawRole: user.rawRole,
    aadhar: '-',
    pan: '-',
    client: '-',
    city: getCity(user.addresses),
    status: user.isActive ? 'Active' : 'Inactive',
    active: user.isActive,
    assignedSupervisorId: null,
    email: user.email,
    addresses: user.addresses,
    apiUser,
  };
}

export function toDirectoryClient(apiUser) {
  const user = normalizeUser(apiUser);
  const address = formatAddress(user.addresses);
  const mapsUrl = user.addresses?.[0]?.google_maps_link
    || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return {
    id: user.id,
    apiId: user.id,
    name: user.name,
    category: 'Client HOD',
    address,
    mapsUrl,
    status: user.isActive ? 'Active Contract' : 'Inactive',
    active: user.isActive,
    assignedSupervisorId: null,
    contactEmail: user.email || '-',
    contactPhone: user.mobile || '-',
    contractStart: '-',
    serviceType: '-',
    teamSize: '-',
    hodName: user.name,
    hodRole: 'Client HOD',
    hodEmail: user.email || '-',
    photo: initials(user.name),
    apiUser,
  };
}

export async function listUsers(query = {}) {
  const data = await apiRequest('/accounts/users/', {
    query: { page_size: 500, ...query },
  });
  return unwrapList(data);
}

export async function getUser(id) {
  return apiRequest(`/accounts/users/${id}/`);
}

export async function listDirectoryUsers(query = {}) {
  const users = await listUsers(query);
  return users.map(toDirectoryUser);
}

export async function listUsersByRole(roleLabel) {
  return listUsers({ roles__name: API_ROLE_BY_LABEL[roleLabel] || roleLabel });
}

export async function createUser(payload) {
  return apiRequest('/accounts/users/', { body: payload });
}

export async function replaceUser(id, payload) {
  return apiRequest(`/accounts/users/${id}/`, {
    method: 'PUT',
    body: payload,
  });
}

export async function updateUser(id, payload) {
  return apiRequest(`/accounts/users/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteUser(id) {
  return apiRequest(`/accounts/users/${id}/`, { method: 'DELETE' });
}
