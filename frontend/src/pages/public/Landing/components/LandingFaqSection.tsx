import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';

export interface LandingFaqSectionProps {
  onNavigateToFaq: () => void;
}

export const LandingFaqSection: React.FC<LandingFaqSectionProps> = ({ onNavigateToFaq }) => {
  const { t } = useTranslation();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28 px-6 lg:px-12 relative z-10">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-left border-l-8 border-[#0A0A0A] pl-6 reveal-blur-in">
          <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black text-[#0A0A0A] mb-2 uppercase leading-none">
            {t('landing.faq.title', 'Маєте питання?')}
          </h2>
          <p className="text-base sm:text-lg text-[#0A0A0A] font-bold max-w-2xl">
            {t('landing.faq.subtitle', 'Знаходимо відповіді на найпоширеніші запитання наших клієнтів.')}
          </p>
        </div>

        <div className="space-y-3">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => {
            const isOpen = faqOpen === n;
            return (
              <div
                key={n}
                className={`border-4 border-[#0A0A0A] bg-white transition-all ${
                  isOpen ? 'shadow-[6px_6px_0px_#0A0A0A]' : 'shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(isOpen ? null : n)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                >
                  <span className="font-['Anybody',sans-serif] text-base sm:text-lg font-black uppercase text-[#0A0A0A] leading-tight">
                    {t(`landing.faq.q${n}`, '')}
                  </span>
                  <span
                    className={`shrink-0 w-8 h-8 border-2 border-[#0A0A0A] flex items-center justify-center transition-transform duration-200 ${
                      isOpen ? 'bg-[#0A0A0A] rotate-180' : 'bg-white'
                    }`}
                  >
                    <ChevronDown size={16} className={isOpen ? 'text-amber-400' : 'text-[#0A0A0A]'} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t-2 border-[#0A0A0A]/10 pt-4">
                    <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#0A0A0A] font-medium leading-relaxed">
                      {t(`landing.faq.a${n}`, '')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={onNavigateToFaq}
            className="w-full bg-[#0A0A0A] text-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer flex items-center justify-center p-5 sm:p-6"
          >
            <span className="font-['Anybody',sans-serif] text-base sm:text-lg font-black uppercase text-[#F2EBDD]">
              {t('landing.faq.more', 'БІЛЬШЕ')}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
