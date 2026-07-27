import React, { useState } from 'react';
import { t } from '../../../i18n/config';
import { X, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import {
  usePlansQuery,
  useSubscriptionQuery,
  useCheckoutMutation,
  useCancelSubscriptionMutation,
} from '../hooks/useBillingQueries';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-50 rounded-[32px] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[94vh] border border-slate-100 animate-scale-up">
        
        <div className="bg-white bg-pattern p-8 flex flex-col items-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight text-center">
            {t('pricing.header')}
          </h2>

          <div className="flex bg-slate-100 p-1 rounded-full gap-1 mt-6">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('pricing.period.monthly')}
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'annually'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{t('pricing.period.annually')}</span>
              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full select-none">
                {t('pricing.period.discount')}
              </span>
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
          {isPlansLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={36} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                    className={`relative flex flex-col bg-white border rounded-[28px] p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      isPro
                        ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-lg shadow-indigo-50/50'
                        : 'border-slate-200'
                    }`}
                  >
                    {isPro && (
                      <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1 select-none whitespace-nowrap">
                        <Sparkles size={10} /> {t('pricing.most_popular')}
                      </span>
                    )}

                    <div className="flex-1 flex flex-col">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-2xl text-slate-900 tracking-tight capitalize">
                            {plan.displayName}
                          </h4>
                          {showAiBadge && (
                            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-100">
                              +AI
                            </span>
                          )}
                        </div>
                        
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed min-h-[36px]">
                          {getPlanTagline(plan.name)}
                        </p>

                        <div className="flex items-baseline gap-1 mt-4">
                          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            ${displayPrice}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/mo</span>
                        </div>

                        <div className="mt-5">
                          <div className="text-xl font-bold text-slate-800">
                            {plan.maxBotUsers.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <span>{t('pricing.active_contacts')}</span>
                            <HelpCircle size={12} className="text-slate-300" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-3.5 bg-slate-50 border border-slate-100 text-slate-400 text-xs font-bold rounded-2xl select-none cursor-not-allowed text-center transition-all shadow-sm"
                          >
                            {t('pricing.current_plan')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpgrade(plan.id, plan.name)}
                            disabled={upgradingPlanId !== null}
                            className={`w-full py-3.5 text-xs font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                              isPro
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                                : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
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

                      <div className="mt-6 flex-1">
                        <ul className="space-y-3">
                          {getPlanFeaturesList(plan.name).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                              <span className="text-slate-400 shrink-0 select-none font-bold">•</span>
                              <span className="text-slate-600 font-medium">{feat}</span>
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

          <div className="flex justify-center mt-8">
            <span className="text-slate-400 text-xs hover:text-indigo-600 hover:underline cursor-pointer transition-colors font-medium">
              {t('pricing.deep_dive')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
