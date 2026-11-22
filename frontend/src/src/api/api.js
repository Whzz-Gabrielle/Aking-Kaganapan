const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('ak_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || 'Unexpected server response.' }; }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
