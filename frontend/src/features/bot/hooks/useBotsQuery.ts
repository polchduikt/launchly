import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBotStore } from '../../../store/useBotStore';
import { getBotsApi } from '../api/bot';

export const useBotsQuery = (enabled: boolean = true) => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);

  const query = useQuery({
    queryKey: ['bots'],
    queryFn: getBotsApi,
    enabled,
  });

  useEffect(() => {
    if (query.data) {
      const bots = query.data;
      if (bots.length === 0) {
        if (activeBotId !== null) {
          setActiveBotId(null);
        }
      } else if (activeBotId === null || !bots.some((b) => b.id === activeBotId)) {
        setActiveBotId(bots[0].id);
      }
    }
  }, [query.data, activeBotId, setActiveBotId]);

  return query;
};
