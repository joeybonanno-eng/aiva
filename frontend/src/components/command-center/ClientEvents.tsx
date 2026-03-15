"use client";

import Link from "next/link";
import { Badge } from "@/components/shared/Badge";
import type { DashboardEvent } from "@/types";

interface ClientEventsProps {
  events: DashboardEvent[] | null;
  loading: boolean;
}

const eventTypeVariants: Record<string, "emerald" | "blue" | "amber" | "purple" | "cyan" | "red" | "default"> = {
  meeting: "blue",
  review: "emerald",
  birthday: "purple",
  anniversary: "cyan",
  rebalance: "amber",
  tax: "red",
  compliance: "red",
};

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--aiva-surface-hover)]" />
          <div className="flex-1 space-y-1">
            <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded w-2/3" />
            <div className="h-3 bg-[var(--aiva-surface-hover)] rounded w-1/2" />
          </div>
          <div className="h-5 bg-[var(--aiva-surface-hover)] rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function UrgencyDot({ urgency }: { urgency: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-400",
    medium: "bg-amber-400",
    low: "bg-[var(--aiva-text-muted)]",
  };
  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${colors[urgency] || "bg-[var(--aiva-text-muted)]"}`}
    />
  );
}

export function ClientEvents({ events, loading }: ClientEventsProps) {
  if (loading) {
    return <SkeletonRows />;
  }

  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-[var(--aiva-text-muted)]">No upcoming client events.</p>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event) => {
        const dateStr = new Date(event.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <Link
            key={event.id}
            href={`/clients/${event.client_id}`}
            className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-[var(--aiva-accent-surface)] transition-colors"
          >
            <div className="mt-1.5">
              <UrgencyDot urgency={event.urgency} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--aiva-text-primary)] truncate">
                  {event.client_name}
                </span>
                <Badge
                  variant={eventTypeVariants[event.event_type] || "default"}
                >
                  {event.event_type}
                </Badge>
              </div>
              <p className="text-xs text-[var(--aiva-text-muted)] mt-0.5 truncate">
                {event.description}
              </p>
            </div>
            <span className="text-[11px] text-[var(--aiva-text-muted)] font-mono shrink-0 mt-0.5">
              {dateStr}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
