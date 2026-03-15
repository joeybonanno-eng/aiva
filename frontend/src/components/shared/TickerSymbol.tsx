"use client";

import { useRef, type ReactNode } from "react";
import {
  useFloating,
  useHover,
  useInteractions,
  useDismiss,
  flip,
  shift,
  offset,
  FloatingPortal,
  safePolygon,
  useTransitionStyles,
} from "@floating-ui/react";
import { useState } from "react";
import { useTickerQuote } from "@/hooks/useTickerQuote";
import { TickerTooltipContent } from "@/components/shared/TickerTooltip";

interface TickerSymbolProps {
  symbol: string;
  children: ReactNode;
}

export function TickerSymbol({ symbol, children }: TickerSymbolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasFetched = useRef(false);
  const { data, loading, error, fetch } = useTickerQuote();

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (open && !hasFetched.current) {
        hasFetched.current = true;
        fetch(symbol);
      }
    },
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    placement: "bottom-start",
  });

  const hover = useHover(context, {
    delay: { open: 400, close: 150 },
    handleClose: safePolygon(),
  });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
  ]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 150,
    initial: { opacity: 0, transform: "scale(0.96)" },
  });

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="cursor-default"
      >
        {children}
      </span>

      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, ...transitionStyles }}
            {...getFloatingProps()}
            className="z-50 bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg shadow-xl shadow-black/30"
          >
            <TickerTooltipContent data={data} loading={loading} error={error} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
