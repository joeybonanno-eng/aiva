"use client";

import type { ReactNode } from "react";

export interface PanelContainerProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  headerRight?: ReactNode;
  noPadding?: boolean;
  className?: string;
  children: ReactNode;
}

export function PanelContainer({
  title,
  subtitle,
  icon,
  action,
  headerRight,
  noPadding = false,
  className = "",
  children,
}: PanelContainerProps) {
  return (
    <div
      className={`bg-[var(--aiva-surface-elevated)]/50 border border-[var(--aiva-border)]/50 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--aiva-border)]/50">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="shrink-0 text-[var(--aiva-text-muted)]">{icon}</span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--aiva-text-primary)] truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[var(--aiva-text-muted)] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {(action || headerRight) && (
          <div className="shrink-0 ml-4">{headerRight || action}</div>
        )}
      </div>

      {/* Content */}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </div>
  );
}
