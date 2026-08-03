import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { ROUTES } from '../../routes/paths';
import { useTranslation } from '../../i18n/config';

export const PublicFooter: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] text-[#F2EBDD] w-full py-12 px-6 lg:px-16 border-t-4 border-[#0A0A0A] font-['JetBrains_Mono',monospace] select-none relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex flex-col gap-2">
          <Link to={ROUTES.LANDING} className="flex items-center">
            <img src={logo} alt="Launchly Logo" className="h-9 w-auto object-contain brightness-200 invert" />
          </Link>
          <span className="text-xs text-slate-400 font-medium">
            © {currentYear} {t('landing.footer.copyright', 'Launchly Inc. All rights reserved.')}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link 
            to={ROUTES.TERMS} 
            className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
          >
            {t('landing.footer.terms', 'Terms of Service')}
          </Link>
          <Link 
            to={ROUTES.PRIVACY} 
            className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
          >
            {t('landing.footer.privacy', 'Privacy Policy')}
          </Link>
          <Link 
            to={ROUTES.PAYMENT_TERMS} 
            className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
          >
            {t('landing.footer.payment_terms', 'Payment Terms')}
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link 
            to={ROUTES.BLOG} 
            className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
          >
            {t('landing.footer.blog', 'Blog')}
          </Link>
          <Link 
            to={ROUTES.FAQ} 
            className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
          >
            {t('landing.footer.faq', 'FAQ & Guides')}
          </Link>
          <a 
            href="mailto:support@launchly.app" 
            className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white hover:underline underline-offset-4 transition-all"
          >
            {t('landing.footer.support', 'Support & Contact')}
          </a>
        </div>

      </div>
    </footer>
  );
};
