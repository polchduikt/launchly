import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROUTES } from '../../constants/routes';
import { Loader2 } from 'lucide-react';

const InlineSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return isAuthenticated ? (
    <Navigate to={ROUTES.HOME} replace />
  ) : (
    <Suspense fallback={<InlineSpinner />}>
      <Outlet />
    </Suspense>
  );
};

export default PublicRoute;
