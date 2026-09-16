import { useBotsQuery } from '../bot/useBotsQuery';
import { useAuthStore } from '../../store/useAuthStore';
import { isAdminOrManager } from '../../utils/auth';

export const useRequireBots = () => {
  const { data: botsList, isLoading } = useBotsQuery();
  const user = useAuthStore((state) => state.user);

  return {
    isLoading,
    hasBots: isAdminOrManager(user?.role) || (!!botsList && botsList.length > 0)
  };
};
