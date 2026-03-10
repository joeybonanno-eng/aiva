"use client";

import { useEffect } from "react";
import { useAIVA } from "@/hooks/useAIVA";

interface ClientScoreBadgeProps {
  clientId: number;
  compact?: boolean;
}

export function ClientScoreBadge({ clientId, compact = false }: ClientScoreBadgeProps) {
  const { scoring } = useAIVA();

  useEffect(() => {
    scoring.getScore(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const score = scoring.scoreData;

  if (scoring.scoreLoading || !score || score.client_id !== clientId) {
    return compact ? (
      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--aiva-text-muted)]">
        <span className="w-3 h-3 rounded-full bg-[var(--aiva-surface-hover)] animate-pulse" />
      </span>
    ) : null;
  }

  const getScoreColor = (val: number) => {
    if (val >= 75) return "text-red-400";
    if (val >= 50) return "text-amber-400";
    if (val >= 25) return "text-[var(--aiva-accent)]";
    return "text-[var(--aiva-text-muted)]";
  };

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${getScoreColor(score.composite_score)}`}
        title={`Engagement: ${score.engagement_score} | Urgency: ${score.urgency_score} | Revenue: ${score.revenue_score} | Risk: ${score.risk_score}`}
      >
        {Math.round(score.composite_score)}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)]">
          Composite Score
        </span>
        <span className={`text-lg font-bold tabular-nums ${getScoreColor(score.composite_score)}`}>
          {Math.round(score.composite_score)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Engagement", value: score.engagement_score },
          { label: "Urgency", value: score.urgency_score },
          { label: "Revenue", value: score.revenue_score },
          { label: "Risk", value: score.risk_score },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--aiva-text-muted)]">{item.label}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1.5 bg-[var(--aiva-surface-hover)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.value >= 75
                      ? "bg-red-400"
                      : item.value >= 50
                      ? "bg-amber-400"
                      : "bg-[var(--aiva-accent)]"
                  }`}
                  style={{ width: `${Math.min(100, item.value)}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-[var(--aiva-text-secondary)] w-5 text-right">
                {Math.round(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
