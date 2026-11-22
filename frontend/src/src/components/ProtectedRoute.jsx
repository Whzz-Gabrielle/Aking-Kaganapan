import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Wrap private routes. `role` optionally restricts to Coordinator / Client.
export default function ProtectedRoute({ role }) {
  const { user, isCoordinator } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role === 'Coordinator' && !isCoordinator) return <Navigate to="/dashboard" replace />;
  if (role === 'Client' && isCoordinator) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
