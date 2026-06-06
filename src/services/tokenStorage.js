const TOKEN_STORAGE_KEY = 'tsr_auth_tokens';
const USER_STORAGE_KEY = 'tsr_user';

export function getStoredTokens() {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens) {
  if (!tokens?.access && !tokens?.refresh) return;
  const current = getStoredTokens() || {};
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ ...current, ...tokens }));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user) {
  if (!user) return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthStorage() {
  clearTokens();
  localStorage.removeItem(USER_STORAGE_KEY);
}
