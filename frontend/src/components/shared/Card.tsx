"use client";

import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: ReactNode;
  className?: string;
}

export function Card({
  hover = false,
  onClick,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[var(--aiva-surface-elevated)]/50 border border-[var(--aiva-border)]/50 rounded-lg p-4 transition-all duration-150
        ${hover ? "hover:border-[var(--aiva-border)] hover:bg-[var(--aiva-surface-elevated)]/70" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
