import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../../bot/hooks/useBotMutations';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { Sparkles, Calendar, ArrowUpRight, Zap, Loader2, ArrowRight } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { bots } = useBotStore();
  const { isLoading } = useBotsQuery();

  useEffect(() => {
    if (!isLoading && bots.length === 0) {
      navigate('/connect-bot');
    }
  }, [isLoading, bots, navigate]);

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

  if (bots.length === 0) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Start Here</h2>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-705 transition-colors flex items-center gap-1 group cursor-pointer">
              <span>Explore all Templates</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-2xl p-6 flex flex-col justify-between group cursor-pointer min-h-[180px]">
              <div>
                <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100 shadow-sm shadow-indigo-100/30">
                  <Sparkles size={18} />
                </span>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-605 transition-colors text-base mb-2">
                  Capture customer data with a lead magnet
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Use a lead magnet to capture qualified emails and profile details automatically.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Zap size={12} />
                <span>Flow Builder</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-2xl p-6 flex flex-col justify-between group cursor-pointer min-h-[180px]">
              <div>
                <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100 shadow-sm shadow-rose-100/30">
                  <Calendar size={18} />
                </span>
                <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors text-base mb-2">
                  Send event reminders
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Send scheduled reminders and confirmations to save time and increase attendance.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Zap size={12} />
                <span>Flow Builder</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-2xl p-6 flex flex-col justify-between group cursor-pointer min-h-[180px]">
              <div>
                <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mb-4 border border-sky-100 shadow-sm shadow-sky-100/30">
                  <ArrowUpRight size={18} />
                </span>
                <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-base mb-2">
                  Redirect customers to your website
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Direct users to specific web URLs and pages in response to common keyword queries.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Zap size={12} />
                <span>Flow Builder</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hit Your Growth Goals</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all rounded-2xl p-6 flex flex-col justify-between group cursor-pointer min-h-[180px]">
              <div>
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 shadow-sm shadow-emerald-100/30">
                  <Sparkles size={18} />
                </span>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-base mb-2">
                  Automate conversations with AI
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Get AI to collect your follower's info, share details, or tell it how to reply.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <Zap size={12} />
                <span>Flow Builder</span>
              </div>
            </div>

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
