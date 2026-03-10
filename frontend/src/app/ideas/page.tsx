"use client";

import { useState, useEffect } from "react";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { ScoreBadge } from "@/components/ideas/ScoreBadge";
import { IdeaDetailModal } from "@/components/ideas/IdeaDetailModal";
import { useAIVA } from "@/hooks/useAIVA";
import type { ClientIdea, IdeaStatus } from "@/types";

const TRIGGER_LABELS: Record<string, string> = {
  portfolio_downgrade: "Portfolio Alert",
  concentrated_position: "Concentration Risk",
  life_event_approaching: "Life Event",
  call_cycle_overdue: "Check-in Overdue",
  market_event: "Market Event",
  portfolio_drift: "Portfolio Drift",
  behavioral_signal: "Behavioral Signal",
};

const TRIGGER_COLORS: Record<string, string> = {
  portfolio_downgrade: "bg-red-500/15 text-red-400",
  concentrated_position: "bg-amber-500/15 text-amber-400",
  life_event_approaching: "bg-blue-500/15 text-blue-400",
  call_cycle_overdue: "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)]",
  market_event: "bg-purple-500/15 text-purple-400",
  portfolio_drift: "bg-amber-500/15 text-amber-400",
  behavioral_signal: "bg-cyan-500/15 text-cyan-400",
};

const STATUS_FILTERS: { label: string; value: IdeaStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Sent", value: "sent" },
  { label: "Dismissed", value: "dismissed" },
];

export default function IdeasPage() {
  const { ideas } = useAIVA();
  const [filter, setFilter] = useState<IdeaStatus | "all">("pending");
  const [selectedIdea, setSelectedIdea] = useState<ClientIdea | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);

  useEffect(() => {
    ideas.list(filter === "all" ? {} : { status: filter });
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    await ideas.generate();
    ideas.list(filter === "all" ? {} : { status: filter });
  };

  const handleSend = async (id: number) => {
    setSendingId(id);
    await ideas.send(id);
    setSendingId(null);
    setSelectedIdea(null);
    ideas.list(filter === "all" ? {} : { status: filter });
  };

  const handleDismiss = async (id: number) => {
    await ideas.dismiss(id);
    setSelectedIdea(null);
    ideas.list(filter === "all" ? {} : { status: filter });
  };

  const handleCustomize = async (
    id: number,
    data: { subject?: string; rendered_content?: string; channel?: string }
  ) => {
    const updated = await ideas.customize(id, data);
    if (updated) setSelectedIdea(updated);
  };

  const ideaList = ideas.listData?.items ?? [];
  const pendingCount = ideaList.filter((i) => i.status === "pending").length;
  const sentToday = ideaList.filter(
    (i) => i.status === "sent" && new Date(i.created_at).toDateString() === new Date().toDateString()
  ).length;
  const avgScore = ideaList.length
    ? Math.round(ideaList.reduce((sum, i) => sum + i.score, 0) / ideaList.length)
    : 0;

  return (
    <WorkstationShell>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--aiva-text-primary)]">
              Actionable Ideas
            </h1>
            <p className="text-sm text-[var(--aiva-text-muted)] mt-1">
              AI-generated outreach recommendations scored by urgency and engagement
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={ideas.generateLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--aiva-accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {ideas.generateLoading ? "Scanning..." : "Generate Ideas"}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", value: pendingCount, color: "text-[var(--aiva-accent)]" },
            { label: "Sent Today", value: sentToday, color: "text-blue-400" },
            { label: "Avg Score", value: avgScore, color: "text-amber-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)]">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filter === f.value
                  ? "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)] border-[var(--aiva-accent)]/30"
                  : "bg-[var(--aiva-surface-elevated)] text-[var(--aiva-text-muted)] border-[var(--aiva-border)] hover:text-[var(--aiva-text-primary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ideas List */}
        {ideas.listLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--aiva-accent)]/30 border-t-[var(--aiva-accent)] rounded-full animate-spin" />
          </div>
        ) : ideaList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--aiva-text-muted)]">No ideas found. Click &quot;Generate Ideas&quot; to scan for triggers.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ideaList.map((idea) => (
              <button
                key={idea.id}
                onClick={() => setSelectedIdea(idea)}
                className="w-full text-left bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-5 py-4 hover:border-[var(--aiva-accent)]/30 hover:bg-[var(--aiva-accent-surface)] transition-all group"
              >
                <div className="flex items-start gap-4">
                  <ScoreBadge score={idea.score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          TRIGGER_COLORS[idea.trigger_type] || "bg-[var(--aiva-surface-hover)] text-[var(--aiva-text-muted)]"
                        }`}
                      >
                        {TRIGGER_LABELS[idea.trigger_type] || idea.trigger_type}
                      </span>
                      <span className="text-[10px] text-[var(--aiva-text-muted)] uppercase tracking-wider">
                        via {idea.channel}
                      </span>
                      {idea.status !== "pending" && (
                        <span
                          className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            idea.status === "sent"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-[var(--aiva-surface-hover)] text-[var(--aiva-text-muted)]"
                          }`}
                        >
                          {idea.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[var(--aiva-text-primary)] truncate">
                      {idea.subject}
                    </p>
                    <p className="text-xs text-[var(--aiva-text-muted)] mt-1 truncate">
                      {idea.client_name} &middot;{" "}
                      {idea.rendered_content.slice(0, 100).replace(/\n/g, " ")}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idea.status === "pending" && (
                      <>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSend(idea.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-[var(--aiva-accent)] text-white rounded-md hover:opacity-90 cursor-pointer"
                        >
                          Send
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(idea.id);
                          }}
                          className="px-3 py-1.5 text-xs text-[var(--aiva-text-muted)] hover:text-red-400 cursor-pointer"
                        >
                          Dismiss
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onSend={handleSend}
          onDismiss={handleDismiss}
          onCustomize={handleCustomize}
          sending={sendingId === selectedIdea.id}
        />
      )}
    </WorkstationShell>
  );
}
