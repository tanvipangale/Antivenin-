import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return <p className="mx-auto max-w-3xl px-6 py-16 text-center text-ink/60">Loading…</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}