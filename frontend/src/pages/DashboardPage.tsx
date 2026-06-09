import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { logoutApi } from '../features/auth/api/auth';
import { LogOut } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (e) {
      console.error(e);
    } finally {
      logout();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          {user.name}
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-red-600/10 mx-auto"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
