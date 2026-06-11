import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLoginForm } from '../hooks/useLoginForm';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { FormInput } from '../components/FormInput';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { GOOGLE_OAUTH_URL } from '../../../constants/auth';

const LoginPage: React.FC = () => {
  const { form, onSubmit, isPending, apiError } = useLoginForm();
  const { register, formState: { errors } } = form;
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  const rightContent = (
    <div className="w-full text-left">
      <div className="mb-8">
        <h1 className="font-semibold text-xl text-on-surface mb-2">Business Login</h1>
        <p className="text-sm text-on-surface-variant">Enter your credentials to access your workspace</p>
      </div>

      {apiError && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium">
          {apiError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <FormInput
          id="email"
          type="email"
          label="Email Address"
          placeholder="name@company.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          registration={register('email')}
        />

        <FormInput
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          error={errors.password?.message}
          registration={register('password')}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-on-surface transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded bg-primary text-on-primary font-semibold text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/60"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface-container-lowest text-on-surface-variant text-xs">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6">
          <GoogleLoginButton onClick={handleGoogleLogin} />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-on-surface-variant font-medium">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-semibold transition-colors">
          Create Account
        </Link>
      </p>
    </div>
  );

  return <AuthPageLayout rightContent={rightContent} />;
};

export default LoginPage;
