import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { getCurrentUserApi } from '../../../api/auth';
import { ROUTES } from '../../../routes/paths';
import { STORAGE_KEYS } from '../../../const/constants';
import { isAdminOrManager, getSafeRedirectUrl } from '../../../utils/auth';
import { Loader2 } from 'lucide-react';

const OAuth2Callback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      if (!accessToken || !refreshToken) {
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }

      try {
        useAuthStore.setState({ accessToken, refreshToken });
        const user = await getCurrentUserApi();
        login(accessToken, refreshToken, user);

        const rawRedirect = searchParams.get('redirect') || localStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT_URL);
        localStorage.removeItem(STORAGE_KEYS.AUTH_REDIRECT_URL);
        const safeRedirect = getSafeRedirectUrl(rawRedirect);
        if (safeRedirect) {
          navigate(safeRedirect, { replace: true });
          return;
        }

        if (isAdminOrManager(user.role)) {
          navigate(ROUTES.ADMIN_HOME, { replace: true });
        } else {
          navigate(ROUTES.HOME, { replace: true });
        }
      } catch {
        useAuthStore.getState().logout();
        navigate(ROUTES.LOGIN, { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-sm font-semibold text-slate-500">Completing secure sign in...</span>
      </div>
    </div>
  );
};

export default OAuth2Callback;
