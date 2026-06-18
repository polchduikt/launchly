import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

const InlineSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return isAuthenticated ? (
    <Suspense fallback={<InlineSpinner />}>
      <Outlet />
    </Suspense>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
