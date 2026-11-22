const API_BASE = import.meta.env.VITE_API_BASE || '';

export class ApiError extends Error {
  constructor(message, status) { super(message); this.name = 'ApiError'; this.status = status; }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('ak_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || 'Unexpected server response.' }; }

  if (!response.ok) {
    // Token expired or invalid: let the app sign the user out.
    if (response.status === 401 && token) window.dispatchEvent(new Event('ak:unauthorized'));
    throw new ApiError(data.message || `Request failed (${response.status})`, response.status);
  }
  return data;
}
