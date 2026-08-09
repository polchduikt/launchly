import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation } from './useLoginMutation';
import { ROUTES } from '../../routes/paths';
import { loginSchema } from '../../schemas/auth.schema';
import type { LoginSchemaType } from '../../schemas/auth.schema';

export type LoginFields = LoginSchemaType;

export const useLoginForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutateAsync: loginMutate, isPending } = useLoginMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setApiError(null);
    try {
      const res = await loginMutate(data);
      const redirectUrl = searchParams.get('redirect') || localStorage.getItem('auth_redirect_url');
      if (redirectUrl) {
        localStorage.removeItem('auth_redirect_url');
        navigate(redirectUrl, { replace: true });
        return;
      }
      const role = res?.user?.role;
      const isAdminOrManager = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';

      if (isAdminOrManager) {
        navigate(ROUTES.ADMIN_HOME, { replace: true });
      } else {
        navigate(ROUTES.HOME, { replace: true });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.data?.error === 'ACCOUNT_BLOCKED')) {
        const reason = error.response?.data?.reason || error.response?.data?.message || 'Violation of platform rules';
        localStorage.setItem('launchly_block_reason', reason);
        navigate(ROUTES.BLOCKED, { replace: true });
        return;
      }
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Invalid email or password. Please try again.')
        : (error instanceof Error ? error.message : 'Something went wrong');
      setApiError(msg);
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending,
    apiError,
  };
};
