"use client";

import { useEffect } from "react";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { PanelContainer } from "@/components/layout/PanelContainer";
import { Spinner } from "@/components/shared/Spinner";
import { useAIVA } from "@/hooks/useAIVA";
import { TickerSymbol } from "@/components/shared/TickerSymbol";
import { TickerLookup } from "@/components/market/TickerLookup";
import type { MarketMover } from "@/types";

interface SectorData {
  name: string;
  change_pct: number;
}

const SECTOR_DATA: SectorData[] = [
  { name: "Technology", change_pct: 1.24 },
  { name: "Healthcare", change_pct: 0.67 },
  { name: "Financials", change_pct: 0.89 },
  { name: "Consumer Disc.", change_pct: -0.34 },
  { name: "Energy", change_pct: -1.12 },
  { name: "Industrials", change_pct: 0.45 },
  { name: "Materials", change_pct: -0.21 },
  { name: "Real Estate", change_pct: -0.78 },
  { name: "Utilities", change_pct: 0.12 },
  { name: "Comm. Services", change_pct: 0.93 },
  { name: "Consumer Staples", change_pct: 0.31 },
];

function getSectorColor(change: number): string {
  if (change >= 1.0) return "bg-emerald-500";
  if (change >= 0.5) return "bg-emerald-600";
  if (change >= 0.0) return "bg-emerald-800";
  if (change >= -0.5) return "bg-red-800";
  if (change >= -1.0) return "bg-red-600";
  return "bg-red-500";
}

function getSectorTextColor(change: number): string {
  if (Math.abs(change) >= 0.5) return "text-[var(--aiva-text-primary)]";
  return "text-[var(--aiva-text-secondary)]";
}

export default function MarketPage() {
  const aiva = useAIVA();

  useEffect(() => {
    aiva.marketMovers.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movers: MarketMover[] = aiva.marketMovers.data || [];

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
              Market Intelligence
            </h1>
            <p className="text-sm text-[var(--aiva-text-muted)] mt-0.5">
              Real-time market data and sector performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--aiva-text-faint)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--aiva-accent)] animate-pulse" />
              Market Open
            </span>
          </div>
        </div>

        {/* Ticker Lookup */}
        <PanelContainer title="Ticker Lookup">
          <TickerLookup />
        </PanelContainer>

        {/* Market Movers — full table */}
        <PanelContainer title="Market Movers" noPadding>
          {aiva.marketMovers.loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : movers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-[var(--aiva-text-muted)]">No market data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--aiva-border-subtle)]">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Symbol
                    </th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Name
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Price
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Change
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Volume
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--aiva-border-subtle)]/50">
                  {movers.map((mover) => {
                    const isPositive = mover.change_pct >= 0;
                    return (
                      <tr
                        key={mover.symbol}
                        className="hover:bg-[var(--aiva-surface-hover)]/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[var(--aiva-text-primary)]">
                          <TickerSymbol symbol={mover.symbol}>
                            {mover.symbol}
                          </TickerSymbol>
                        </td>
                        <td className="px-4 py-3 text-[var(--aiva-text-muted)]">
                          {mover.name}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--aiva-text-secondary)] font-mono tabular-nums">
                          $
                          {mover.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-mono tabular-nums font-semibold ${
                              isPositive ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {isPositive ? (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                              </svg>
                            )}
                            {isPositive ? "+" : ""}
                            {mover.change_pct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--aiva-text-muted)] font-mono tabular-nums text-xs">
                          {(mover.volume / 1_000_000).toFixed(1)}M
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PanelContainer>

        {/* Sector Performance Heat Map */}
        <PanelContainer title="Sector Performance">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {SECTOR_DATA.map((sector) => {
              const isPositive = sector.change_pct >= 0;
              return (
                <div
                  key={sector.name}
                  className={`
                    rounded-lg p-3 flex flex-col items-center justify-center
                    transition-all hover:scale-105 cursor-default
                    ${getSectorColor(sector.change_pct)}
                  `}
                >
                  <span
                    className={`text-xs font-medium text-center ${getSectorTextColor(
                      sector.change_pct
                    )}`}
                  >
                    {sector.name}
                  </span>
                  <span
                    className={`text-sm font-bold font-mono tabular-nums mt-1 ${getSectorTextColor(
                      sector.change_pct
                    )}`}
                  >
                    {isPositive ? "+" : ""}
                    {sector.change_pct.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[var(--aiva-border-subtle)]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-[10px] text-[var(--aiva-text-muted)]">{"\u003C"} -1%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-600" />
              <span className="text-[10px] text-[var(--aiva-text-muted)]">-1% to -0.5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-800" />
              <span className="text-[10px] text-[var(--aiva-text-muted)]">-0.5% to 0%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-800" />
              <span className="text-[10px] text-[var(--aiva-text-muted)]">0% to +0.5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-600" />
              <span className="text-[10px] text-[var(--aiva-text-muted)]">+0.5% to +1%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-[10px] text-[var(--aiva-text-muted)]">{"\u003E"} +1%</span>
            </div>
          </div>
        </PanelContainer>
      </div>
    </WorkstationShell>
  );
}
