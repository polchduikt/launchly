import React from 'react';
import { Check } from 'lucide-react';
import { LAUNCHLY_PLANS } from '../../../../const/plans';
import { useTranslation } from '../../../../i18n/config';

export interface LandingPricingSectionProps {
  billingCycle: 'monthly' | 'annual';
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  onCtaClick: () => void;
}

export const LandingPricingSection: React.FC<LandingPricingSectionProps> = ({
  billingCycle,
  setBillingCycle,
  onCtaClick,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <section className="py-20 md:py-28 bg-[#F2EBDD]" id="pricing">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12 space-y-4 reveal-blur-in">
            <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl font-black text-[#0A0A0A] uppercase leading-none">
              {t('landing.pricing.title', 'SIMPLE, TRANSPARENT PRICING')}
            </h2>
            <p className="text-base sm:text-lg text-[#0A0A0A] font-bold">
              {t('landing.pricing.subtitle', 'Choose the plan that fits your growth.')}
            </p>

            <div className="inline-flex bg-white border-2 border-[#0A0A0A] p-1 shadow-[4px_4px_0px_#0A0A0A] mt-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-slate-100'
                }`}
              >
                {t('landing.pricing.monthly', 'MONTHLY')}
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-slate-100'
                }`}
              >
                {t('landing.pricing.annual', 'ANNUAL')}{' '}
                <span className="font-bold border-b border-current ml-1">{t('landing.pricing.discount', '-20%')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 items-stretch">
            {LAUNCHLY_PLANS.map((plan, idx) => {
              const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
              const isPro = plan.id === 'pro';

              const planName = t(`landing.plans.${plan.id}.name`, plan.name);
              const planSubtitle = t(`landing.plans.${plan.id}.subtitle`, plan.subtitle);
              const planCta = t(`landing.plans.${plan.id}.cta`, plan.cta);
              const planFeatures = plan.features.map((feat, fIdx) =>
                t(`landing.plans.${plan.id}.f${fIdx + 1}`, feat)
              );

              const delays = ['reveal-delay-100', 'reveal-delay-200', 'reveal-delay-300', 'reveal-delay-400'];

              return (
                <div
                  key={plan.id}
                  className={`border-2 border-[#0A0A0A] p-2.5 sm:p-6 flex flex-col justify-between relative transition-all reveal-brutal-pop ${delays[idx % 4]} ${
                    isPro
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] shadow-[4px_4px_0px_#0A0A0A] sm:shadow-[6px_6px_0px_#0A0A0A] ring-2 ring-indigo-500 lg:-translate-y-2'
                      : 'bg-[#F2EBDD] text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] sm:shadow-[5px_5px_0px_#0A0A0A]'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white px-1.5 py-0.5 sm:px-3 sm:py-1 font-['JetBrains_Mono',monospace] text-[8px] sm:text-[10px] uppercase tracking-wider font-black border-l-2 border-b-2 border-[#0A0A0A]">
                      {t('landing.pricing.popular', 'POPULAR')}
                    </div>
                  )}

                  <div className="space-y-2.5 sm:space-y-5">
                    <div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <h3
                          className={`font-['Anybody',sans-serif] text-sm sm:text-2xl font-black uppercase ${
                            isPro ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'
                          }`}
                        >
                          {planName}
                        </h3>
                        {plan.badge && (
                          <span className="px-1 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[8px] sm:text-[10px] font-bold">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1 min-h-0 sm:min-h-[2.25rem] leading-snug line-clamp-1 ${
                          isPro ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {planSubtitle}
                      </p>
                    </div>

                    <div className="py-1.5 sm:py-2 border-t border-b border-current/20 space-y-0.5 sm:space-y-1">
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-['Anybody',sans-serif] text-xl sm:text-4xl font-black">${price}</span>
                        <span className="font-['JetBrains_Mono',monospace] text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80">
                          {t('landing.pricing.mo', '/mo')}
                        </span>
                      </div>
                      <div className="pt-0.5">
                        <span className="font-['Anybody',sans-serif] text-xs sm:text-lg font-extrabold">
                          {plan.contactsLimit}
                        </span>
                        <span className="text-[9px] sm:text-[11px] font-bold block opacity-70 leading-none mt-0.5">
                          {t('landing.pricing.contacts_label', 'Active Contacts / mo')}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-1 sm:space-y-2">
                      {planFeatures.map((feat) => (
                        <li key={feat} className="flex items-start gap-1 sm:gap-2 text-[9.5px] sm:text-xs font-medium leading-tight">
                          <Check
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5 ${
                              isPro ? 'text-indigo-400' : 'text-[#0A0A0A]'
                            }`}
                          />
                          <span className="line-clamp-2">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 sm:pt-5">
                    <button
                      onClick={onCtaClick}
                      className={`w-full font-['JetBrains_Mono',monospace] text-[9.5px] sm:text-xs font-extrabold uppercase tracking-tight sm:tracking-wider py-2 sm:py-3 px-1 sm:px-4 border-2 transition-all cursor-pointer truncate ${
                        isPro
                          ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD] shadow-[2px_2px_0px_rgba(242,235,221,0.4)] sm:shadow-[3px_3px_0px_rgba(242,235,221,0.4)] hover:bg-white hover:border-white hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                          : 'bg-white text-[#0A0A0A] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] sm:shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                      }`}
                    >
                      {planCta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <div className="w-full bg-[#0A0A0A] h-1" />
    </>
  );
};
