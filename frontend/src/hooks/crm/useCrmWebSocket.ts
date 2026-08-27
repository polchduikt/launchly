import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStore } from '../../store/useNetworkStore';

export const useCrmWebSocket = (botId: number) => {
  const queryClient = useQueryClient();
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!botId || botId <= 0) return;

    const socket = new SockJS('/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      connectionTimeout: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onWebSocketClose: () => {
        useNetworkStore.getState().setWebSocketStatus('reconnecting');
      },
      onWebSocketError: () => {
        useNetworkStore.getState().setWebSocketStatus('reconnecting');
      },
      onStompError: () => {
        useNetworkStore.getState().setWebSocketStatus('reconnecting');
      },
      onDisconnect: () => {
        useNetworkStore.getState().setWebSocketStatus('disconnected');
      },
    });

    client.onConnect = () => {
      useNetworkStore.getState().setWebSocketStatus('connected');

      client.subscribe(`/topic/crm/${botId}/messages`, (msg) => {
        try {
          const body = JSON.parse(msg.body);
          if (body.conversationId) {
            queryClient.invalidateQueries({ queryKey: ['messages', body.conversationId] });
          }
          queryClient.invalidateQueries({ queryKey: ['conversations', botId] });
        } catch (e) {
          console.error('Failed to parse websocket message', e);
        }
      });

      client.subscribe(`/topic/crm/${botId}/leads`, () => {
        queryClient.invalidateQueries({ queryKey: ['leads', botId] });
      });

      client.subscribe(`/topic/crm/${botId}/orders`, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', botId] });
      });
    };

    useNetworkStore.getState().setWebSocketStatus('connecting');
    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      useNetworkStore.getState().setWebSocketStatus('disconnected');
    };
  }, [botId, queryClient]);
};
