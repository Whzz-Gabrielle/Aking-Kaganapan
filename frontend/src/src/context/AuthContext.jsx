import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services.js';

const AuthContext = createContext(null);

function readUser() {
  try { return JSON.parse(localStorage.getItem('ak_user') || 'null'); } catch { return null; }
}

function clearSession() {
  localStorage.removeItem('ak_token');
  localStorage.removeItem('ak_user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('ak_token') ? readUser() : null));
  // `ready` flips to true once the stored session has been checked with the server.
  const [ready, setReady] = useState(() => !localStorage.getItem('ak_token'));
  const [notice, setNotice] = useState(null);

  const setMessage = useCallback((type, text) => setNotice({ type, text }), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    if (!data.token || !data.user) throw new Error('The server did not return a login token. Please try again.');
    localStorage.setItem('ak_token', data.token);
    localStorage.setItem('ak_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback((payload) => authApi.register(payload), []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // On first load, confirm the stored token is still valid and the role is current.
  // (Role-based screens read the role from here, so it must not be a stale copy.)
  useEffect(() => {
    if (!localStorage.getItem('ak_token')) return undefined;
    let cancelled = false;
    authApi.me()
      .then(({ user: fresh }) => {
        if (cancelled || !fresh) return;
        localStorage.setItem('ak_user', JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch((err) => {
        // 401 is handled by the ak:unauthorized listener below. For a network/server
        // problem keep the saved session so a brief outage doesn't sign people out.
        if (!cancelled && err.status !== 401) console.warn('Could not verify session:', err.message);
      })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  // The API client fires this when the server rejects our token (e.g. the 2h JWT expired).
  useEffect(() => {
    const onExpired = () => {
      clearSession();
      setUser(null);
      setNotice({ type: 'error', text: 'Your session expired. Please sign in again.' });
    };
    window.addEventListener('ak:unauthorized', onExpired);
    return () => window.removeEventListener('ak:unauthorized', onExpired);
  }, []);

  const value = useMemo(() => ({
    user, ready, isCoordinator: user?.role === 'Coordinator',
    login, register, logout, notice, setMessage, clearNotice,
  }), [user, ready, login, register, logout, notice, setMessage, clearNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
