"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/shared/Badge";
import { TickerSymbol } from "@/components/shared/TickerSymbol";
import type { MorningBriefing as MorningBriefingType } from "@/types";

interface MorningBriefingProps {
  briefing: MorningBriefingType | null;
  loading: boolean;
}

function SkeletonLines() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-[var(--aiva-surface-hover)] rounded w-full" />
      <div className="h-4 bg-[var(--aiva-surface-hover)] rounded w-5/6" />
      <div className="h-4 bg-[var(--aiva-surface-hover)] rounded w-4/6" />
      <div className="mt-6 space-y-2">
        <div className="h-3 bg-[var(--aiva-surface-hover)] rounded w-1/3" />
        <div className="h-8 bg-[var(--aiva-surface-hover)] rounded w-full" />
        <div className="h-8 bg-[var(--aiva-surface-hover)] rounded w-full" />
        <div className="h-8 bg-[var(--aiva-surface-hover)] rounded w-full" />
      </div>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayed(text.slice(0, index + 1));
        index++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="text-sm text-[var(--aiva-text-secondary)] leading-relaxed">
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-4 bg-[var(--aiva-accent)] ml-0.5 animate-pulse align-text-bottom" />
      )}
    </p>
  );
}

const urgencyColors: Record<string, string> = {
  high: "red",
  medium: "amber",
  low: "gray",
};

export function MorningBriefingPanel({
  briefing,
  loading,
}: MorningBriefingProps) {
  if (loading) {
    return <SkeletonLines />;
  }

  if (!briefing) {
    return (
      <p className="text-sm text-[var(--aiva-text-muted)]">
        Unable to load morning briefing. Try refreshing.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* AI Summary */}
      <div className="border-l-2 border-[var(--aiva-accent)] pl-4">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-4 h-4 text-[var(--aiva-accent)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--aiva-accent)]">
            AI Summary
          </span>
        </div>
        <TypewriterText text={briefing.summary} />
      </div>

      {/* Key Events + Market Highlights side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Key Events */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-3">
            Key Events
          </h4>
          <div className="space-y-2">
            {briefing.key_events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-2.5 bg-[var(--aiva-surface-hover)]/50 rounded-lg"
              >
                <Badge
                  variant={
                    (urgencyColors[event.urgency] as "red" | "amber" | "gray") ||
                    "gray"
                  }
                >
                  {event.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--aiva-text-secondary)] font-medium truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-[var(--aiva-text-muted)] mt-0.5 line-clamp-1">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
            {briefing.key_events.length === 0 && (
              <p className="text-xs text-[var(--aiva-text-faint)]">No key events today.</p>
            )}
          </div>
        </div>

        {/* Market Highlights */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-3">
            Market Highlights
          </h4>
          <div className="space-y-2">
            {briefing.market_highlights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[var(--aiva-surface-hover)]/50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TickerSymbol symbol={item.symbol}>
                    <span className="text-xs font-semibold text-[var(--aiva-text-primary)] font-mono">
                      {item.symbol}
                    </span>
                  </TickerSymbol>
                  <span className="text-xs text-[var(--aiva-text-muted)] truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-mono font-medium ${
                      item.change_pct >= 0 ? "text-[var(--aiva-accent)]" : "text-red-400"
                    }`}
                  >
                    {item.change_pct >= 0 ? "+" : ""}
                    {item.change_pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
            {briefing.market_highlights.length === 0 && (
              <p className="text-xs text-[var(--aiva-text-faint)]">
                No market highlights available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
