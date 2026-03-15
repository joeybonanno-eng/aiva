"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { TickerQuote } from "@/types";

// Module-level client cache: symbol -> { data, fetchedAt }
const cache = new Map<string, { data: TickerQuote; fetchedAt: number }>();
const CACHE_TTL = 60_000; // 1 minute

// Track in-flight requests to deduplicate
const inflight = new Map<string, Promise<TickerQuote>>();

export function useTickerQuote() {
  const [data, setData] = useState<TickerQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (symbol: string) => {
    const key = symbol.toUpperCase();

    // Check client cache
    const cached = cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Deduplicate concurrent requests for the same symbol
      let promise = inflight.get(key);
      if (!promise) {
        promise = apiClient.getTickerQuote(key);
        inflight.set(key, promise);
      }

      const result = await promise;
      cache.set(key, { data: result, fetchedAt: Date.now() });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quote");
      // Fall back to stale cache if available
      const stale = cache.get(key);
      if (stale) setData(stale.data);
    } finally {
      inflight.delete(key);
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, fetch, reset };
}
