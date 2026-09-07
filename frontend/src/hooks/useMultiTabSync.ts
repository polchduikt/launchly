import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToSyncEvents, type SyncMessage } from '../utils/multiTabSync';
import { useAuthStore } from '../store/useAuthStore';
import { useBotStore } from '../store/useBotStore';
import { STORAGE_KEYS } from '../const/constants';
import { ROUTES, isPublicRoute } from '../routes/paths';

export const useMultiTabSync = (): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToSyncEvents((message: SyncMessage) => {
      switch (message.type) {
        case 'AUTH_LOGOUT': {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          useAuthStore.setState({
            accessToken: null,
            refreshToken: null,
            user: null,
          });
          useBotStore.getState().clearBots();
          queryClient.clear();
          if (
            typeof window !== 'undefined' &&
            !isPublicRoute(window.location.pathname)
          ) {
            window.location.href = ROUTES.LOGIN;
          }
          break;
        }

        case 'AUTH_LOGIN': {
          const payload = message.payload as {
            accessToken: string;
            refreshToken: string;
            user: unknown;
          };
          if (payload?.accessToken) {
            useAuthStore.setState({
              accessToken: payload.accessToken,
              refreshToken: payload.refreshToken,
              user: payload.user as never,
            });
            queryClient.invalidateQueries();
          }
          break;
        }

        case 'BOT_CHANGED': {
          const payload = message.payload as { botId: number | null };
          if (payload && payload.botId !== undefined) {
            useBotStore.setState({ activeBotId: payload.botId });
            queryClient.invalidateQueries({ queryKey: ['bot', payload.botId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          }
          break;
        }

        case 'SYNC_QUERY_INVALIDATE': {
          const payload = message.payload as { queryKey: string[] };
          if (payload?.queryKey) {
            queryClient.invalidateQueries({ queryKey: payload.queryKey });
          }
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
};
