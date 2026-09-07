import React from 'react';
import logo from '../../../../assets/images/logo.png';
import type { AuthPageLayoutProps } from '../../../../types';
import { t } from '../../../../i18n/config';

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  leftTitle,
  leftDescription,
  rightContent,
}) => {
  const title = leftTitle || t('auth.hero.title', 'Automate your business workflow with precision.');
  const description = leftDescription || t('auth.hero.description', 'The all-in-one CRM and Telegram Bot builder for modern enterprises.');

  return (
    <div className="relative z-10 w-full max-w-5xl bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex md:w-1/2 p-12 lg:p-16 flex-col justify-center bg-white/35 border-r-2 border-[#0A0A0A] relative">
        <div className="flex items-center mb-8">
          <img src={logo} alt="Launchly Logo" className="h-10 w-auto object-contain" />
        </div>

        <h2 className="font-['Anybody',sans-serif] font-black text-2xl lg:text-3xl text-[#0A0A0A] mb-4 leading-tight uppercase tracking-tight">
          {title}
        </h2>
        
        <p className="text-sm lg:text-base text-[#0A0A0A]/70 font-bold leading-relaxed">
          {description}
        </p>

        <div className="mt-12 flex gap-4">
          <div className="h-1 w-12 bg-[#0A0A0A]"></div>
          <div className="h-1 w-4 bg-emerald-300 border border-[#0A0A0A]"></div>
          <div className="h-1 w-4 bg-amber-300 border border-[#0A0A0A]"></div>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center bg-[#F2EBDD]">
        <div className="block md:hidden mb-6 text-center">
          <img src={logo} alt="Launchly Logo" className="h-9 w-auto object-contain mx-auto mb-2" />
        </div>
        <div className="w-full max-w-[400px]">
          {rightContent}
        </div>
      </div>
    </div>
  );
};
