import { useMutation } from '@tanstack/react-query';
import { logoutApi } from '../api/auth';
import { useAuthStore } from '../../../store/useAuthStore';

export const useLogoutMutation = () => {
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation<void, Error, void>({
    mutationFn: () => logoutApi(refreshToken || ''),
    onSuccess: () => {
      logout();
    },
    onError: () => {
      logout();
    },
  });
};
