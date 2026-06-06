import { apiRequest } from './apiClient';
import { getStoredTokens, saveTokens } from './tokenStorage';

const ROLE_MAP = {
  CLIENT_HOD: 'client',
  FIELD_WORKER: 'worker',
  SUPER_ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  client_hod: 'client',
  field_worker: 'worker',
  super_admin: 'admin',
  supervisor: 'supervisor',
};

function decodeJwt(token) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getRoleName(role) {
  if (!role) return '';
  if (typeof role === 'string') return role;
  return role.name || role.slug || '';
}

export function normalizeUser(apiUser, fallback = {}) {
  if (!apiUser) return null;

  const roleName = getRoleName(apiUser.roles?.[0] || apiUser.role);
  const firstName = apiUser.firstName || apiUser.first_name || '';
  const lastName = apiUser.lastName || apiUser.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: apiUser.id || fallback.id,
    mobile: apiUser.mobile || fallback.mobile,
    email: apiUser.email || null,
    firstName,
    lastName,
    name: apiUser.name || fullName || apiUser.mobile || fallback.mobile || 'User',
    role: ROLE_MAP[roleName] || ROLE_MAP[String(roleName).toUpperCase()] || 'staff',
    rawRole: roleName,
    roles: apiUser.roles || [],
    addresses: apiUser.addresses || [],
    isActive: apiUser.is_active ?? apiUser.isActive ?? true,
  };
}

function extractTokens(data) {
  const source = data?.tokens || data?.token || data || {};
  return {
    access: source.access || source.access_token,
    refresh: source.refresh || source.refresh_token,
  };
}

function extractUser(data) {
  return data?.user || data?.profile || data?.account || null;
}

export async function obtainTokenPair(credentials) {
  const data = await apiRequest('/token/', {
    body: credentials,
    skipAuth: true,
  });
  const tokens = extractTokens(data);

  if (!tokens.access || !tokens.refresh) {
    throw new Error('The API did not return login tokens.');
  }

  saveTokens(tokens);
  return tokens;
}

export async function refreshTokenPair(refresh) {
  const data = await apiRequest('/token/refresh/', {
    body: { refresh },
    skipAuth: true,
  });
  const tokens = extractTokens(data);

  if (!tokens.access) {
    throw new Error('The API did not return a refreshed access token.');
  }

  saveTokens(tokens);
  return tokens;
}

export async function requestOtp(mobile) {
  return apiRequest('/accounts/users/otp/', {
    body: { mobile },
    skipAuth: true,
  });
}

export async function verifyOtp(mobile, otp) {
  const data = await apiRequest('/accounts/users/verify-otp/', {
    body: { mobile, otp },
    skipAuth: true,
  });
  const tokens = extractTokens(data);

  if (!tokens.access || !tokens.refresh) {
    throw new Error('OTP verified, but the API did not return login tokens.');
  }

  saveTokens(tokens);

  const tokenPayload = decodeJwt(tokens.access);
  const user = await resolveCurrentUser({
    fallbackMobile: mobile,
    tokenPayload,
    userFromResponse: extractUser(data),
  });

  return { tokens, user };
}

export async function resolveCurrentUser({ fallbackMobile, tokenPayload, userFromResponse } = {}) {
  if (userFromResponse) {
    return normalizeUser(userFromResponse, { mobile: fallbackMobile, id: tokenPayload?.user_id });
  }

  const userId = tokenPayload?.user_id || tokenPayload?.userId || tokenPayload?.sub;
  if (userId) {
    try {
      const user = await apiRequest(`/accounts/users/${userId}/`);
      return normalizeUser(user, { mobile: fallbackMobile, id: userId });
    } catch {
      // Fall through to search; some JWTs do not expose the public user id.
    }
  }

  if (fallbackMobile) {
    const list = await apiRequest('/accounts/users/', {
      query: { search: fallbackMobile, page_size: 10 },
    });
    const users = Array.isArray(list?.results) ? list.results : Array.isArray(list) ? list : [];
    const matched = users.find(user => user.mobile === fallbackMobile) || users[0];
    return normalizeUser(matched, { mobile: fallbackMobile, id: userId });
  }

  return null;
}

export async function restoreCurrentUser(savedUser) {
  const tokens = getStoredTokens();
  if (!tokens?.access && !tokens?.refresh) return null;

  const tokenPayload = decodeJwt(tokens.access);
  return resolveCurrentUser({
    fallbackMobile: savedUser?.mobile,
    tokenPayload,
    userFromResponse: null,
  });
}

export async function logoutFromApi() {
  const tokens = getStoredTokens();
  if (!tokens?.refresh) return;

  await apiRequest('/accounts/auth/logout/', {
    body: { refresh: tokens.refresh },
    retryOnUnauthorized: false,
  });
}

export async function logoutAllFromApi() {
  await apiRequest('/accounts/auth/logout-all/', {
    method: 'POST',
    retryOnUnauthorized: false,
  });
}
