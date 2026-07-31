import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotsQuery } from '../bot/useBotsQuery';
import { useAuthStore } from '../../store/useAuthStore';

export const useRequireBots = () => {
  const navigate = useNavigate();
  const { data: botsList, isLoading } = useBotsQuery();
  const user = useAuthStore((state) => state.user);

  const isAdminOrManager = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER';

  useEffect(() => {
    if (!isAdminOrManager && !isLoading && (!botsList || botsList.length === 0)) {
      navigate('/connect-bot', { replace: true });
    }
  }, [isLoading, botsList, isAdminOrManager, navigate]);

  return {
    isLoading,
    hasBots: isAdminOrManager || (!!botsList && botsList.length > 0)
  };
};
