import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotsQuery } from '../../bot/hooks/useBotsQuery';

export const useRequireBots = () => {
  const navigate = useNavigate();
  const { data: botsList, isLoading } = useBotsQuery();

  useEffect(() => {
    if (!isLoading && (!botsList || botsList.length === 0)) {
      navigate('/connect-bot', { replace: true });
    }
  }, [isLoading, botsList, navigate]);

  return { isLoading, hasBots: !!botsList && botsList.length > 0 };
};
