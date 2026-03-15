"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { PanelContainer } from "@/components/layout/PanelContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Spinner } from "@/components/shared/Spinner";
import { Modal } from "@/components/shared/Modal";
import { useAIVA } from "@/hooks/useAIVA";
import type { Meeting, MeetingType } from "@/types";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Recording", value: "recording" },
  { label: "Completed", value: "completed" },
];

const statusVariants: Record<string, "emerald" | "red" | "amber" | "blue" | "gray"> = {
  scheduled: "blue",
  recording: "red",
  processing: "amber",
  completed: "emerald",
};

const meetingTypeLabels: Record<string, string> = {
  initial_consultation: "Initial Consultation",
  portfolio_review: "Portfolio Review",
  quarterly_review: "Quarterly Review",
  annual_review: "Annual Review",
  ad_hoc: "Ad Hoc",
  follow_up: "Follow Up",
};

const meetingTypeOptions: { value: MeetingType; label: string }[] = [
  { value: "initial_consultation", label: "Initial Consultation" },
  { value: "portfolio_review", label: "Portfolio Review" },
  { value: "quarterly_review", label: "Quarterly Review" },
  { value: "annual_review", label: "Annual Review" },
  { value: "ad_hoc", label: "Ad Hoc" },
  { value: "follow_up", label: "Follow Up" },
];

export default function MeetingsPage() {
  return (
    <Suspense fallback={<WorkstationShell><div className="flex items-center justify-center py-16"><Spinner size="lg" /></div></WorkstationShell>}>
      <MeetingsContent />
    </Suspense>
  );
}

function MeetingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiva = useAIVA();

  const [activeTab, setActiveTab] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newMeetingType, setNewMeetingType] = useState<MeetingType>("portfolio_review");

  useEffect(() => {
    aiva.meetings.list();
    aiva.clients.list({ limit: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowNewModal(true);
    }
  }, [searchParams]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    if (value === "all") {
      aiva.meetings.list();
    } else {
      aiva.meetings.list({ status: value });
    }
  }

  async function handleCreateMeeting() {
    if (!newClientId || !newTitle.trim()) return;

    const result = await aiva.meetings.create({
      client_id: parseInt(newClientId, 10),
      title: newTitle.trim(),
      meeting_type: newMeetingType,
      started_at: new Date().toISOString(),
    });

    if (result) {
      setShowNewModal(false);
      setNewTitle("");
      setNewClientId("");
      router.push(`/meetings/${result.id}`);
    }
  }

  const meetings: Meeting[] = aiva.meetings.listData?.items || [];

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
              Meetings
            </h1>
            <p className="text-sm text-[var(--aiva-text-muted)] mt-0.5">
              {aiva.meetings.listData?.total ?? 0} total meetings
            </p>
          </div>
          <Button onClick={() => setShowNewModal(true)}>
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Meeting
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border-subtle)] rounded-lg p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.value
                  ? "bg-[var(--aiva-surface-hover)] text-[var(--aiva-accent)]"
                  : "text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-secondary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Meeting list */}
        <PanelContainer title="Meeting List" noPadding>
          {aiva.meetings.listLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : meetings.length === 0 ? (
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <p className="text-sm text-[var(--aiva-text-muted)]">No meetings found.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--aiva-border-subtle)]">
              {meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => router.push(`/meetings/${meeting.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--aiva-surface-hover)]/50 transition-colors text-left"
                >
                  {/* Status indicator */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      meeting.status === "recording"
                        ? "bg-red-400 animate-pulse"
                        : meeting.status === "completed"
                        ? "bg-emerald-400"
                        : meeting.status === "processing"
                        ? "bg-amber-400"
                        : "bg-blue-400"
                    }`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--aiva-text-primary)] truncate">
                        {meeting.title}
                      </span>
                      <Badge variant={statusVariants[meeting.status] || "gray"}>
                        {meeting.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Link href={`/clients/${meeting.client_id}`} onClick={(e) => e.stopPropagation()} className="text-xs text-[var(--aiva-text-muted)] hover:text-[var(--aiva-accent)] transition-colors">
                        {meeting.client?.first_name} {meeting.client?.last_name}
                      </Link>
                      <Badge variant="gray">
                        {meetingTypeLabels[meeting.meeting_type] || meeting.meeting_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Date */}
                  <span className="text-xs text-[var(--aiva-text-muted)] font-mono shrink-0">
                    {new Date(meeting.started_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-[var(--aiva-text-faint)] shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </PanelContainer>
      </div>

      {/* New Meeting Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Meeting"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateMeeting}
              disabled={!newClientId || !newTitle.trim() || aiva.meetings.createLoading}
            >
              {aiva.meetings.createLoading ? (
                <>
                  <Spinner size="sm" />
                  Creating...
                </>
              ) : (
                "Create Meeting"
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
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
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

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Q1 Portfolio Review"
              className="w-full px-4 py-2.5 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-lg text-sm text-[var(--aiva-text-primary)] placeholder-[var(--aiva-text-faint)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30"
            />
          </div>

          {/* Meeting type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)] mb-1.5">
              Meeting Type
            </label>
            <select
              value={newMeetingType}
              onChange={(e) => setNewMeetingType(e.target.value as MeetingType)}
              className="w-full px-4 py-2.5 bg-[var(--aiva-bg)] border border-[var(--aiva-border)] rounded-lg text-sm text-[var(--aiva-text-primary)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30"
            >
              {meetingTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </WorkstationShell>
  );
}
