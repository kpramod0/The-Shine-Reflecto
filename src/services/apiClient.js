import { clearAuthStorage, getStoredTokens, saveTokens } from './tokenStorage';

const DEFAULT_API_BASE_URL = 'https://tsr-api-production-a091.up.railway.app/api';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path, query) {
  const cleanPath = String(path || '')
    .replace(/^https?:\/\/[^/]+\/api\/?/, '')
    .replace(/^\/?api\/?/, '')
    .replace(/^\/+/, '');
  const url = new URL(`${API_BASE_URL}/${cleanPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function stringifyErrorValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(stringifyErrorValue).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nestedValue]) => {
        const message = stringifyErrorValue(nestedValue);
        return message ? `${key}: ${message}` : '';
      })
      .filter(Boolean)
      .join('; ');
  }

  return String(value);
}

function getErrorMessage(data, fallback) {
  const message = stringifyErrorValue(data?.detail || data?.message || data?.error || data);
  return message || fallback;
}

async function refreshAccessToken() {
  const tokens = getStoredTokens();
  if (!tokens?.refresh) return null;

  const refreshPaths = ['/accounts/auth/token/refresh/', '/token/refresh/'];
  let data = null;
  let refreshed = false;

  for (const path of refreshPaths) {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    data = await parseResponse(response);

    if (response.ok) {
      refreshed = true;
      break;
    }
  }

  if (!refreshed) {
    clearAuthStorage();
    return null;
  }

  const nextTokens = {
    access: data?.access,
    refresh: data?.refresh || tokens.refresh,
  };
  saveTokens(nextTokens);
  return nextTokens.access;
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    headers,
    method = body ? 'POST' : 'GET',
    query,
    retryOnUnauthorized = true,
    skipAuth = false,
  } = options;

  const tokens = getStoredTokens();
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  if (!skipAuth && tokens?.access) {
    requestHeaders.Authorization = `Bearer ${tokens.access}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: payload,
  });
  const data = await parseResponse(response);

  if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
    const access = await refreshAccessToken();
    if (access) {
      return apiRequest(path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `Request failed with status ${response.status}`),
      { status: response.status, data },
    );
  }

  return data;
}

export async function getApiSchema() {
  return apiRequest('/schema/', { skipAuth: true });
}
