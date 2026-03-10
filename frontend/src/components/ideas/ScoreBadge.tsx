"use client";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const getColor = () => {
    if (score >= 81) return "bg-red-500/15 text-red-400 border-red-500/30";
    if (score >= 61) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (score >= 31) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-[var(--aiva-surface-hover)] text-[var(--aiva-text-muted)] border-[var(--aiva-border)]";
  };

  const sizeClasses = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 min-w-[28px]"
    : "text-xs px-2 py-1 min-w-[36px]";

  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-md border tabular-nums ${getColor()} ${sizeClasses}`}
    >
      {Math.round(score)}
    </span>
  );
}
