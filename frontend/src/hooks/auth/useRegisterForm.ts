import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRegisterMutation } from './useRegisterMutation';
import { getRegisterSchema, type RegisterSchemaType } from '../../schemas/auth.schema';
import { useTranslation } from '../../i18n/config';
import { STORAGE_KEYS } from '../../const/constants';
import { ROUTES } from '../../routes/paths';

export type RegisterFields = RegisterSchemaType;

export const useRegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutateAsync: registerMutate, isPending } = useRegisterMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<RegisterFields>({
    resolver: zodResolver(getRegisterSchema(t)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFields) => {
    setApiError(null);
    try {
      await registerMutate({
        name: [data.firstName, data.lastName].filter(Boolean).join(' '),
        email: data.email,
        password: data.password,
        turnstileToken: turnstileToken || undefined,
      });
      const redirectUrl = searchParams.get('redirect') || localStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT_URL);
      if (redirectUrl) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_REDIRECT_URL);
        navigate(redirectUrl, { replace: true });
        return;
      }
      navigate(ROUTES.HOME, { replace: true });
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Email already in use. Please try another one.')
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
