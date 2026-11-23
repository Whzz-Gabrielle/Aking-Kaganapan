import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Forbidden } from '../pages/NotFound.jsx';
import { Spinner } from './ui.jsx';

// Wrap private routes. `role` optionally restricts to Coordinator / Client.
// Signed-out visitors go to sign-in; signed-in users with the wrong role see a clear "no access" page.
export default function ProtectedRoute({ role }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Forbidden role={role} />;
  return <Outlet />;
}
