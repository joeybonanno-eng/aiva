"use client";

import { useEffect, useRef } from "react";
import { useCommandBar } from "@/hooks/useCommandBar";

const categoryColors: Record<string, string> = {
  navigation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  action: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  client: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  search: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const categoryIcons: Record<string, React.ReactNode> = {
  navigation: (
    <svg className="w-4 h-4 text-[var(--aiva-text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  action: (
    <svg className="w-4 h-4 text-[var(--aiva-text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  client: (
    <svg className="w-4 h-4 text-[var(--aiva-text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4 text-[var(--aiva-text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
};

export function CommandBar() {
  const {
    isOpen,
    close,
    query,
    setQuery,
    filteredItems,
    selectedIndex,
    setSelectedIndex,
    executeItem,
    moveUp,
    moveDown,
    executeSelected,
  } = useCommandBar();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the DOM is painted
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveDown();
        break;
      case "ArrowUp":
        e.preventDefault();
        moveUp();
        break;
      case "Enter":
        e.preventDefault();
        executeSelected();
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 animate-fade-in">
        <div className="bg-[var(--aiva-surface-elevated)]/95 backdrop-blur-xl border border-[var(--aiva-border)]/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-[var(--aiva-border)]/50">
            <svg
              className="w-5 h-5 text-[var(--aiva-text-muted)] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 py-4 bg-transparent text-[var(--aiva-text-primary)] placeholder-[var(--aiva-text-muted)] text-sm outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] rounded text-[var(--aiva-text-muted)]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[var(--aiva-text-muted)] text-sm">No results found</p>
                <p className="text-[var(--aiva-text-faint)] text-xs mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  data-index={index}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75
                    ${
                      index === selectedIndex
                        ? "bg-[var(--aiva-accent-surface)] text-[var(--aiva-text-primary)]"
                        : "text-[var(--aiva-text-secondary)] hover:bg-[var(--aiva-surface-hover)]/50"
                    }
                  `}
                >
                  {/* Icon */}
                  <span className="shrink-0">
                    {categoryIcons[item.category] ?? categoryIcons.search}
                  </span>

                  {/* Label + Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-xs text-[var(--aiva-text-muted)] truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Category Badge */}
                  <span
                    className={`
                      shrink-0 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full border
                      ${categoryColors[item.category] ?? "bg-[var(--aiva-text-muted)]/15 text-[var(--aiva-text-muted)] border-[var(--aiva-text-muted)]/30"}
                    `}
                  >
                    {item.category}
                  </span>

                  {/* Enter hint on selected */}
                  {index === selectedIndex && (
                    <kbd className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] rounded text-[var(--aiva-text-muted)]">
                      {"\u21B5"}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--aiva-border)]/50 text-[11px] text-[var(--aiva-text-faint)]">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] rounded text-[var(--aiva-text-muted)]">
                {"\u2191"}
              </kbd>
              <kbd className="px-1 py-0.5 font-mono bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] rounded text-[var(--aiva-text-muted)]">
                {"\u2193"}
              </kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] rounded text-[var(--aiva-text-muted)]">
                {"\u21B5"}
              </kbd>
              <span className="ml-1">Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 font-mono bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] rounded text-[var(--aiva-text-muted)]">
                Esc
              </kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
