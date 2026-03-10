"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusTicker } from "@/components/layout/StatusTicker";
import { CommandBar } from "@/components/layout/CommandBar";
import { Spinner } from "@/components/shared/Spinner";

interface WorkstationShellProps {
  children: ReactNode;
}

export function WorkstationShell({ children }: WorkstationShellProps) {
  const { advisor, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !advisor) {
      router.replace("/login");
    }
  }, [loading, advisor, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--aiva-bg)]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[var(--aiva-text-muted)] text-sm tracking-wide uppercase">
            Initializing Workstation...
          </p>
        </div>
      </div>
    );
  }

  if (!advisor) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--aiva-bg)]">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Area: Ticker + Content */}
      <div className="flex flex-col flex-1 ml-64 min-w-0">
        {/* Top Status Ticker */}
        <StatusTicker />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Command Bar Overlay */}
      <CommandBar />

      {/* Floating Command Bar Trigger */}
      <button
        onClick={() => {
          const event = new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          });
          window.dispatchEvent(event);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-primary)] hover:border-[var(--aiva-accent)]/50 hover:bg-[var(--aiva-surface-hover)] transition-all duration-200 shadow-lg shadow-black/20 group"
      >
        <svg
          className="w-4 h-4 text-[var(--aiva-accent)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <span className="text-sm font-medium">Command</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] rounded text-[var(--aiva-text-muted)] group-hover:text-[var(--aiva-text-muted)] group-hover:border-[var(--aiva-text-muted)]">
          {"\u2318"}K
        </kbd>
      </button>
    </div>
  );
}
