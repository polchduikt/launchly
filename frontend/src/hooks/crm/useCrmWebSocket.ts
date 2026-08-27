import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStore } from '../../store/useNetworkStore';

export const useCrmWebSocket = (botId: number) => {
  const queryClient = useQueryClient();
  const stompClientRef = useRef<Client | null>(null);
  const isIntentionalDisconnectRef = useRef(false);

  useEffect(() => {
    if (!botId || botId <= 0) return;

    isIntentionalDisconnectRef.current = false;
    const socket = new SockJS('/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      connectionTimeout: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onWebSocketClose: () => {
        if (!isIntentionalDisconnectRef.current) {
          useNetworkStore.getState().setWebSocketStatus('reconnecting');
        }
      },
      onWebSocketError: () => {
        if (!isIntentionalDisconnectRef.current) {
          useNetworkStore.getState().setWebSocketStatus('reconnecting');
        }
      },
      onStompError: () => {
        if (!isIntentionalDisconnectRef.current) {
          useNetworkStore.getState().setWebSocketStatus('reconnecting');
        }
      },
      onDisconnect: () => {
        if (!isIntentionalDisconnectRef.current) {
          useNetworkStore.getState().setWebSocketStatus('reconnecting');
        }
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
      isIntentionalDisconnectRef.current = true;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      useNetworkStore.getState().setWebSocketStatus('disconnected');
    };
  }, [botId, queryClient]);
};
