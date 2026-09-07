import React from 'react';
import { Server, Lock, Shield } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

export const LandingTrustSection: React.FC = () => {
  const { t } = useTranslation();

  const trustItems = [
    {
      icon: <Server className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400" />,
      title: t('landing.trust.uptime_title', '99.9% Uptime SLA'),
      desc: t('landing.trust.uptime_desc', 'Боти працюють цілодобово навіть під час пікових рекламних кампаній'),
      border: 'border-emerald-500/50 hover:border-emerald-400',
    },
    {
      icon: <Lock className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400" />,
      title: t('landing.trust.encryption_title', 'Шифрування AES-256'),
      desc: t('landing.trust.encryption_desc', 'Токени Telegram та ключі Stripe зберігаються у зашифрованому vault'),
      border: 'border-amber-500/50 hover:border-amber-400',
    },
    {
      icon: <Server className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-400" />,
      title: t('landing.trust.backup_title', 'Авто-резервування'),
      desc: t('landing.trust.backup_desc', 'Кожен стан воронки та налаштування бота резервуються щохвилини'),
      border: 'border-indigo-500/50 hover:border-indigo-400',
    },
    {
      icon: <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-rose-400" />,
      title: t('landing.trust.gdpr_title', 'GDPR Compliant'),
      desc: t('landing.trust.gdpr_desc', 'Дані користувачів обробляються відповідно до вимог законодавства ЄС'),
      border: 'border-rose-500/50 hover:border-rose-400',
    },
  ];

  return (
    <section
      id="trust"
      className="py-20 md:py-28 bg-[#0A0A0A] text-[#F2EBDD] border-b-4 border-[#F2EBDD] px-6 lg:px-12 relative z-10"
      data-header-theme="dark"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-left border-l-8 border-[#F2EBDD] pl-6 reveal-blur-in">
          <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black text-white mb-2 uppercase leading-none">
            {t('landing.trust.title', 'Ваш бізнес у надійних руках')}
          </h2>
          <p className="text-base sm:text-lg text-[#F2EBDD]/70 font-bold max-w-2xl">
            {t(
              'landing.trust.subtitle',
              'Ми дбаємо про безперебійну роботу ваших автоматизацій та безпеку даних на рівні Enterprise.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {trustItems.map((item, i) => (
            <div
              key={i}
              className={`bg-white/5 border-2 ${item.border} p-3.5 sm:p-6 space-y-2 sm:space-y-4 hover:-translate-y-1 transition-all reveal-brutal-pop`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/10 border border-white/20 flex items-center justify-center mb-1.5 sm:mb-3">
                {item.icon}
              </div>
              <h3 className="font-['Anybody',sans-serif] text-xs sm:text-lg font-black uppercase text-white leading-tight">
                {item.title}
              </h3>
              <p className="font-['Geist',sans-serif] text-[10px] sm:text-sm text-[#F2EBDD]/60 font-medium leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
