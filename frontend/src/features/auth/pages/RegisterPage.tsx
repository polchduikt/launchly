import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { AuthPageLayout } from '../components/AuthPageLayout';

const RegisterPage: React.FC = () => {
  const { form, onSubmit, isPending, apiError } = useRegisterForm();
  const { register, formState: { errors } } = form;
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google-login/google';
  };

  const rightContent = (
    <div className="w-full text-left">
      <div className="mb-8">
        <h1 className="font-semibold text-xl text-on-surface mb-2">Create Account</h1>
        <p className="text-sm text-on-surface-variant">Register to start configuring telegram bots</p>
      </div>

      {apiError && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium">
          {apiError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-on-surface mb-1.5" htmlFor="name">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <UserIcon size={16} />
            </div>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
              className={`block w-full pl-10 pr-3 py-2.5 border rounded bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm ${
                errors.name ? 'border-red-300' : 'border-outline-variant/60'
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-red-500 text-xs font-medium">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-on-surface mb-1.5" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail size={16} />
            </div>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              {...register('email')}
              className={`block w-full pl-10 pr-3 py-2.5 border rounded bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm ${
                errors.email ? 'border-red-300' : 'border-outline-variant/60'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-red-500 text-xs font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-on-surface mb-1.5" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={16} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`block w-full pl-10 pr-10 py-2.5 border rounded bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm ${
                errors.password ? 'border-red-300' : 'border-outline-variant/60'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-on-surface transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-red-500 text-xs font-medium">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded bg-primary text-on-primary font-semibold text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            'Create Account'
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
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-outline-variant rounded bg-surface text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-on-surface-variant font-medium">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-semibold transition-colors">
          Sign In
        </Link>
      </p>
    </div>
  );

  return <AuthPageLayout rightContent={rightContent} />;
};

export default RegisterPage;
