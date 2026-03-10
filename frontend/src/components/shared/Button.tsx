"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "@/components/shared/Spinner";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--aiva-accent)] text-[var(--aiva-text-primary)] hover:bg-[var(--aiva-accent-hover)] active:bg-[var(--aiva-accent)] border-[var(--aiva-accent)] hover:border-[var(--aiva-accent-hover)] shadow-sm shadow-emerald-500/20",
  secondary:
    "bg-[var(--aiva-surface-hover)] text-[var(--aiva-text-secondary)] hover:bg-[var(--aiva-surface-hover)] active:bg-gray-750 border-[var(--aiva-border)] hover:border-[var(--aiva-border)]",
  danger:
    "bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 border-red-500/30 hover:border-red-500/50",
  ghost:
    "bg-transparent text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-primary)] hover:bg-[var(--aiva-surface-hover)]/50 active:bg-[var(--aiva-surface-hover)] border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-sm gap-2.5",
};

const spinnerSizes: Record<ButtonSize, "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "sm",
  lg: "md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-150
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Spinner size={spinnerSizes[size]} />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);
