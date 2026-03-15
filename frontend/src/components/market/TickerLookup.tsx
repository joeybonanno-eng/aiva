"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTickerQuote } from "@/hooks/useTickerQuote";
import { TickerTooltipContent } from "@/components/shared/TickerTooltip";
import { Spinner } from "@/components/shared/Spinner";
import { apiClient } from "@/lib/api-client";
import type { TickerHolder } from "@/types";

export function TickerLookup() {
  const [input, setInput] = useState("");
  const [searchedSymbol, setSearchedSymbol] = useState<string | null>(null);
  const quote = useTickerQuote();
  const [holders, setHolders] = useState<TickerHolder[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersError, setHoldersError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const symbol = input.trim().toUpperCase();
      if (!symbol) return;

      setSearchedSymbol(symbol);

      // Fetch quote and holders in parallel
      quote.fetch(symbol);

      setHoldersLoading(true);
      setHoldersError(null);
      try {
        const res = await apiClient.getTickerHolders(symbol);
        setHolders(res.holders);
      } catch (err) {
        setHoldersError(
          err instanceof Error ? err.message : "Failed to load holders"
        );
        setHolders([]);
      } finally {
        setHoldersLoading(false);
      }
    },
    [input, quote]
  );

  return (
    <div className="space-y-4">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aiva-text-faint)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Look up a ticker... (e.g. AAPL)'
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--aiva-surface)]/50 border border-[var(--aiva-border)]/50 text-sm text-[var(--aiva-text-primary)] placeholder:text-[var(--aiva-text-faint)] focus:outline-none focus:border-[var(--aiva-accent)]/50 focus:ring-1 focus:ring-[var(--aiva-accent)]/20 font-mono"
        />
      </form>

      {/* Results */}
      {searchedSymbol && (
        <div className="space-y-4">
          {/* Quote section */}
          <div className="rounded-lg border border-[var(--aiva-border-subtle)] bg-[var(--aiva-surface)]/30 overflow-hidden">
            <TickerTooltipContent
              data={quote.data}
              loading={quote.loading}
              error={quote.error}
            />
          </div>

          {/* Client exposure section */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)] mb-2">
              Client Exposure
            </h4>
            {holdersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size="sm" />
                <span className="ml-2 text-xs text-[var(--aiva-text-muted)]">
                  Checking client portfolios...
                </span>
              </div>
            ) : holdersError ? (
              <div className="py-4 text-center">
                <p className="text-xs text-red-400">{holdersError}</p>
              </div>
            ) : holders.length === 0 ? (
              <div className="py-6 text-center rounded-lg border border-[var(--aiva-border-subtle)] border-dashed">
                <p className="text-sm text-[var(--aiva-text-muted)]">
                  No clients hold this position
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--aiva-border-subtle)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--aiva-border-subtle)]">
                      <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                        Client
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                        Value
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                        Allocation
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                        Gain/Loss
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--aiva-border-subtle)]/50">
                    {holders.map((h) => {
                      const isPositive = h.gain_loss_pct >= 0;
                      return (
                        <tr
                          key={h.client_id}
                          className="hover:bg-[var(--aiva-surface-hover)]/30 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <Link
                              href={`/clients/${h.client_id}`}
                              className="text-[var(--aiva-accent)] hover:underline font-medium"
                            >
                              {h.client_name}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--aiva-text-secondary)]">
                            $
                            {h.value.toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[var(--aiva-text-secondary)]">
                            {h.allocation_pct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span
                              className={`font-mono tabular-nums font-semibold ${
                                isPositive
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {h.gain_loss_pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
