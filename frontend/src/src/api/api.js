const API_BASE = import.meta.env.VITE_API_BASE || '';
const REQUEST_TIMEOUT_MS = 20000;

// Public endpoints never send the stored token, so a stale token can't
// turn a wrong-password login into a confusing "session expired" message.
const PUBLIC_PATHS = ['/api/users/login', '/api/users/register'];

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors; // [{ field, message }] from server validation
  }

  get isNetwork() { return this.status === 0; }
  get isForbidden() { return this.status === 403; }
  get isNotFound() { return this.status === 404; }

  // Message for one form field, if the server reported one.
  fieldMessage(field) { return this.errors.find((e) => e.field === field)?.message; }
}

export async function apiRequest(path, options = {}) {
  const isPublic = PUBLIC_PATHS.includes(path);
  const token = isPublic ? null : localStorage.getItem('ak_token');
  const isForm = options.body instanceof FormData;

  // For FormData the browser must set the multipart boundary itself.
  const headers = { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (error) {
    throw new ApiError(
      error.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Check your connection and that the backend is running.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: '' }; }

  if (!response.ok) {
    // Token expired or invalid: let the app sign the user out.
    if (response.status === 401 && token) window.dispatchEvent(new Event('ak:unauthorized'));
    throw new ApiError(data.message || friendlyStatus(response.status), response.status, data.errors || []);
  }
  return data;
}

function friendlyStatus(status) {
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 413) return 'That upload is too large.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 503) return 'The service is temporarily unavailable. Please try again shortly.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return `Request failed (${status}).`;
}
