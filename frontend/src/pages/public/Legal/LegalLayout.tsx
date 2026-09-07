import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../routes/paths';
import { useTranslation } from '../../../i18n/config';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import { PublicHeader } from '../../../components/layout/PublicHeader';
import { FooterCTA } from '../../../components/layout/FooterCTA';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  effectiveDate: string;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ children, title, effectiveDate }) => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navItems = [
    { label: t('legal.nav.terms', 'Terms of Service'), path: ROUTES.TERMS },
    { label: t('legal.nav.privacy', 'Privacy Policy'), path: ROUTES.PRIVACY },
    { label: t('legal.nav.acceptable_use', 'Acceptable Use Policy'), path: ROUTES.ACCEPTABLE_USE },
    { label: t('legal.nav.ai_terms', 'AI Supplementary Terms'), path: ROUTES.AI_TERMS },
    { label: t('legal.nav.payment_terms', 'Payment & Merchant Terms'), path: ROUTES.PAYMENT_TERMS },
  ];

  return (
    <div className="min-h-screen bg-[#F2EBDD] text-[#0A0A0A] font-['Geist',sans-serif] antialiased flex flex-col justify-between relative z-0 selection:bg-[#0A0A0A] selection:text-[#F2EBDD]">
      
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none opacity-5"
        style={{
          backgroundColor: '#F2EBDD',
          backgroundImage: `
            linear-gradient(#0A0A0A 1px, transparent 1px),
            linear-gradient(90deg, #0A0A0A 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '-1px -1px'
        }}
      />

      <div>
        <PublicHeader />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 pt-6 sm:pt-14 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
            
            <aside className="lg:col-span-3 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] sm:shadow-[6px_6px_0px_#0A0A0A] p-2.5 sm:p-4 lg:sticky lg:top-28">
              <div className="font-['JetBrains_Mono',monospace] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 sm:mb-3 px-1 sm:px-2 border-b border-[#0A0A0A]/20 pb-1.5 sm:pb-2">
                {t('legal.nav.section_title', 'Legal Documents')}
              </div>
              <nav className="flex flex-wrap lg:flex-col gap-1.5 lg:gap-0 lg:space-y-1.5 font-['JetBrains_Mono',monospace] text-[10.5px] sm:text-xs font-bold uppercase tracking-wider max-w-full">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 border-2 transition-all text-left ${
                        isActive
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] font-black shadow-[2px_2px_0px_#0A0A0A]'
                          : 'border-transparent text-[#0A0A0A] hover:border-[#0A0A0A] hover:bg-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <main className="lg:col-span-9 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] sm:shadow-[8px_8px_0px_#0A0A0A] p-4 sm:p-10 lg:p-12">
              
              <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 mb-4 sm:mb-8 font-['JetBrains_Mono',monospace] text-[10px] sm:text-xs font-bold tracking-widest text-[#0A0A0A] uppercase">
                <span>{t('legal.effective_date', { date: effectiveDate })}</span>
                <span className="bg-[#0A0A0A] text-[#F2EBDD] px-2 py-0.5 text-[9px] sm:text-[10px]">{t('legal.badge', 'LAUNCHLY LEGAL')}</span>
              </div>

              <h1 className="font-['Anybody',sans-serif] text-xl sm:text-4xl lg:text-5xl font-black text-[#0A0A0A] uppercase tracking-tight mb-4 sm:mb-8 leading-tight">
                {title}
              </h1>

              <div className="space-y-4 sm:space-y-6 font-['Geist',sans-serif] text-xs sm:text-base text-[#0A0A0A] leading-relaxed font-medium">
                {children}
              </div>

            </main>

          </div>
        </div>
      </div>

      <FooterCTA />
      <PublicFooter />
    </div>
  );
};

export default LegalLayout;
