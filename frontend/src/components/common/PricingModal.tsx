import React, { useState } from 'react';
import { t } from '../../i18n/config';
import { X, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import {
  usePlansQuery,
  useSubscriptionQuery,
  useCheckoutMutation,
  useCancelSubscriptionMutation,
} from '../../hooks/bot/useBillingQueries';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { data: plans = [], isLoading: isPlansLoading } = usePlansQuery();
  const { data: subscription } = useSubscriptionQuery();
  const checkoutMutation = useCheckoutMutation();
  const cancelMutation = useCancelSubscriptionMutation();

  const [upgradingPlanId, setUpgradingPlanId] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');

  if (!isOpen) return null;

  const currentPlanId = subscription?.plan?.id || 0;
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  const handleUpgrade = (planId: number, planName: string) => {
    setUpgradingPlanId(planId);
    if (planName.toUpperCase() === 'FREE') {
      cancelMutation.mutate(undefined, {
        onSuccess: () => {
          setUpgradingPlanId(null);
        },
        onError: () => {
          setUpgradingPlanId(null);
        },
      });
    } else {
      checkoutMutation.mutate(planId, {
        onSuccess: (data) => {
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          }
        },
        onError: () => {
          setUpgradingPlanId(null);
        },
      });
    }
  };

  const getPlanTagline = (planName: string) => {
    const name = planName.toLowerCase();
    return t(`pricing.tagline.${name}`);
  };

  const getPlanFeaturesList = (planName: string) => {
    const name = planName.toLowerCase();
    const list: string[] = [];
    let idx = 0;
    while (true) {
      const translation = t(`pricing.features.${name}.${idx}`);
      if (translation.startsWith('pricing.features.')) {
        break;
      }
      list.push(translation);
      idx++;
    }
    return list;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0A0A0A]/40 animate-fade-in select-none cursor-pointer font-['JetBrains_Mono',monospace]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-7xl overflow-hidden flex flex-col max-h-[94vh] animate-scale-up cursor-default"
      >
        <div className="bg-[#F2EBDD] px-6 py-4 flex flex-col items-center relative shrink-0 border-b-2 border-[#0A0A0A]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>

          <h2 className="font-['Anybody',sans-serif] text-xl md:text-2xl font-black text-[#0A0A0A] uppercase tracking-tight text-center">
            {t('pricing.header')}
          </h2>

          <div className="flex bg-white p-1 rounded-2xl border-2 border-[#0A0A0A] gap-1 mt-3">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                  : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
              }`}
            >
              {t('pricing.period.monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-4 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'annually'
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                  : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
              }`}
            >
              <span>{t('pricing.period.annually')}</span>
              <span className="bg-emerald-300 text-[#0A0A0A] text-[9px] font-black uppercase px-1.5 py-0.5 border border-[#0A0A0A] rounded-md select-none">
                {t('pricing.period.discount')}
              </span>
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto flex-1 min-h-0 bg-[#F2EBDD]">
          {isPlansLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0A0A0A]" size={36} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {sortedPlans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isPro = plan.name.toUpperCase() === 'PRO';
                const isFree = plan.name.toUpperCase() === 'FREE';
                const isUpgrading = upgradingPlanId === plan.id;
                const showAiBadge = plan.name.toUpperCase() === 'PRO' || plan.name.toUpperCase() === 'BUSINESS';
                
                let displayPrice = plan.price;
                if (billingPeriod === 'annually') {
                  displayPrice = Math.round(plan.price * 0.7);
                }

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 transition-all duration-300 shadow-[4px_4px_0px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_0px_#0A0A0A] hover:-translate-y-0.5 ${
                      isPro
                        ? 'ring-2 ring-[#0A0A0A]'
                        : ''
                    }`}
                  >
                    {isPro && (
                      <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#0A0A0A] text-[#F2EBDD] text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-lg border-2 border-[#0A0A0A] flex items-center gap-1 select-none whitespace-nowrap">
                        <Sparkles size={10} /> {t('pricing.most_popular')}
                      </span>
                    )}

                    <div className="flex-1 flex flex-col">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-['Anybody',sans-serif] font-black text-xl text-[#0A0A0A] uppercase tracking-tight">
                            {plan.displayName}
                          </h4>
                          {showAiBadge && (
                            <span className="bg-indigo-100 border-2 border-[#0A0A0A] text-[#0A0A0A] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                              +AI
                            </span>
                          )}
                        </div>
                        
                        <p className="text-slate-700 text-[11px] font-bold mt-1.5 leading-snug min-h-[28px]">
                          {getPlanTagline(plan.name)}
                        </p>

                        <div className="flex items-baseline gap-1 mt-2.5">
                          <span className="text-3xl font-black text-[#0A0A0A] tracking-tight">
                            ${displayPrice}
                          </span>
                          <span className="text-xs text-slate-700 font-bold">/mo</span>
                        </div>

                        <div className="mt-3">
                          <div className="text-lg font-black text-[#0A0A0A]">
                            {plan.maxBotUsers.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                            <span>{t('pricing.active_contacts')}</span>
                            <HelpCircle size={11} className="text-[#0A0A0A]" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-[#F2EBDD] border-2 border-[#0A0A0A] text-slate-600 text-xs font-black uppercase rounded-xl select-none cursor-not-allowed text-center transition-all"
                          >
                            {t('pricing.current_plan')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpgrade(plan.id, plan.name)}
                            disabled={upgradingPlanId !== null}
                            className={`w-full py-2.5 text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              isPro
                                ? 'bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD]'
                                : 'bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A]'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isUpgrading ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>{t('pricing.btn.processing')}</span>
                              </>
                            ) : isFree ? (
                              t('pricing.btn.free')
                            ) : isPro ? (
                              t('pricing.btn.pro')
                            ) : (
                              t('pricing.btn.start')
                            )}
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex-1">
                        <ul className="space-y-1.5">
                          {getPlanFeaturesList(plan.name).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                              <span className="text-[#0A0A0A] shrink-0 select-none font-bold">•</span>
                              <span className="text-slate-800 font-bold leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
