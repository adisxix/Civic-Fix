import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks';

export function RequireAuth() {
  const { user, status } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-emerald-800 font-medium text-sm">Checking authorization...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function RequireRole({ roles }) {
  const { user, status } = useAppSelector((state) => state.auth);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-emerald-800 font-medium text-sm">Verifying access...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    const dest = ['ward_admin', 'worker', 'admin', 'moderator'].includes(user.role)
      ? '/ward/queue'
      : '/citizen/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { user, status } = useAppSelector((state) => state.auth);

  if (status === 'loading') {
    return null;
  }

  if (user) {
    const dest = ['ward_admin', 'worker', 'admin', 'moderator'].includes(user.role)
      ? '/ward/queue'
      : '/citizen/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
}
