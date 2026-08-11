import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLoginForm } from '../../../hooks/auth/useLoginForm';
import { AuthPageLayout } from './components/AuthPageLayout';
import { FormInput } from './components/FormInput';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { TelegramLoginModal } from './components/TelegramLoginModal';
import { GOOGLE_OAUTH_URL } from '../../../const/auth';
import { t } from '../../../i18n/config';
import { useSEO } from '../../../hooks/useSEO';

const LoginPage: React.FC = () => {
  useSEO({
    title: t('seo.login.title', 'Sign In — Launchly'),
    description: t('seo.login.description', 'Sign in to your Launchly workspace to manage your Telegram bots, automations, CRM, and broadcasts.'),
    canonicalPath: '/login',
    noindex: true,
  });

  const { form, onSubmit, isPending, apiError } = useLoginForm();
  const { register, formState: { errors } } = form;
  const [showPassword, setShowPassword] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const isBlockedError = searchParams.get('error') === 'blocked';
  const displayError = apiError || (isBlockedError ? t('auth.account_blocked_error') : null);

  React.useEffect(() => {
    if (redirectParam) {
      localStorage.setItem('auth_redirect_url', redirectParam);
    }
  }, [redirectParam]);

  const handleGoogleLogin = () => {
    const redirectUrl = redirectParam || localStorage.getItem('auth_redirect_url');
    if (redirectUrl) {
      localStorage.setItem('auth_redirect_url', redirectUrl);
    }
    window.location.href = GOOGLE_OAUTH_URL;
  };

  const rightContent = (
    <div className="w-full text-left">
      <div className="mb-8">
        <h1 className="font-['Anybody',sans-serif] font-black text-xl text-[#0A0A0A] mb-2 uppercase tracking-tight">{t('auth.login.title', 'Business Login')}</h1>
        <p className="text-sm text-[#0A0A0A]/70 font-bold">{t('auth.login.subtitle', 'Enter your credentials to access your workspace')}</p>
      </div>

      {displayError && (
        <div className="mb-6 p-4 rounded-xl border-2 border-[#0A0A0A] bg-rose-200 text-[#0A0A0A] text-sm font-bold">
          {displayError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <FormInput
          id="email"
          type="email"
          label={t('auth.email_label', 'Email Address')}
          placeholder="name@company.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          registration={register('email')}
        />

        <FormInput
          id="password"
          type={showPassword ? 'text' : 'password'}
          label={t('auth.password_label', 'Password')}
          placeholder="********"
          icon={<Lock size={16} />}
          error={errors.password?.message}
          registration={register('password')}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2.5 px-4 border-2 border-[#0A0A0A] rounded-xl bg-[#0A0A0A] text-[#F2EBDD] font-black text-sm hover:bg-[#F2EBDD] hover:text-[#0A0A0A] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer uppercase tracking-wider"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            t('auth.login.submit', 'Sign In')
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-[#0A0A0A]/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#F2EBDD] text-[#0A0A0A]/60 text-xs font-bold">
              {t('auth.or_continue', 'Or continue with')}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <GoogleLoginButton onClick={handleGoogleLogin} />
          <button
            type="button"
            onClick={() => setIsTelegramOpen(true)}
            className="w-full inline-flex justify-center items-center py-2.5 px-4 border-2 border-[#0A0A0A] rounded-xl bg-white text-[#0A0A0A] text-sm font-black hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer"
          >
            <svg className="h-5 w-5 mr-3 fill-blue-500" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.01-.27.01-.12.02-2.03 1.28-5.73 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.08-.49-.83-.27-1.5-.42-1.44-.89.03-.24.37-.49 1.03-.74 4.05-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.22z" />
            </svg>
            Telegram
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-[#0A0A0A]/70 font-bold">
        {t('auth.login.no_account', "Don't have an account?")}{' '}
        <Link
          to={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
          className="text-[#0A0A0A] hover:underline font-black transition-colors"
        >
          {t('auth.register.link', 'Create Account')}
        </Link>
      </p>
      <TelegramLoginModal isOpen={isTelegramOpen} onClose={() => setIsTelegramOpen(false)} />
    </div>
  );

  return <AuthPageLayout rightContent={rightContent} />;
};

export default LoginPage;
