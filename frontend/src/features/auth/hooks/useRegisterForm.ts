import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from './useRegisterMutation';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterFields = z.infer<typeof registerSchema>;

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const { mutateAsync: registerMutate, isPending } = useRegisterMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFields) => {
    setApiError(null);
    try {
      await registerMutate(data);
      navigate('/home', { replace: true });
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Email already in use. Please try another one.')
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
