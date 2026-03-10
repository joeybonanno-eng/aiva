"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { wsClient } from "@/lib/ws-client";
import { useSession } from "@/providers/SessionProvider";
import type { WSMessage } from "@/types";

type MessageHandler = (message: WSMessage) => void;

interface WebSocketContextValue {
  isConnected: boolean;
  addListener: (type: string, handler: MessageHandler) => () => void;
  removeListener: (type: string, handler: MessageHandler) => void;
  send: (message: WSMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token, advisor } = useSession();
  const connectedTokenRef = useRef<string | null>(null);

  // Connect/disconnect based on authentication state
  useEffect(() => {
    if (token && advisor) {
      // Only reconnect if token changed
      if (connectedTokenRef.current !== token) {
        wsClient.disconnect();
        wsClient.connect(token);
        connectedTokenRef.current = token;
      }
    } else {
      wsClient.disconnect();
      connectedTokenRef.current = null;
    }

    return () => {
      wsClient.disconnect();
      connectedTokenRef.current = null;
    };
  }, [token, advisor]);

  const addListener = useCallback(
    (type: string, handler: MessageHandler): (() => void) => {
      return wsClient.onMessage(type, handler);
    },
    []
  );

  const removeListener = useCallback(
    (type: string, handler: MessageHandler) => {
      // Create a temporary unsubscribe by re-subscribing and immediately removing.
      // The primary pattern is to use the unsubscribe function from addListener.
      const typeListeners = (wsClient as unknown as { listeners: Map<string, Set<MessageHandler>> }).listeners;
      if (typeListeners) {
        const set = typeListeners.get(type);
        if (set) {
          set.delete(handler);
        }
      }
    },
    []
  );

  const send = useCallback((message: WSMessage) => {
    wsClient.send(message);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected: wsClient.isConnected,
        addListener,
        removeListener,
        send,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
}
