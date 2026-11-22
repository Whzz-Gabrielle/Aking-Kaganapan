import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Brand, Notice } from './ui.jsx';

const cls = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

export default function Layout() {
  const { user, isCoordinator, logout, notice, setMessage, clearNotice } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

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

  const accountLinks = user ? (
    <>
      <NavLink to="/dashboard" className={cls}>{isCoordinator ? 'Overview' : 'My bookings'}</NavLink>
      {!isCoordinator && <NavLink to="/bookings/new" className={cls}>Book an event</NavLink>}
      <NavLink to="/profile" className={cls}>My profile</NavLink>
      <button className="btn btn-outline nav-logout" onClick={handleLogout}>Sign out</button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={cls}>Sign in</NavLink>
      <NavLink to="/register" className="btn btn-primary">Create account</NavLink>
    </>
  );

  const nav = <>{publicLinks}{accountLinks}</>;

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

      <main id="main">
        <Notice notice={notice} clear={clearNotice} />
        <Outlet />
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
