"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { PanelContainer } from "@/components/layout/PanelContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Spinner } from "@/components/shared/Spinner";
import { Modal } from "@/components/shared/Modal";
import { useAIVA } from "@/hooks/useAIVA";
import type { MessageTone, MessageChannel, MessageDraft } from "@/types";

const toneOptions: { value: MessageTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "empathetic", label: "Empathetic" },
  { value: "urgent", label: "Urgent" },
];

const channelOptions: { value: MessageChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text" },
];

const toneVariants: Record<string, "emerald" | "blue" | "amber" | "red" | "purple"> = {
  professional: "blue",
  friendly: "emerald",
  formal: "purple",
  empathetic: "amber",
  urgent: "red",
};

const channelVariants: Record<string, "emerald" | "blue" | "cyan"> = {
  email: "blue",
  phone: "emerald",
  text: "cyan",
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<WorkstationShell><div className="flex items-center justify-center py-16"><Spinner size="lg" /></div></WorkstationShell>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const aiva = useAIVA();

  const [showComposer, setShowComposer] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState<MessageTone>("professional");
  const [channel, setChannel] = useState<MessageChannel>("email");
  const [expandedDraftId, setExpandedDraftId] = useState<number | null>(null);

  useEffect(() => {
    aiva.messages.listDrafts();
    aiva.clients.list({ limit: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get("compose") === "true") {
      setShowComposer(true);
      const clientIdParam = searchParams.get("client_id");
      if (clientIdParam) {
        setSelectedClientId(clientIdParam);
      }
    }
  }, [searchParams]);

  async function handleGenerate() {
    if (!selectedClientId || !subject.trim()) return;

    const result = await aiva.messages.createDraft({
      client_id: parseInt(selectedClientId, 10),
      subject: subject.trim(),
      tone,
      channel,
    });

    if (result) {
      setShowComposer(false);
      setSubject("");
      setSelectedClientId("");
      setTone("professional");
      setChannel("email");
      aiva.messages.listDrafts();
    }
  }

  const drafts: MessageDraft[] = aiva.messages.draftsData?.items || [];

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
              Messages
            </h1>
            <p className="text-sm text-[var(--aiva-text-muted)] mt-0.5">
              AI-generated client communications
            </p>
          </div>
          <Button onClick={() => setShowComposer(true)}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Compose
          </Button>
        </div>

        {/* Drafts list */}
        <PanelContainer title="Message Drafts" noPadding>
          {aiva.messages.draftsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="w-10 h-10 text-[var(--aiva-border)] mb-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <p className="text-sm text-[var(--aiva-text-muted)]">No message drafts yet.</p>
              <p className="text-xs text-[var(--aiva-text-faint)] mt-1">
                Click Compose to generate an AI-crafted message.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--aiva-border-subtle)]">
              {drafts.map((draft) => (
                <div key={draft.id} className="px-4 py-3.5">
                  <button
                    onClick={() =>
                      setExpandedDraftId(
                        expandedDraftId === draft.id ? null : draft.id
                      )
                    }
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--aiva-text-primary)] truncate">
                          {draft.subject}
                        </span>
                        <Badge variant={toneVariants[draft.tone] || "gray"}>
                          {draft.tone}
                        </Badge>
                        <Badge variant={channelVariants[draft.channel] || "gray"}>
                          {draft.channel}
                        </Badge>
                        <Badge
                          variant={
                            draft.status === "sent" ? "emerald" : "gray"
                          }
                        >
                          {draft.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--aiva-text-muted)] mt-0.5">
                        Created{" "}
                        {new Date(draft.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-[var(--aiva-text-muted)] transition-transform ${
                        expandedDraftId === draft.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>

                  {expandedDraftId === draft.id && (
                    <div className="mt-3 p-4 bg-[var(--aiva-surface-hover)]/50 rounded-lg border border-[var(--aiva-border)]/50">
                      <div className="space-y-2">
                        {draft.body.split("\n").map((line, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-[var(--aiva-text-secondary)] leading-relaxed"
                          >
                            {line || "\u00A0"}
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--aiva-border)]/50">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(draft.body);
                            } catch {
                              // Clipboard unavailable
                            }
                          }}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                            />
                          </svg>
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </PanelContainer>
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        title="Compose Message"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowComposer(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                !selectedClientId || !subject.trim() || aiva.messages.createLoading
              }
            >
              {aiva.messages.createLoading ? (
                <>
                  <Spinner size="sm" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                  Generate Draft
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Client select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5">
              Client
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-lg text-sm text-[var(--aiva-text-primary)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30"
            >
              <option value="">Select a client...</option>
              {(aiva.clients.listData?.items || []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} — {client.company}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Portfolio update for Q1 2026"
              className="w-full px-4 py-2.5 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-lg text-sm text-[var(--aiva-text-primary)] placeholder-[var(--aiva-text-faint)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30"
            />
          </div>

          {/* Tone selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5">
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTone(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    tone === opt.value
                      ? "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)] border-[var(--aiva-accent)]/30"
                      : "bg-[var(--aiva-surface-hover)] text-[var(--aiva-text-muted)] border-[var(--aiva-border)] hover:border-[var(--aiva-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5">
              Channel
            </label>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setChannel(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    channel === opt.value
                      ? "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)] border-[var(--aiva-accent)]/30"
                      : "bg-[var(--aiva-surface-hover)] text-[var(--aiva-text-muted)] border-[var(--aiva-border)] hover:border-[var(--aiva-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </WorkstationShell>
  );
}
