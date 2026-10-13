import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [stompClient, setStompClient] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (stompClient) {
        stompClient.deactivate();
      }
      setIsConnected(false);
      return;
    }

    const rawApi = import.meta.env.VITE_API_BASE_URL || '';
    const wsUrl = rawApi ? `${rawApi.replace(/\/$/, '')}/ws` : '/ws';
    const socketFactory = () => new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        // Subscribe to user private messages
        client.subscribe(`/topic/messages/${user.id}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            setIncomingMessage(payload);
            window.dispatchEvent(new CustomEvent('unread-updated', { detail: payload }));
          } catch (e) {
            console.error('Error parsing STOMP message', e);
          }
        });

        // Subscribe to global new/updated items
        client.subscribe('/topic/items', (message) => {
          try {
            const payload = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent('items-updated', { detail: payload }));
          } catch (e) {
            console.error('Error parsing items STOMP message', e);
          }
        });

        // Subscribe to match events
        client.subscribe('/topic/matches', (message) => {
          try {
            const payload = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent('matches-updated', { detail: payload }));
          } catch (e) {
            console.error('Error parsing matches STOMP message', e);
          }
        });

        if (user.id) {
          client.subscribe(`/topic/matches/${user.id}`, (message) => {
            try {
              const payload = JSON.parse(message.body);
              window.dispatchEvent(new CustomEvent('matches-updated', { detail: payload }));
            } catch (e) {
              console.error('Error parsing user matches STOMP message', e);
            }
          });
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP broker error:', frame.headers['message']);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [user?.id]);

  return (
    <WebSocketContext.Provider value={{ stompClient, isConnected, incomingMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
