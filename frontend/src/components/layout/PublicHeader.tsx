import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import logo from '../../assets/images/logo.png';
import { ROUTES } from '../../routes/paths';

export const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return (
    <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200/80 z-50 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={ROUTES.LANDING} className="flex items-center gap-2 select-none group">
          <img src={logo} alt="Launchly Logo" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
          <Link 
            to={ROUTES.LANDING} 
            className={`transition-colors hover:text-indigo-600 ${location.pathname === ROUTES.LANDING ? 'text-indigo-600 font-extrabold' : ''}`}
          >
            Home
          </Link>
          <a href="/#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="/#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <Link 
            to={ROUTES.BLOG} 
            className={`transition-colors hover:text-indigo-600 ${location.pathname.startsWith('/blog') ? 'text-indigo-600 font-extrabold' : ''}`}
          >
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate(ROUTES.REGISTER)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
