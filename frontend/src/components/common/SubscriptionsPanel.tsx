import React, { useState } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  Users, 
  Send, 
  Check, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useTranslation } from '../../i18n/config';
import { useContactsCountQuery } from '../../hooks/crm/useCrmQueries';
import { useBotsQuery } from '../../hooks/bot/useBotsQuery';
import {
  useSubscriptionQuery,
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
} from '../../hooks/bot/useBillingQueries';
import { PricingModal } from './PricingModal';

export const SubscriptionsPanel: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { count: activeContactsCount = 0 } = useContactsCountQuery();
  const { data: bots = [] } = useBotsQuery();

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
        <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
        <span className="text-xs font-bold text-slate-500">{t('settings.billing.loading')}</span>
      </div>
    );
  }

  if (error || !subscription || !subscription.plan) {
    return (
      <div className="bg-rose-50 border-2 border-rose-500 text-rose-800 p-6 rounded-2xl flex items-start gap-3 max-w-md mx-auto shadow-[2px_2px_0px_#0A0A0A]">
        <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-['Anybody',sans-serif] font-black text-sm uppercase">{t('settings.billing.error_loading')}</h3>
          <p className="text-xs text-rose-700 font-bold leading-relaxed">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
        </div>
      </div>
    );
  }

  const { plan, cancelAtPeriodEnd, currentPeriodEnd } = subscription;
  const planKey = (plan.name || 'free').toLowerCase();
  const isFree = planKey === 'free';

  const maxContactsLimit = plan.maxBotUsers || (isFree ? 10 : 1500);
  const contactsPct = Math.min(Math.round((activeContactsCount / maxContactsLimit) * 100), 100);
  const contactsLeft = Math.max(maxContactsLimit - activeContactsCount, 0);

  const connectedBots = bots.filter((b) => b.hasTelegramToken && !b.isTemplate);
  const uniqueConnectedBots = Array.from(
    new Map(
      connectedBots.map((b) => [b.username ? b.username.toLowerCase() : `bot_${b.id}`, b])
    ).values()
  );
  const botsCount = uniqueConnectedBots.length;

  const maxBotsLimit = plan.maxBots || (isFree ? 1 : 4);
  const isBotsUnlimited = maxBotsLimit >= 100;
  const botsPct = isBotsUnlimited 
    ? Math.min(Math.round((botsCount / 100) * 100), 100) 
    : Math.min(Math.round((botsCount / maxBotsLimit) * 100), 100);
  const botsLeft = isBotsUnlimited ? t('settings.billing.unlimited') : Math.max(maxBotsLimit - botsCount, 0);

  const getPlanFeatures = (key: string): string[] => {
    const featuresCountMap: Record<string, number> = {
      free: 6,
      starter: 6,
      pro: 7,
      business: 8,
    };
    const count = featuresCountMap[key] || 6;
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      if (i === 2) continue;
      const featureText = t(`pricing.features.${key}.${i}`);
      if (featureText && !featureText.startsWith('pricing.features.')) {
        list.push(featureText);
      }
    }
    return list;
  };

  const planFeatures = getPlanFeatures(planKey);

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const handleResume = () => {
    resumeMutation.mutate();
  };

  const formattedPeriodEnd = currentPeriodEnd 
    ? new Date(currentPeriodEnd).toLocaleDateString(currentLanguage === 'uk' ? 'uk-UA' : 'en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : null;

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2 text-left">
            <div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                {t('settings.billing.your_plan')}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-['Anybody',sans-serif] text-3xl md:text-4xl font-black text-[#0A0A0A] uppercase tracking-tight leading-none">
                {plan.displayName}
              </h2>
              <span className="text-sm font-bold text-slate-600">
                {isFree ? '$0 / безкоштовно' : `$${plan.price} / ${t('settings.billing.per_month', 'місяць')}`}
              </span>
            </div>

            {formattedPeriodEnd && !isFree && (
              <div className="pt-1 flex items-center gap-2 text-xs font-bold">
                <Calendar size={13} className="text-slate-500" />
                <span className="text-slate-600">
                  {cancelAtPeriodEnd ? (
                    <span className="text-rose-600 font-black">
                      {t('settings.billing.status_canceling')}: {formattedPeriodEnd}
                    </span>
                  ) : (
                    <span>
                      {t('settings.billing.next_billing')}: {formattedPeriodEnd}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isFree && (
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
              >
                {t('settings.billing.change_plan')}
              </button>
            )}

            {isFree ? (
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className="px-4 py-2 bg-emerald-200 hover:bg-emerald-300 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
              >
                {t('settings.billing.activate_trial')}
              </button>
            ) : cancelAtPeriodEnd ? (
              <button
                onClick={handleResume}
                disabled={resumeMutation.isPending}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-indigo-700 disabled:opacity-50 text-[#F2EBDD] border-2 border-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                {resumeMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                {t('settings.billing.restore')}
              </button>
            ) : (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 border-2 border-rose-600 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                {cancelMutation.isPending && <Loader2 size={12} className="animate-spin text-rose-800" />}
                {t('settings.billing.cancel')}
              </button>
            )}
          </div>
        </div>

        <div className="pt-6 space-y-6">
          <div className="text-left">
            <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-tight">
              {t('settings.billing.usage_title', 'Використання ресурсів')}
            </h3>
            <p className="text-xs text-slate-600 font-bold mt-1">
              {t('settings.billing.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border-2 border-[#0A0A0A] rounded-2xl p-5 space-y-4 shadow-[2px_2px_0px_#0A0A0A]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A]">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-['Anybody',sans-serif] font-black text-xs text-[#0A0A0A] uppercase">
                      {t('settings.billing.contacts')}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-bold">
                      {t('settings.billing.contacts_desc', 'Активні контакти та підписники')}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A]">
                  {contactsPct}%
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-4 bg-white border-2 border-[#0A0A0A] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-[#0A0A0A] rounded-full transition-all duration-500"
                    style={{ width: `${contactsPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-black text-[#0A0A0A]">
                  <span>{activeContactsCount} {t('settings.billing.used_of', 'з')} {maxContactsLimit.toLocaleString()}</span>
                  <span className="text-slate-600 text-[11px] font-bold">
                    {contactsLeft.toLocaleString()} {t('settings.billing.available_left', 'залишилось')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-2 border-[#0A0A0A] rounded-2xl p-5 space-y-4 shadow-[2px_2px_0px_#0A0A0A]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A]">
                    <Send size={18} />
                  </div>
                  <div>
                    <h4 className="font-['Anybody',sans-serif] font-black text-xs text-[#0A0A0A] uppercase">
                      {t('settings.billing.bots', 'Telegram боти')}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-bold">
                      {t('settings.billing.bots_desc', 'Підключені канали та боти')}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white border-2 border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A]">
                  {isBotsUnlimited ? '100%' : `${botsPct}%`}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full h-4 bg-white border-2 border-[#0A0A0A] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-[#0A0A0A] rounded-full transition-all duration-500"
                    style={{ width: `${isBotsUnlimited ? 100 : botsPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-black text-[#0A0A0A]">
                  <span>
                    {botsCount} {t('settings.billing.used_of', 'з')} {isBotsUnlimited ? t('settings.billing.unlimited', 'Безлімітно') : maxBotsLimit}
                  </span>
                  <span className="text-slate-600 text-[11px] font-bold">
                    {isBotsUnlimited ? t('settings.billing.unlimited') : `${botsLeft} ${t('settings.billing.available_left', 'залишилось')}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {planFeatures.length > 0 && (
          <div className="pt-8 mt-8 border-t border-slate-200 text-left space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#0A0A0A]" />
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-tight">
                {t('settings.billing.included_features', 'Що входить у ваш тариф')}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {planFeatures.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3.5 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A] transition-all"
                >
                  <div className="w-5 h-5 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} className="text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-[#0A0A0A] leading-tight">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
};
