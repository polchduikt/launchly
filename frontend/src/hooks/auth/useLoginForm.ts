import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAdminOrManager, getSafeRedirectUrl } from '../../utils/auth';
import { useLoginMutation } from './useLoginMutation';
import { ROUTES } from '../../routes/paths';
import { getLoginSchema, type LoginSchemaType } from '../../schemas/auth.schema';
import { useTranslation } from '../../i18n/config';
import { STORAGE_KEYS } from '../../const/constants';

export type LoginFields = LoginSchemaType;

export const useLoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutateAsync: loginMutate, isPending } = useLoginMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<LoginFields>({
    resolver: zodResolver(getLoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setApiError(null);
    try {
      const res = await loginMutate({
        ...data,
        turnstileToken: turnstileToken || undefined,
      });
      const rawRedirect = searchParams.get('redirect') || localStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT_URL);
      localStorage.removeItem(STORAGE_KEYS.AUTH_REDIRECT_URL);
      const safeRedirect = getSafeRedirectUrl(rawRedirect);
      if (safeRedirect) {
        navigate(safeRedirect, { replace: true });
        return;
      }
      const role = res?.user?.role;

      if (isAdminOrManager(role)) {
        navigate(ROUTES.ADMIN_HOME, { replace: true });
      } else {
        navigate(ROUTES.HOME, { replace: true });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.data?.error === 'ACCOUNT_BLOCKED')) {
        const reason = error.response?.data?.reason || error.response?.data?.message || 'Violation of platform rules';
        localStorage.setItem(STORAGE_KEYS.BLOCK_REASON, reason);
        navigate(ROUTES.BLOCKED, { replace: true });
        return;
      }
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Invalid email or password. Please try again.')
        : (error instanceof Error ? error.message : 'Something went wrong');
      setApiError(msg);
    }
  };

  const isTurnstileConfigured = Boolean(import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY);
  const isTurnstileReady = !isTurnstileConfigured || Boolean(turnstileToken);

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending,
    apiError,
    turnstileToken,
    setTurnstileToken,
    isTurnstileReady,
  };
};
