"use client";

import { useState } from "react";

interface CallCycleSettingsModalProps {
  clientName: string;
  currentDays: number;
  onSave: (days: number) => void;
  onClose: () => void;
}

const CYCLE_OPTIONS = [
  { days: 30, label: "30 Days", description: "High-touch (>$10M AUM)" },
  { days: 60, label: "60 Days", description: "Active management (>$5M)" },
  { days: 90, label: "90 Days", description: "Standard (>$1M)" },
  { days: 180, label: "180 Days", description: "Low-touch (<$1M)" },
];

export function CallCycleSettingsModal({
  clientName,
  currentDays,
  onSave,
  onClose,
}: CallCycleSettingsModalProps) {
  const [selected, setSelected] = useState(currentDays);
  const [custom, setCustom] = useState(
    CYCLE_OPTIONS.some((o) => o.days === currentDays) ? "" : String(currentDays)
  );
  const [useCustom, setUseCustom] = useState(
    !CYCLE_OPTIONS.some((o) => o.days === currentDays)
  );

  const handleSave = () => {
    const days = useCustom ? parseInt(custom, 10) : selected;
    if (days > 0 && days <= 365) {
      onSave(days);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--aiva-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--aiva-text-primary)]">
              Call Cycle Settings
            </h3>
            <p className="text-xs text-[var(--aiva-text-muted)] mt-0.5">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-primary)] hover:bg-[var(--aiva-surface-hover)] rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {CYCLE_OPTIONS.map((option) => (
              <button
                key={option.days}
                onClick={() => {
                  setSelected(option.days);
                  setUseCustom(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-left ${
                  !useCustom && selected === option.days
                    ? "bg-[var(--aiva-accent-surface)] border-[var(--aiva-accent)]/30 text-[var(--aiva-text-primary)]"
                    : "bg-[var(--aiva-bg)] border-[var(--aiva-border)] text-[var(--aiva-text-secondary)] hover:border-[var(--aiva-border)]"
                }`}
              >
                <div>
                  <span className="text-sm font-medium">{option.label}</span>
                  <p className="text-[10px] text-[var(--aiva-text-muted)] mt-0.5">
                    {option.description}
                  </p>
                </div>
                {!useCustom && selected === option.days && (
                  <svg className="w-4 h-4 text-[var(--aiva-accent)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div>
            <button
              onClick={() => setUseCustom(true)}
              className={`text-xs font-medium ${
                useCustom ? "text-[var(--aiva-accent)]" : "text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-primary)]"
              } transition-colors`}
            >
              Custom days
            </button>
            {useCustom && (
              <input
                type="number"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                min={1}
                max={365}
                placeholder="Enter days (1-365)"
                className="mt-2 w-full px-3 py-2 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-md text-sm text-[var(--aiva-text-primary)] focus:border-[var(--aiva-accent)] focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--aiva-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-[var(--aiva-accent)] text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
