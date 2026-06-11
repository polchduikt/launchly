import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from './useLoginMutation';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFields = z.infer<typeof loginSchema>;

export const useLoginForm = () => {
  const navigate = useNavigate();
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
      await loginMutate(data);
      navigate('/home', { replace: true });
    } catch (error: unknown) {
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
