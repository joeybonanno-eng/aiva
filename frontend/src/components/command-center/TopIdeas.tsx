"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ScoreBadge } from "@/components/ideas/ScoreBadge";
import { useAIVA } from "@/hooks/useAIVA";

const TRIGGER_LABELS: Record<string, string> = {
  portfolio_downgrade: "Portfolio",
  concentrated_position: "Concentration",
  life_event_approaching: "Life Event",
  call_cycle_overdue: "Check-in",
  market_event: "Market",
  portfolio_drift: "Drift",
  behavioral_signal: "Behavioral",
};

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-6 bg-[var(--aiva-surface-hover)] rounded" />
          <div className="flex-1 space-y-1">
            <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded w-3/4" />
            <div className="h-3 bg-[var(--aiva-surface-hover)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopIdeas() {
  const { ideas } = useAIVA();

  useEffect(() => {
    ideas.list({ status: "pending", limit: 5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topIdeas = ideas.listData?.items ?? [];

  if (ideas.listLoading) {
    return <SkeletonRows />;
  }

  if (topIdeas.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--aiva-text-muted)]">No pending ideas.</p>
        <Link
          href="/ideas"
          className="text-xs text-[var(--aiva-accent)] hover:underline mt-1 inline-block"
        >
          Generate ideas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {topIdeas.map((idea) => (
        <Link
          key={idea.id}
          href="/ideas"
          className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[var(--aiva-accent-surface)] transition-colors"
        >
          <ScoreBadge score={idea.score} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--aiva-text-primary)] truncate">
              <Link href={`/clients/${idea.client_id}`} onClick={(e) => e.stopPropagation()} className="hover:text-[var(--aiva-accent)] transition-colors">
                {idea.client_name}
              </Link>
            </p>
            <p className="text-[10px] text-[var(--aiva-text-muted)] truncate">
              {TRIGGER_LABELS[idea.trigger_type] || idea.trigger_type}:{" "}
              {idea.subject}
            </p>
          </div>
        </Link>
      ))}
      {ideas.listData && ideas.listData.total > 5 && (
        <Link
          href="/ideas"
          className="block text-center text-xs text-[var(--aiva-accent)] hover:underline pt-2"
        >
          View all {ideas.listData.total} ideas
        </Link>
      )}
    </div>
  );
}
