import { useMutation } from '@tanstack/react-query';
import { registerApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import type { RegisterRequest, AuthResponse } from '../../types';

export const useRegisterMutation = () => {
  const login = useAuthStore((state) => state.login);

  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: registerApi,
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);
    },
  });
};
