import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { Check, ArrowRight } from 'lucide-react';
import logo from '../../../assets/logo.png';
import { LANDING_FEATURES } from '../config/features';
import { LANDING_PLANS } from '../config/plans';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  const handleCta = () => {
    if (isAuthenticated) {
      navigate('/home');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center select-none">
            <img src={logo} alt="Launchly Logo" className="h-10 w-auto object-contain" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <a href="#features" className="hover:text-indigo-700 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-700 transition-colors">Pricing</a>
          </nav>

          <div>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/home')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-40">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] bg-sky-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Supercharge your business with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-600">
              Telegram automation
            </span>
          </h1>

          <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            Connect your Telegram bots, automate customer support with AI, build custom marketing funnels, and close sales automatically.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleCta}
              className="w-full sm:w-auto py-3.5 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto py-3.5 px-8 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl text-center transition-all cursor-pointer"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Powerful features to automate your growth
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Launchly provides everything you need to communicate with your users at scale, directly in Telegram.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {LANDING_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="space-y-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${f.color}`}>
                      <Icon size={20} />
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Simple plans for businesses of all sizes
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Start free and upgrade as you grow. No hidden charges or cancellation fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
            {LANDING_PLANS.map((p) => (
              <div
                key={p.name}
                className={`bg-white border rounded-3xl p-8 flex flex-col justify-between relative transition-all hover:shadow-lg ${
                  p.popular ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md shadow-indigo-50/50' : 'border-slate-200'
                }`}
              >
                {p.popular && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">{p.name}</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-extrabold text-slate-900">{p.price}</span>
                      <span className="text-xs text-slate-600 font-semibold">/{p.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 pt-6 border-t border-slate-100">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2 text-xs text-slate-700 font-medium">
                        <Check size={14} className="text-indigo-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={handleCta}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-center transition-all cursor-pointer ${
                      p.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-100'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                    }`}
                  >
                    {p.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Launchly. All rights reserved. Built with love for developers & marketers.
          </p>
        </div>
      </footer>
    </div>
  );
};
