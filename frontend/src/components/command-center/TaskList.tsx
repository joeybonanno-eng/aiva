"use client";

import { Badge } from "@/components/shared/Badge";
import type { Task } from "@/types";

interface TaskListProps {
  tasks: Task[] | null;
  loading: boolean;
}

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--aiva-surface-hover)]" />
          <div className="flex-1 space-y-1">
            <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded w-3/4" />
            <div className="h-3 bg-[var(--aiva-surface-hover)] rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const priorityColors: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};

const priorityVariants: Record<string, "red" | "amber" | "emerald"> = {
  high: "red",
  medium: "amber",
  low: "emerald",
};

export function TaskListPanel({ tasks, loading }: TaskListProps) {
  if (loading) {
    return <SkeletonRows />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-sm text-[var(--aiva-text-muted)]">No pending tasks.</p>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  return (
    <div className="space-y-1">
      {sorted.map((task) => {
        const dueDate = new Date(task.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const isOverdue = new Date(task.due_date) < new Date();

        return (
          <div
            key={task.id}
            className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-[var(--aiva-surface-hover)]/50 transition-colors"
          >
            <div className="mt-1.5">
              <span
                className={`block w-2 h-2 rounded-full shrink-0 ${
                  priorityColors[task.priority] || "bg-[var(--aiva-text-muted)]"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--aiva-text-secondary)] truncate">
                {task.title}
              </p>
              {task.client_id && (
                <p className="text-[11px] text-[var(--aiva-text-muted)] mt-0.5">
                  Client task
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={priorityVariants[task.priority] || "gray"}>
                {task.priority}
              </Badge>
              <span
                className={`text-[11px] font-mono ${
                  isOverdue ? "text-red-400" : "text-[var(--aiva-text-muted)]"
                }`}
              >
                {dueDate}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
