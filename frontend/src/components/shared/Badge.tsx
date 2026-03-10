"use client";

import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "purple"
  | "cyan"
  | "gray";

type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--aiva-surface-hover)]/50 text-[var(--aiva-text-secondary)] border-[var(--aiva-border)]/50",
  success: "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)] border-[var(--aiva-accent)]/30",
  emerald: "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)] border-[var(--aiva-accent)]/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  gray: "bg-[var(--aiva-surface-hover)]/50 text-[var(--aiva-text-secondary)] border-[var(--aiva-border)]/50",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "default",
  size = "sm",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border whitespace-nowrap
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
