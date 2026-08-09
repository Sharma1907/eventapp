/**
 * Auto-refreshing fetch wrapper.
 * On 401 → refreshes JWT → retries original request once.
 * Updates stored tokens in-memory + localStorage.
 */
import { API_URL, API_HEADERS } from './theme';

let _tokens = null;
let _onTokensUpdated = null;
let _refreshPromise = null;

export function setTokens(tokens, onUpdated) {
  _tokens = tokens;
  if (onUpdated) _onTokensUpdated = onUpdated;
}

export function getTokens() {
  return _tokens;
}

export function authHeaders() {
  if (!_tokens?.access) return API_HEADERS;
  return { ...API_HEADERS, Authorization: `Bearer ${_tokens.access}` };
}

async function _refreshTokens() {
  if (!_tokens?.refresh) return false;
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ refresh: _tokens.refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.access) {
        _tokens = { ..._tokens, access: data.access };
        if (data.refresh) _tokens.refresh = data.refresh;
        if (_onTokensUpdated) _onTokensUpdated(_tokens);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/**
 * Drop-in fetch replacement with auto token refresh.
 * Usage: apiFetch('/notifications/my/')
 *        apiFetch('/auth/update-profile/', { method: 'POST', body: JSON.stringify({...}) })
 *        apiFetch('/photos/upload/', { method: 'POST', body: formData }) // FormData auto-handled
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  // Build headers: auth + user-provided, but skip Content-Type for FormData
  const isFormData = options.body instanceof FormData;
  const baseHeaders = _tokens?.access
    ? { Authorization: `Bearer ${_tokens.access}` }
    : {};

  // Only add Content-Type: application/json if NOT FormData and not already set
  if (!isFormData && !options.headers?.['Content-Type']) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  // Add ngrok header
  baseHeaders['ngrok-skip-browser-warning'] = 'true';

  const headers = { ...baseHeaders, ...(options.headers || {}) };

  // Remove Content-Type if FormData (let browser set boundary)
  if (isFormData) {
    delete headers['Content-Type'];
  }

  let res = await fetch(url, { ...options, headers });

  // If 401 and we have a refresh token, try refreshing
  if (res.status === 401 && _tokens?.refresh) {
    const refreshed = await _refreshTokens();
    if (refreshed) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${_tokens.access}` };
      if (isFormData) delete retryHeaders['Content-Type'];
      res = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return res;
}
