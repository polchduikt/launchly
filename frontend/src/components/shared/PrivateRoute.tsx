import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getCurrentUserApi } from '../../features/auth/api/auth';
import { ROUTES } from '../../constants/routes';
import { Loader2 } from 'lucide-react';

const InlineSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

const PrivateRoute = () => {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const syncUser = async () => {
      if (accessToken) {
        try {
          const latestUser = await getCurrentUserApi();
          if (isMounted) {
            setUser(latestUser);
          }
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      }
      if (isMounted) {
        setIsSyncing(false);
      }
    };

    syncUser();
    return () => {
      isMounted = false;
    };
  }, [accessToken, setUser]);

  if (!accessToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (isSyncing) {
    return <InlineSpinner />;
  }

  const role = user?.role;
  const isAdminOrManager = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  if (isAdminOrManager && !location.pathname.startsWith('/admin')) {
    return <Navigate to={ROUTES.ADMIN_HOME} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
