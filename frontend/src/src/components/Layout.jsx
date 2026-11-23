import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { Brand, Notice } from './ui.jsx';

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
}

const cls = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

export default function Layout() {
  const { user, isCoordinator, logout, notice, setMessage, clearNotice } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const online = useOnline();

  // Scroll to top + close mobile menu + clear stale notices on route change.
  useEffect(() => { window.scrollTo({ top: 0 }); setMenuOpen(false); }, [pathname]);

  function handleLogout() {
    logout();
    navigate('/');
    setMessage('success', 'You have been signed out.');
  }

  const publicLinks = (
    <>
      <NavLink to="/" end className={cls}>Home</NavLink>
      <NavLink to="/about" className={cls}>About</NavLink>
      <NavLink to="/services" className={cls}>Services</NavLink>
      <NavLink to="/faq" className={cls}>FAQ</NavLink>
      <NavLink to="/contact" className={cls}>Contact</NavLink>
    </>
  );

  const signOut = <button className="btn btn-outline nav-logout" onClick={handleLogout}>Sign out</button>;

  // Each role only sees the links it can actually use.
  const clientLinks = (
    <>
      <NavLink to="/dashboard" className={cls}>My bookings</NavLink>
      <NavLink to="/bookings/new" className={cls}>Book an event</NavLink>
      <NavLink to="/payments" className={cls}>My payments</NavLink>
      <NavLink to="/services" className={cls}>Services</NavLink>
      <NavLink to="/profile" className={cls}>My profile</NavLink>
      {signOut}
    </>
  );

  const coordinatorLinks = (
    <>
      <NavLink to="/dashboard" className={cls}>Overview</NavLink>
      <NavLink to="/payments" className={cls}>Payments</NavLink>
      <NavLink to="/expenses" className={cls}>Expenses</NavLink>
      <NavLink to="/manage/packages" className={cls}>Packages</NavLink>
      <NavLink to="/manage/venues" className={cls}>Venues</NavLink>
      <NavLink to="/profile" className={cls}>Profile</NavLink>
      {signOut}
    </>
  );

  const guestLinks = (
    <>
      {publicLinks}
      <NavLink to="/login" className={cls}>Sign in</NavLink>
      <NavLink to="/register" className="btn btn-primary">Create account</NavLink>
    </>
  );

  const nav = !user ? guestLinks : isCoordinator ? coordinatorLinks : clientLinks;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="topbar-inner">
          <Brand />
          <nav className="nav-actions" aria-label="Main">{nav}</nav>
          <button className="mobile-menu" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle navigation" aria-expanded={menuOpen}>☰</button>
        </div>
        {menuOpen && <nav className="mobile-nav" aria-label="Mobile">{nav}</nav>}
      </header>

      {!online && <div className="offline-banner" role="alert">You are offline. Changes can’t be saved until your connection returns.</div>}

      <main id="main">
        <Notice notice={notice} clear={clearNotice} />
        <ErrorBoundary key={pathname}><Outlet /></ErrorBoundary>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <Brand />
          <p>Thoughtfully planned. Beautifully remembered.</p>
          <nav className="footer-links" aria-label="Footer">
            <NavLink to="/about">About</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/faq">FAQ</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/privacy">Privacy</NavLink>
            <NavLink to="/terms">Terms</NavLink>
          </nav>
          <small>© {new Date().getFullYear()} Aking Kaganapan · Event Booking System</small>
        </div>
      </footer>
    </div>
  );
}
