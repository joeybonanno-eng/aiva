"use client";

import type { MarketMover } from "@/types";
import { TickerSymbol } from "@/components/shared/TickerSymbol";

interface MarketMoversProps {
  movers: MarketMover[] | null;
  loading: boolean;
}

function SkeletonRows() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded w-12" />
          <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded flex-1" />
          <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded w-16" />
          <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded w-14" />
        </div>
      ))}
    </div>
  );
}

export function MarketMoversPanel({ movers, loading }: MarketMoversProps) {
  if (loading) {
    return <SkeletonRows />;
  }

  if (!movers || movers.length === 0) {
    return (
      <p className="text-sm text-[var(--aiva-text-muted)]">No market data available.</p>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-2 pb-2 mb-1 border-b border-[var(--aiva-border-subtle)] text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
        <span className="w-14">Symbol</span>
        <span className="flex-1">Name</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-16 text-right">Change</span>
      </div>

      {/* Data rows */}
      <div className="space-y-0">
        {movers.map((mover) => {
          const isPositive = mover.change_pct >= 0;
          return (
            <div
              key={mover.symbol}
              className="flex items-center gap-2 py-2 px-1 rounded hover:bg-[var(--aiva-surface-hover)]/50 transition-colors font-mono text-xs"
            >
              <TickerSymbol symbol={mover.symbol}>
                <span className="w-14 text-[var(--aiva-text-primary)] font-semibold shrink-0">
                  {mover.symbol}
                </span>
              </TickerSymbol>
              <span className="flex-1 text-[var(--aiva-text-muted)] truncate font-sans text-xs">
                {mover.name}
              </span>
              <span className="w-20 text-right text-[var(--aiva-text-secondary)] tabular-nums">
                {mover.price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`w-16 text-right tabular-nums font-medium ${
                  isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPositive ? "\u25B2" : "\u25BC"}{" "}
                {isPositive ? "+" : ""}
                {mover.change_pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
