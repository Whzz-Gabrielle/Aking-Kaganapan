import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/api.js';

const AuthContext = createContext(null);

function readUser() {
  try { return JSON.parse(localStorage.getItem('ak_user') || 'null'); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('ak_token') ? readUser() : null));
  const [notice, setNotice] = useState(null);

  const setMessage = useCallback((type, text) => setNotice({ type, text }), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  const login = useCallback(async (email, password) => {
    const data = await apiRequest('/api/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!data.token || !data.user) throw new Error('The server did not return a login token. Please check the backend login controller.');
    localStorage.setItem('ak_token', data.token);
    localStorage.setItem('ak_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback((payload) => apiRequest('/api/users/register', { method: 'POST', body: JSON.stringify(payload) }), []);

  const logout = useCallback(() => {
    localStorage.removeItem('ak_token');
    localStorage.removeItem('ak_user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user, isCoordinator: user?.role === 'Coordinator',
    login, register, logout, notice, setMessage, clearNotice,
  }), [user, login, register, logout, notice, setMessage, clearNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
