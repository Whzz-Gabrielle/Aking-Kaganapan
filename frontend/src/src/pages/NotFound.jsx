import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="restricted">
      <span>✳</span>
      <h2>Page not found</h2>
      <p>The page you’re looking for doesn’t exist or has moved.</p>
      <Link className="btn btn-primary" to="/">Back to home</Link>
    </section>
  );
}

// Shown when a signed-in user opens a page meant for the other role.
export function Forbidden({ role }) {
  return (
    <section className="restricted" role="alert">
      <span>⛔</span>
      <h2>This page isn’t available for your account</h2>
      <p>{role === 'Coordinator' ? 'Only coordinators can open this page.' : 'This page is for clients only.'}</p>
      <Link className="btn btn-primary" to="/dashboard">Go to my dashboard</Link>
    </section>
  );
}
