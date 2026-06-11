import React from 'react';
import { useRequireBots } from '../hooks/useRequireBots';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { Zap, Loader2, ArrowRight } from 'lucide-react';
import { START_HERE_TEMPLATES, GROWTH_GOAL_TEMPLATES } from '../config/templates';

const DashboardPage: React.FC = () => {
  const { isLoading, hasBots } = useRequireBots();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <span className="text-sm font-semibold text-slate-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!hasBots) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Start Here</h2>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 group cursor-pointer">
              <span>Explore all Templates</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {START_HERE_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <div
                  key={tmpl.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-2xl p-6 flex flex-col justify-between group cursor-pointer min-h-[180px]"
                >
                  <div>
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border shadow-sm ${tmpl.iconBgClass}`}>
                      <Icon size={18} className={tmpl.iconTextClass} />
                    </span>
                    <h3 className={`font-bold text-slate-900 transition-colors text-base mb-2 ${tmpl.hoverTextClass}`}>
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {tmpl.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <Zap size={12} />
                    <span>{tmpl.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hit Your Growth Goals</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GROWTH_GOAL_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <div
                  key={tmpl.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-2xl p-6 flex flex-col justify-between group cursor-pointer min-h-[180px]"
                >
                  <div>
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border shadow-sm ${tmpl.iconBgClass}`}>
                      <Icon size={18} className={tmpl.iconTextClass} />
                    </span>
                    <h3 className={`font-bold text-slate-900 transition-colors text-base mb-2 ${tmpl.hoverTextClass}`}>
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {tmpl.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <Zap size={12} />
                    <span>{tmpl.type}</span>
                  </div>
                </div>
              );
            })}

            <div className="bg-slate-100 border border-slate-200/50 rounded-2xl p-6 flex flex-col justify-center items-center min-h-[180px] relative overflow-hidden select-none">
              <div className="absolute inset-0 bg-pattern opacity-60" />
              <div className="relative text-center space-y-1">
                <p className="text-slate-400 font-bold text-sm">More templates coming soon</p>
                <p className="text-slate-400 text-xs">Stay tuned for updates!</p>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-200/50 rounded-2xl p-6 flex flex-col justify-center items-center min-h-[180px] relative overflow-hidden select-none">
              <div className="absolute inset-0 bg-pattern opacity-60" />
              <div className="relative text-center space-y-1">
                <p className="text-slate-400 font-bold text-sm">Design custom flows</p>
                <p className="text-slate-400 text-xs">Unlock your creativity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
