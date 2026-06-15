import React from 'react';
import { Check, X, Loader2, Sparkles, MessageSquare, Bot, Users, CreditCard } from 'lucide-react';
import type { PricingGridProps } from '../types';

export const PricingGrid: React.FC<PricingGridProps> = ({
  plans,
  currentPlanId,
  onUpgrade,
  isUpgradePending,
  upgradingPlanId,
}) => {
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  const getLimitLabel = (limit: number, maxVal: number = 99999) => {
    if (limit >= maxVal) return 'Unlimited';
    return limit.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Available Plans</h3>
        <p className="text-xs text-slate-400">Choose the tier that best matches your business growth needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedPlans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPro = plan.name.toUpperCase() === 'PRO';
          const isFreePlan = plan.name.toUpperCase() === 'FREE';
          const isUpgrading = isUpgradePending && upgradingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between bg-white border rounded-3xl p-6 transition-all duration-300 hover:shadow-lg ${
                isPro
                  ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-md shadow-indigo-100/30'
                  : 'border-slate-200'
              }`}
            >
              {isPro && (
                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1 select-none">
                  <Sparkles size={10} /> Popular
                </span>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-800">{plan.displayName}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      ${plan.price}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/mo</span>
                  </div>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <li className="flex items-center gap-2 text-slate-600">
                    <Bot size={14} className="text-slate-400 shrink-0" />
                    <span>
                      <strong className="font-bold text-slate-800">
                        {getLimitLabel(plan.maxBots, 100)}
                      </strong>{' '}
                      Bots
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <Users size={14} className="text-slate-400 shrink-0" />
                    <span>
                      <strong className="font-bold text-slate-800">
                        {getLimitLabel(plan.maxBotUsers, 100000)}
                      </strong>{' '}
                      Users
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <MessageSquare size={14} className="text-slate-400 shrink-0" />
                    <span>
                      <strong className="font-bold text-slate-800">
                        {getLimitLabel(plan.maxBroadcastsPerMonth, 99999)}
                      </strong>{' '}
                      Broadcasts
                    </span>
                  </li>

                  <li className="pt-2 border-t border-slate-50 flex items-center justify-between text-slate-500">
                    <span>Campaign Broadcasts</span>
                    {plan.canUseBroadcast ? (
                      <Check size={14} className="text-emerald-500 stroke-[3]" />
                    ) : (
                      <X size={14} className="text-slate-300 stroke-[3]" />
                    )}
                  </li>
                  <li className="flex items-center justify-between text-slate-500">
                    <span>Sheets & Webhooks</span>
                    {plan.canUseIntegrations ? (
                      <Check size={14} className="text-emerald-500 stroke-[3]" />
                    ) : (
                      <X size={14} className="text-slate-300 stroke-[3]" />
                    )}
                  </li>
                  <li className="flex items-center justify-between text-slate-500">
                    <span>AI Chat Assistant</span>
                    {plan.canUseAiAgent ? (
                      <Check size={14} className="text-emerald-500 stroke-[3]" />
                    ) : (
                      <X size={14} className="text-slate-300 stroke-[3]" />
                    )}
                  </li>
                  <li className="flex items-center justify-between text-slate-500">
                    <span>CRM Payment Node</span>
                    {plan.canUsePayments ? (
                      <Check size={14} className="text-emerald-500 stroke-[3]" />
                    ) : (
                      <X size={14} className="text-slate-300 stroke-[3]" />
                    )}
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl select-none cursor-not-allowed text-center"
                  >
                    Current Plan
                  </button>
                ) : isFreePlan ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 bg-slate-50 border border-slate-100 text-slate-300 text-xs font-bold rounded-xl select-none cursor-not-allowed text-center"
                  >
                    Included in Cancellation
                  </button>
                ) : (
                  <button
                    onClick={() => onUpgrade(plan.id)}
                    disabled={isUpgradePending}
                    className={`w-full py-2.5 px-4 text-xs font-black rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                      isPro
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                    } disabled:opacity-75 disabled:cursor-not-allowed`}
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={12} />
                        <span>Subscribe</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
