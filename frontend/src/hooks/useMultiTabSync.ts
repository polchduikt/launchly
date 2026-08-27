import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToSyncEvents, type SyncMessage } from '../utils/multiTabSync';
import { useAuthStore } from '../store/useAuthStore';
import { useBotStore } from '../store/useBotStore';

export const useMultiTabSync = (): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToSyncEvents((message: SyncMessage) => {
      switch (message.type) {
        case 'AUTH_LOGOUT': {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          useAuthStore.setState({
            accessToken: null,
            refreshToken: null,
            user: null,
          });
          useBotStore.getState().clearBots();
          queryClient.clear();
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/login') &&
            !window.location.pathname.startsWith('/register') &&
            window.location.pathname !== '/'
          ) {
            window.location.href = '/login';
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
