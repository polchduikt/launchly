import { useBotsQuery } from '../bot/useBotsQuery';
import { useAuthStore } from '../../store/useAuthStore';

export const useRequireBots = () => {
  const { data: botsList, isLoading } = useBotsQuery();
  const user = useAuthStore((state) => state.user);

  const isAdminOrManager = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER';

  return {
    isLoading,
    hasBots: isAdminOrManager || (!!botsList && botsList.length > 0)
  };
};
