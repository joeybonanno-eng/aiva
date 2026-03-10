"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";

export function AIVAProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <WebSocketProvider>{children}</WebSocketProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
