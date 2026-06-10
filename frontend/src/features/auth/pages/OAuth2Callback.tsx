import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { getCurrentUserApi } from '../api/auth';
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
        navigate('/login', { replace: true });
        return;
      }

      try {
        useAuthStore.setState({ accessToken, refreshToken });
        const user = await getCurrentUserApi();
        login(accessToken, refreshToken, user);
        navigate('/home', { replace: true });
      } catch (error) {
        useAuthStore.getState().logout();
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-600 font-medium">Completing secure sign in...</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;
