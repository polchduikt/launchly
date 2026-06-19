import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';

export const useCrmWebSocket = (botId: number) => {
  const queryClient = useQueryClient();
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!botId || botId <= 0) return;

    const socket = new SockJS('/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
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

    client.onStompError = (frame) => {
      console.error('STOMP Error: ' + frame.headers['message']);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [botId, queryClient]);
};
