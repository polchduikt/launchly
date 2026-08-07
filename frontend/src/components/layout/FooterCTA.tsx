import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROUTES } from '../../routes/paths';
import { useTranslation } from '../../i18n/config';

export const FooterCTA: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const { t } = useTranslation();

  const handleCta = () => {
    navigate(isAuthenticated ? ROUTES.HOME : ROUTES.REGISTER);
  };

  return (
    <section
      className="w-full pb-0 bg-transparent select-none overflow-hidden"
      data-header-theme="dark"
    >
      <div className="w-full overflow-hidden leading-none -mb-1 relative h-20 sm:h-28 md:h-36 lg:h-44">
        <svg
          className="absolute top-0 left-0 h-full pointer-events-none animate-wave-back"
          style={{ width: '200%' }}
          viewBox="0 0 2880 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 25 C 180 25,180 5,360 5 C 540 5,540 25,720 25 C 900 25,900 45,1080 45 C 1260 45,1260 25,1440 25 C 1620 25,1620 5,1800 5 C 1980 5,1980 25,2160 25 C 2340 25,2340 45,2520 45 C 2700 45,2700 25,2880 25 L 2880 100 L 0 100 Z"
            fill="#0A0A0A"
            fillOpacity="0.4"
          />
        </svg>
        <svg
          className="absolute top-0 left-0 h-full pointer-events-none animate-wave-front"
          style={{ width: '200%' }}
          viewBox="0 0 2880 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 25 C 180 25,180 5,360 5 C 540 5,540 25,720 25 C 900 25,900 45,1080 45 C 1260 45,1260 25,1440 25 C 1620 25,1620 5,1800 5 C 1980 5,1980 25,2160 25 C 2340 25,2340 45,2520 45 C 2700 45,2700 25,2880 25 L 2880 100 L 0 100 Z"
            fill="#0A0A0A"
          />
        </svg>
      </div>

      <div className="bg-[#0A0A0A] text-[#F2EBDD] w-full pt-2 sm:pt-4 pb-16 sm:pb-24 px-6 lg:px-16 text-center">
        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
          <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-[0.95]">
            {t('landing.cta.title', 'Створіть свою першу автоматизацію безкоштовно вже сьогодні')}
          </h2>

          <p className="font-['JetBrains_Mono',monospace] text-xs sm:text-base text-[#F2EBDD]/70 font-bold max-w-2xl mx-auto leading-relaxed">
            {t('landing.cta.subtitle', "Без прив'язки банківської картки. Налаштування займе 3 хвилини.")}
          </p>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleCta}
              className="bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-sm sm:text-base font-black uppercase tracking-wider px-8 sm:px-12 py-3.5 sm:py-4 border-4 border-[#F2EBDD] shadow-[6px_6px_0px_rgba(255,255,255,0.25)] hover:bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center gap-3"
            >
              <span>{t('landing.cta.button', 'Розпочати безкоштовно →')}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
