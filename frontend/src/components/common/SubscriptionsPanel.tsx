import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { t } from '../../i18n/config';
import {
  useSubscriptionQuery,
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
} from '../../hooks/bot/useBillingQueries';
import { useBotStore } from '../../store/useBotStore';
import { useBotUsersQuery } from '../../hooks/crm/useCrmQueries';
import { PricingModal } from './PricingModal';

export const SubscriptionsPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: botUsers = [] } = useBotUsersQuery(activeBotId || 0, !!activeBotId);
  const activeContactsCount = botUsers.length || 2;

  const {
    data: subscription,
    isLoading: isSubLoading,
    error: subError,
  } = useSubscriptionQuery();

  const cancelMutation = useCancelSubscriptionMutation();
  const resumeMutation = useResumeSubscriptionMutation();

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const isLoading = isSubLoading;
  const error = subError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-xs font-bold text-slate-400">{t('settings.billing.loading')}</span>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-3xl flex items-start gap-3 max-w-md mx-auto shadow-sm">
        <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm">{t('settings.billing.error_loading')}</h3>
          <p className="text-xs text-rose-700/90 leading-relaxed">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    );
  }

  const { plan, cancelAtPeriodEnd } = subscription;
  const isFree = plan.name.toUpperCase() === 'FREE';
  const maxContactsLimit = plan.maxBotUsers || 25;
  const pct = Math.min((activeContactsCount / maxContactsLimit) * 100, 100);

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const handleResume = () => {
    resumeMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t('settings.billing.your_plan')}
            </span>
            <h2 className="text-3xl font-black text-slate-800 capitalize tracking-tight leading-none">
              {plan.displayName}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {!isFree && (
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('settings.billing.change_plan')}
              </button>
            )}

            {isFree ? (
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-100"
              >
                {t('settings.billing.activate_trial')}
              </button>
            ) : cancelAtPeriodEnd ? (
              <button
                onClick={handleResume}
                disabled={resumeMutation.isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {resumeMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                {t('settings.billing.restore')}
              </button>
            ) : (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-5 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                {cancelMutation.isPending && <Loader2 size={12} className="animate-spin text-rose-600" />}
                {t('settings.billing.cancel')}
              </button>
            )}
          </div>
        </div>

        <div className="pt-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">{t('settings.billing.contacts')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('settings.billing.desc')}
            </p>
          </div>

          <div className="space-y-2 pt-6 px-10">
            <div className="relative w-full h-12">
              <div
                className="absolute flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                style={{ left: `${pct}%` }}
              >
                <span className="text-sm font-extrabold text-slate-800 leading-none">
                  {activeContactsCount}
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-1 whitespace-nowrap">
                  {t('settings.billing.active_contacts')}
                </span>
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#1d59c9] mt-1.5" />
              </div>
            </div>

            <div className="w-full h-5 bg-slate-100 rounded-full relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#1d59c9] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 px-0.5">
              <span>0</span>
              <span>{maxContactsLimit}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 text-left">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400">{t('settings.billing.price')}</span>
              <p className="text-sm font-extrabold text-slate-700">
                {isFree ? '$0' : `$${plan.price}`}
              </p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-6">
              <span className="text-xs font-bold text-slate-400">{t('settings.billing.contacts')}</span>
              <p className="text-sm font-extrabold text-slate-700">
                {activeContactsCount}/{maxContactsLimit}
              </p>
            </div>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
};
