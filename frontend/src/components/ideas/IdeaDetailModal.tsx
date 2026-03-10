"use client";

import { useState } from "react";
import type { ClientIdea } from "@/types";
import { ScoreBadge } from "./ScoreBadge";

interface IdeaDetailModalProps {
  idea: ClientIdea;
  onClose: () => void;
  onSend: (id: number) => void;
  onDismiss: (id: number) => void;
  onCustomize: (id: number, data: { subject?: string; rendered_content?: string; channel?: string }) => void;
  sending?: boolean;
}

const TRIGGER_LABELS: Record<string, string> = {
  portfolio_downgrade: "Portfolio Alert",
  concentrated_position: "Concentration Risk",
  life_event_approaching: "Life Event",
  call_cycle_overdue: "Check-in Overdue",
  market_event: "Market Event",
  portfolio_drift: "Portfolio Drift",
  behavioral_signal: "Behavioral Signal",
};

const CHANNEL_OPTIONS = ["email", "phone", "text"];

export function IdeaDetailModal({
  idea,
  onClose,
  onSend,
  onDismiss,
  onCustomize,
  sending,
}: IdeaDetailModalProps) {
  const [subject, setSubject] = useState(idea.subject);
  const [content, setContent] = useState(idea.rendered_content);
  const [channel, setChannel] = useState(idea.channel);
  const [edited, setEdited] = useState(false);

  const handleSave = () => {
    if (edited) {
      onCustomize(idea.id, { subject, rendered_content: content, channel });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--aiva-border)]">
          <div className="flex items-center gap-3">
            <ScoreBadge score={idea.score} />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)]">
                {TRIGGER_LABELS[idea.trigger_type] || idea.trigger_type}
              </span>
              <p className="text-sm text-[var(--aiva-text-secondary)]">{idea.client_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-primary)] hover:bg-[var(--aiva-surface-hover)] rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Channel selector */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1 block">
              Channel
            </label>
            <div className="flex gap-2">
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => { setChannel(ch); setEdited(true); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    channel === ch
                      ? "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)] border-[var(--aiva-accent)]/30"
                      : "bg-[var(--aiva-surface-hover)] text-[var(--aiva-text-muted)] border-[var(--aiva-border)] hover:border-[var(--aiva-border)]"
                  }`}
                >
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1 block">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setEdited(true); }}
              className="w-full px-3 py-2 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-md text-sm text-[var(--aiva-text-primary)] focus:border-[var(--aiva-accent)] focus:outline-none transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1 block">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setEdited(true); }}
              rows={12}
              className="w-full px-3 py-2 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-md text-sm text-[var(--aiva-text-primary)] focus:border-[var(--aiva-accent)] focus:outline-none transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--aiva-border)]">
          <button
            onClick={() => onDismiss(idea.id)}
            className="px-4 py-2 text-sm text-[var(--aiva-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            Dismiss
          </button>
          <div className="flex items-center gap-3">
            {edited && (
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-[var(--aiva-accent)] hover:bg-[var(--aiva-accent-surface)] rounded-md transition-colors"
              >
                Save Changes
              </button>
            )}
            <button
              onClick={() => onSend(idea.id)}
              disabled={sending}
              className="px-5 py-2 text-sm font-medium bg-[var(--aiva-accent)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
