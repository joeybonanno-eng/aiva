"use client";

import { useEffect } from "react";
import { useAIVA } from "@/hooks/useAIVA";
import type { CallCycleStatus } from "@/types";

interface CallCycleIndicatorProps {
  clientId: number;
  compact?: boolean;
  onSettingsClick?: () => void;
}

const STATUS_CONFIG: Record<
  CallCycleStatus,
  { label: string; dot: string; text: string }
> = {
  on_track: {
    label: "On Track",
    dot: "bg-[var(--aiva-success)]",
    text: "text-[var(--aiva-success)]",
  },
  due_soon: {
    label: "Due Soon",
    dot: "bg-amber-400",
    text: "text-amber-400",
  },
  overdue: {
    label: "Overdue",
    dot: "bg-red-400",
    text: "text-red-400",
  },
  urgent_override: {
    label: "URGENT",
    dot: "bg-red-500 animate-pulse",
    text: "text-red-400 font-bold",
  },
};

export function CallCycleIndicator({
  clientId,
  compact = false,
  onSettingsClick,
}: CallCycleIndicatorProps) {
  const { callCycles } = useAIVA();

  useEffect(() => {
    callCycles.get(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const cycle = callCycles.data;

  if (callCycles.loading || !cycle || cycle.client_id !== clientId) {
    return compact ? (
      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--aiva-text-muted)]">
        <span className="w-2 h-2 rounded-full bg-[var(--aiva-surface-hover)] animate-pulse" />
      </span>
    ) : null;
  }

  const config = STATUS_CONFIG[cycle.status] || STATUS_CONFIG.on_track;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5" title={`Call cycle: ${cycle.call_cycle_days} days`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`text-[10px] uppercase tracking-wider ${config.text}`}>
          {config.label}
        </span>
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <span className={`text-sm font-medium ${config.text}`}>
            {config.label}
          </span>
        </div>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-1 text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-primary)] hover:bg-[var(--aiva-surface-hover)] rounded transition-colors"
            title="Configure call cycle"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
      <div className="text-xs text-[var(--aiva-text-muted)] space-y-0.5">
        <p>Cycle: Every {cycle.call_cycle_days} days</p>
        {cycle.next_due_at && (
          <p>
            Next due:{" "}
            {new Date(cycle.next_due_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
        {cycle.override_active && cycle.override_reason && (
          <p className="text-red-400 text-[10px] mt-1">
            Override: {cycle.override_reason}
          </p>
        )}
      </div>
    </div>
  );
}
