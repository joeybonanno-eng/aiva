"use client";

import { Spinner } from "@/components/shared/Spinner";
import type { TickerQuote } from "@/types";

function formatLargeNumber(n: number | null): string {
  if (n == null) return "--";
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatVolume(v: number | null): string {
  if (v == null) return "--";
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
}

function formatPrice(p: number | null): string {
  if (p == null) return "--";
  return p.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ratingColors: Record<string, string> = {
  Buy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Hold: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Sell: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface TickerTooltipContentProps {
  data: TickerQuote | null;
  loading: boolean;
  error: string | null;
}

export function TickerTooltipContent({
  data,
  loading,
  error,
}: TickerTooltipContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner size="sm" />
        <span className="ml-2 text-xs text-[var(--aiva-text-muted)]">Loading quote...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.change >= 0;

  return (
    <div className="w-72 p-0 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--aiva-text-primary)]">
              {data.symbol}
            </span>
            {data.analyst_rating && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  ratingColors[data.analyst_rating] || ""
                }`}
              >
                {data.analyst_rating}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--aiva-text-muted)] truncate mt-0.5">
            {data.name}
          </p>
        </div>
      </div>

      {/* Price block */}
      <div className="px-3 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold font-mono tabular-nums text-[var(--aiva-text-primary)]">
            ${formatPrice(data.price)}
          </span>
          <span
            className={`text-xs font-mono font-semibold tabular-nums ${
              isPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {data.change.toFixed(2)} ({isPositive ? "+" : ""}
            {data.change_pct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--aiva-border-subtle)] mx-3" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 py-2.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-[var(--aiva-text-faint)]">Day Range</span>
          <span className="font-mono tabular-nums text-[var(--aiva-text-secondary)]">
            {formatPrice(data.day_low)} - {formatPrice(data.day_high)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--aiva-text-faint)]">52W Range</span>
          <span className="font-mono tabular-nums text-[var(--aiva-text-secondary)]">
            {formatPrice(data.year_low)} - {formatPrice(data.year_high)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--aiva-text-faint)]">P/E</span>
          <span className="font-mono tabular-nums text-[var(--aiva-text-secondary)]">
            {data.pe_ratio != null ? data.pe_ratio.toFixed(1) : "--"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--aiva-text-faint)]">Mkt Cap</span>
          <span className="font-mono tabular-nums text-[var(--aiva-text-secondary)]">
            {formatLargeNumber(data.market_cap)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--aiva-text-faint)]">Volume</span>
          <span className="font-mono tabular-nums text-[var(--aiva-text-secondary)]">
            {formatVolume(data.volume)}
          </span>
        </div>
        {data.analyst_target != null && (
          <div className="flex justify-between">
            <span className="text-[var(--aiva-text-faint)]">Target</span>
            <span className="font-mono tabular-nums text-[var(--aiva-text-secondary)]">
              ${formatPrice(data.analyst_target)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--aiva-border-subtle)] px-3 py-1.5">
        <span className="text-[10px] text-[var(--aiva-text-faint)]">
          Cached {new Date(data.cached_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
