"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import type { WSMessage } from "@/types";

/**
 * Subscribe to WebSocket messages of a specific type.
 *
 * @param type - The message type to subscribe to (e.g., "alert", "transcript_segment")
 * @param handler - Callback invoked when a matching message arrives
 *
 * The handler reference is stable -- if the handler function changes between renders,
 * the latest version will always be called without re-subscribing.
 */
export function useWebSocket(
  type: string,
  handler: (message: WSMessage) => void
): void {
  const { addListener } = useWebSocketContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const stableHandler = (msg: WSMessage) => handlerRef.current(msg);
    const unsubscribe = addListener(type, stableHandler);
    return unsubscribe;
  }, [type, addListener]);
}

/**
 * Subscribe to multiple WebSocket message types at once.
 *
 * @param types - Array of message types to listen for
 * @param handler - Callback invoked with the message and its type
 */
export function useWebSocketMulti(
  types: string[],
  handler: (message: WSMessage) => void
): void {
  const { addListener } = useWebSocketContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const stableHandler = (msg: WSMessage) => handlerRef.current(msg);
    const unsubscribes = types.map((type) => addListener(type, stableHandler));
    return () => unsubscribes.forEach((unsub) => unsub());
    // Stringify types array to avoid re-subscribing on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(types), addListener]);
}

/**
 * Get a stable send function for the WebSocket connection.
 */
export function useWebSocketSend(): (message: WSMessage) => void {
  const { send } = useWebSocketContext();
  return useCallback(
    (message: WSMessage) => {
      send(message);
    },
    [send]
  );
}
