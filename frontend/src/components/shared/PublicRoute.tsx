import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROUTES } from '../../constants/routes';

const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return isAuthenticated ? <Navigate to={ROUTES.HOME} replace /> : <Outlet />;
};

export default PublicRoute;
