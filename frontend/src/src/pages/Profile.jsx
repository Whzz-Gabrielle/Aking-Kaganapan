import { Link } from 'react-router-dom';
import { StatusPill } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const initials = (user.fullName || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <section className="profile-page">
      <div className="page-heading"><div><span className="eyebrow">ACCOUNT SETTINGS</span><h1>My <em>profile.</em></h1><p>Your account information and role.</p></div></div>
      <div className="profile-card">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-details">
          <span className="eyebrow">ACCOUNT DETAILS</span>
          <h2>{user.fullName}</h2>
          <p>{user.email}</p>
          <div className="profile-meta"><span>Account type</span><StatusPill value={user.role} /></div>
          <p className="profile-note">Profile information is read from your signed-in account. To change your name or email, contact the system coordinator.</p>
          <Link className="btn btn-outline" to="/dashboard">Back to dashboard</Link>
        </div>
      </div>
    </section>
  );
}
