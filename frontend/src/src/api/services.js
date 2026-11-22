import { apiRequest } from './api.js';

const json = (body) => JSON.stringify(body);

export const authApi = {
  login: (email, password) => apiRequest('/api/users/login', { method: 'POST', body: json({ email, password }) }),
  register: (payload) => apiRequest('/api/users/register', { method: 'POST', body: json(payload) }),
};

// Keep these as stable, module-level functions: useApi() depends on their identity.
export const bookingsApi = {
  list: () => apiRequest('/api/bookings'),
  create: (payload) => apiRequest('/api/bookings', { method: 'POST', body: json(payload) }),
  update: (id, payload) => apiRequest(`/api/bookings/${id}`, { method: 'PUT', body: json(payload) }),
  remove: (id) => apiRequest(`/api/bookings/${id}`, { method: 'DELETE' }),
};

export const packagesApi = { list: () => apiRequest('/api/packages') };
export const venuesApi = { list: () => apiRequest('/api/venues') };
