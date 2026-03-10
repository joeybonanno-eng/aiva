"use client";

import { Badge } from "@/components/shared/Badge";
import type { MeetingAction } from "@/types";

interface ActionItemsProps {
  actions: MeetingAction[];
  onToggle: (actionId: number, currentStatus: string) => void;
}

const priorityVariants: Record<string, "red" | "amber" | "emerald"> = {
  high: "red",
  medium: "amber",
  low: "emerald",
};

export function ActionItems({ actions, onToggle }: ActionItemsProps) {
  if (actions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[var(--aiva-text-muted)]">
          No action items. Process the meeting to generate action items.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => {
        const isCompleted = action.status === "completed";
        const dueDate = new Date(action.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const isOverdue =
          !isCompleted && new Date(action.due_date) < new Date();

        return (
          <div
            key={action.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              isCompleted
                ? "bg-[var(--aiva-surface-hover)]/30 border-[var(--aiva-border-subtle)]"
                : "bg-[var(--aiva-surface-hover)]/50 border-[var(--aiva-border)] hover:border-[var(--aiva-border)]"
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => onToggle(action.id, action.status)}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                isCompleted
                  ? "bg-[var(--aiva-accent-surface)] border-[var(--aiva-accent)] text-[var(--aiva-accent)]"
                  : "border-[var(--aiva-border)] hover:border-[var(--aiva-accent)]"
              }`}
            >
              {isCompleted && (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  isCompleted
                    ? "text-[var(--aiva-text-muted)] line-through"
                    : "text-[var(--aiva-text-secondary)]"
                }`}
              >
                {action.description}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge variant={priorityVariants[action.priority] || "gray"}>
                  {action.priority}
                </Badge>
                <span className="text-[11px] text-[var(--aiva-text-muted)]">
                  {action.assignee}
                </span>
                <span
                  className={`text-[11px] font-mono ${
                    isOverdue ? "text-red-400" : "text-[var(--aiva-text-muted)]"
                  }`}
                >
                  Due: {dueDate}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
