import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services.js';

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
    const data = await authApi.login(email, password);
    if (!data.token || !data.user) throw new Error('The server did not return a login token. Please check the backend login controller.');
    localStorage.setItem('ak_token', data.token);
    localStorage.setItem('ak_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback((payload) => authApi.register(payload), []);

  const logout = useCallback(() => {
    localStorage.removeItem('ak_token');
    localStorage.removeItem('ak_user');
    setUser(null);
  }, []);

  // The API client fires this when the server rejects our token (e.g. the 2h JWT expired).
  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem('ak_token');
      localStorage.removeItem('ak_user');
      setUser(null);
      setNotice({ type: 'error', text: 'Your session expired. Please sign in again.' });
    };
    window.addEventListener('ak:unauthorized', onExpired);
    return () => window.removeEventListener('ak:unauthorized', onExpired);
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
