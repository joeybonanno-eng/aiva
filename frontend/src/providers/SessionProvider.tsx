"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiClient } from "@/lib/api-client";
import type { Advisor } from "@/types";

interface SessionContextValue {
  advisor: Advisor | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session from localStorage on mount
  useEffect(() => {
    async function hydrate() {
      const storedToken = apiClient.getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await apiClient.getMe();
        setAdvisor(me);
        setToken(storedToken);
      } catch {
        // Token invalid or expired
        apiClient.clearToken();
      } finally {
        setLoading(false);
      }
    }

    hydrate();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    setToken(response.access_token);
    const me = await apiClient.getMe();
    setAdvisor(me);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const response = await apiClient.register(email, password, fullName);
      setToken(response.access_token);
      const me = await apiClient.getMe();
      setAdvisor(me);
    },
    []
  );

  const logout = useCallback(() => {
    apiClient.clearToken();
    setAdvisor(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{ advisor, token, loading, login, register, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
