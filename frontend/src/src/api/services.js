import { apiRequest } from './api.js';

const json = (body) => JSON.stringify(body);

export const authApi = {
  login: (email, password) => apiRequest('/api/users/login', { method: 'POST', body: json({ email, password }) }),
  register: (payload) => apiRequest('/api/users/register', { method: 'POST', body: json(payload) }),
  me: () => apiRequest('/api/users/me'),
};

// Keep these as stable, module-level functions: useApi() depends on their identity.
export const bookingsApi = {
  list: () => apiRequest('/api/bookings'),
  create: (payload) => apiRequest('/api/bookings', { method: 'POST', body: json(payload) }),
  update: (id, payload) => apiRequest(`/api/bookings/${id}`, { method: 'PUT', body: json(payload) }),
  cancel: (id) => apiRequest(`/api/bookings/${id}/cancel`, { method: 'PATCH' }),
  remove: (id) => apiRequest(`/api/bookings/${id}`, { method: 'DELETE' }),
};

export const packagesApi = {
  list: () => apiRequest('/api/packages'),
  create: (payload) => apiRequest('/api/packages', { method: 'POST', body: json(payload) }),
  update: (id, payload) => apiRequest(`/api/packages/${id}`, { method: 'PUT', body: json(payload) }),
  remove: (id) => apiRequest(`/api/packages/${id}`, { method: 'DELETE' }),
};

export const venuesApi = {
  list: () => apiRequest('/api/venues'),
  create: (payload) => apiRequest('/api/venues', { method: 'POST', body: json(payload) }),
  update: (id, payload) => apiRequest(`/api/venues/${id}`, { method: 'PUT', body: json(payload) }),
  remove: (id) => apiRequest(`/api/venues/${id}`, { method: 'DELETE' }),
};

export const paymentsApi = {
  mine: () => apiRequest('/api/payments/my-payments'),
  all: () => apiRequest('/api/payments'),
  submit: (formData) => apiRequest('/api/payments', { method: 'POST', body: formData }),
  review: (id, payload) => apiRequest(`/api/payments/${id}/verify`, { method: 'PUT', body: json(payload) }),
};

export const expensesApi = {
  list: () => apiRequest('/api/expenses'),
  create: (payload) => apiRequest('/api/expenses', { method: 'POST', body: json(payload) }),
  cancel: (id) => apiRequest(`/api/expenses/${id}/cancel`, { method: 'PATCH' }),
};
