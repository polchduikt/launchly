import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from './useRegisterMutation';
import { registerSchema } from '../../schemas/auth.schema';
import type { RegisterSchemaType } from '../../schemas/auth.schema';

export type RegisterFields = RegisterSchemaType;

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const { mutateAsync: registerMutate, isPending } = useRegisterMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
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
      });
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
