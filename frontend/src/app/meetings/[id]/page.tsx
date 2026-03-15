"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { PanelContainer } from "@/components/layout/PanelContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Spinner } from "@/components/shared/Spinner";
import { useAIVA } from "@/hooks/useAIVA";
import { MeetingRecorder } from "@/components/meetings/MeetingRecorder";
import { TranscriptPanel } from "@/components/meetings/TranscriptPanel";
import { MeetingSummary } from "@/components/meetings/MeetingSummary";
import { ActionItems } from "@/components/meetings/ActionItems";
import { FollowUpDraft } from "@/components/meetings/FollowUpDraft";
const statusVariants: Record<string, "emerald" | "red" | "amber" | "blue" | "gray"> = {
  scheduled: "blue",
  recording: "red",
  processing: "amber",
  completed: "emerald",
};

type TabType = "transcript" | "summary" | "actions" | "follow-up";

const POST_RECORDING_TABS: { label: string; value: TabType }[] = [
  { label: "Transcript", value: "transcript" },
  { label: "Summary", value: "summary" },
  { label: "Actions", value: "actions" },
  { label: "Follow-Up", value: "follow-up" },
];

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const aiva = useAIVA();
  const meetingId = Number(params.id);

  const [activeTab, setActiveTab] = useState<TabType>("transcript");
  const [processingInProgress, setProcessingInProgress] = useState(false);

  const fetchMeeting = useCallback(() => {
    if (meetingId) {
      aiva.meetings.get(meetingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  const meeting = aiva.meetings.currentMeeting;

  async function handleStartRecording() {
    if (!meetingId) return;
    await aiva.meetings.startRecording(meetingId);
    fetchMeeting();
  }

  async function handleStopRecording() {
    if (!meetingId) return;
    await aiva.meetings.stopRecording(meetingId);
    fetchMeeting();
  }

  async function handleProcessMeeting() {
    if (!meetingId) return;
    setProcessingInProgress(true);
    await aiva.meetings.process(meetingId);
    setProcessingInProgress(false);
    fetchMeeting();
  }

  async function handleToggleAction(actionId: number, currentStatus: string) {
    if (!meetingId) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await aiva.meetings.updateAction(meetingId, actionId, {
      status: newStatus as "pending" | "completed",
    });
    fetchMeeting();
  }

  if (aiva.meetings.currentLoading) {
    return (
      <WorkstationShell>
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </WorkstationShell>
    );
  }

  if (!meeting) {
    return (
      <WorkstationShell>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-[var(--aiva-text-muted)]">Meeting not found.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/meetings")}
          >
            Back to Meetings
          </Button>
        </div>
      </WorkstationShell>
    );
  }

  const isPostRecording =
    meeting.status === "processing" || meeting.status === "completed";

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Back button + Header */}
        <div>
          <button
            onClick={() => router.push("/meetings")}
            className="flex items-center gap-1 text-sm text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-secondary)] transition-colors mb-3"
          >
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Meetings
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
                  {meeting.title}
                </h1>
                <Badge variant={statusVariants[meeting.status] || "gray"}>
                  {meeting.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Link href={`/clients/${meeting.client_id}`} className="text-sm text-[var(--aiva-text-muted)] hover:text-[var(--aiva-accent)] transition-colors">
                  {meeting.client?.first_name} {meeting.client?.last_name}
                </Link>
                <span className="text-[var(--aiva-border)]">|</span>
                <span className="text-xs text-[var(--aiva-text-muted)] font-mono">
                  {new Date(meeting.started_at).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {meeting.status === "scheduled" && (
                <Button onClick={handleStartRecording}>
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
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                  Start Recording
                </Button>
              )}
              {(meeting.status === "scheduled" ||
                meeting.status === "recording") &&
                meeting.transcript_segments.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleProcessMeeting}
                    disabled={processingInProgress}
                  >
                    {processingInProgress ? (
                      <>
                        <Spinner size="sm" />
                        Processing...
                      </>
                    ) : (
                      "Process Meeting"
                    )}
                  </Button>
                )}
            </div>
          </div>
        </div>

        {/* Recording view */}
        {meeting.status === "recording" && (
          <PanelContainer title="Live Recording">
            <MeetingRecorder
              meetingId={meeting.id}
              onStop={handleStopRecording}
            />
          </PanelContainer>
        )}

        {/* Post-recording view with tabs */}
        {isPostRecording && (
          <>
            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border-subtle)] rounded-lg p-1 w-fit">
              {POST_RECORDING_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
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

            <PanelContainer
              title={
                activeTab === "transcript"
                  ? "Transcript"
                  : activeTab === "summary"
                  ? "Meeting Summary"
                  : activeTab === "actions"
                  ? "Action Items"
                  : "Follow-Up Draft"
              }
              headerRight={
                meeting.status === "processing" ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-amber-400">Processing...</span>
                  </div>
                ) : undefined
              }
            >
              {activeTab === "transcript" && (
                <TranscriptPanel segments={meeting.transcript_segments || []} />
              )}
              {activeTab === "summary" && (
                <MeetingSummary summary={meeting.summary || ""} />
              )}
              {activeTab === "actions" && (
                <ActionItems
                  actions={meeting.action_items || []}
                  onToggle={handleToggleAction}
                />
              )}
              {activeTab === "follow-up" && (
                <FollowUpDraft draft={meeting.follow_up_draft || ""} />
              )}
            </PanelContainer>
          </>
        )}

        {/* Scheduled view — show meeting info */}
        {meeting.status === "scheduled" && (
          <PanelContainer title="Meeting Details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)] block mb-1">
                  Client
                </span>
                <Link href={`/clients/${meeting.client_id}`} className="text-sm text-[var(--aiva-text-secondary)] hover:text-[var(--aiva-accent)] transition-colors">
                  {meeting.client?.first_name} {meeting.client?.last_name}
                </Link>
                <p className="text-xs text-[var(--aiva-text-muted)]">
                  {meeting.client?.company}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)] block mb-1">
                  Meeting Type
                </span>
                <p className="text-sm text-[var(--aiva-text-secondary)]">
                  {meeting.meeting_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)] block mb-1">
                  Scheduled
                </span>
                <p className="text-sm text-[var(--aiva-text-secondary)] font-mono">
                  {new Date(meeting.started_at).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)] block mb-1">
                  Status
                </span>
                <Badge variant={statusVariants[meeting.status] || "gray"}>
                  {meeting.status}
                </Badge>
              </div>
            </div>
          </PanelContainer>
        )}
      </div>
    </WorkstationShell>
  );
}
