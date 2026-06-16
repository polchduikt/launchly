import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import logoL from '../../assets/logo-l.png';
import { NAV_ITEMS } from './config/navItems';
import type { DashboardLayoutProps } from '../../types/shared';
import { Sparkles } from 'lucide-react';
import { useAiStore } from '../../store/useAiStore';
import { AiAssistantDrawer } from '../../features/ai/components/AiAssistantDrawer';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { setIsOpen } = useAiStore();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden">
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col justify-between h-full z-30 shrink-0">
        <div className="flex flex-col overflow-y-auto flex-1">
          <div className="h-16 flex items-center justify-center border-b border-slate-100 select-none">
            <img src={logoL} alt="L Logo" className="h-8 w-auto object-contain" />
          </div>

          <nav className="flex-1 py-4 flex flex-col items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 cursor-not-allowed select-none"
                    title={`${item.label} (Coming Soon)`}
                  >
                    <Icon size={18} />
                  </div>
                );
              }
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100 flex justify-center bg-slate-50/50">
          <div
            title={user.name}
            className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm overflow-hidden select-none shrink-0 shadow-sm"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.substring(0, 2).toUpperCase()
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </div>
      </main>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/60 hover:-translate-y-0.5 transition-all cursor-pointer z-40 group border border-indigo-500/20"
        title="AI Assistant"
      >
        <Sparkles size={18} className="group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
        </span>
      </button>
      <AiAssistantDrawer />
    </div>
  );
};
