import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import type { LoginRequest, AuthResponse } from '../../types';

export const useLoginMutation = () => {
  const login = useAuthStore((state) => state.login);

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);
    },
  });
};
