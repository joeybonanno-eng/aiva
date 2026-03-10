"use client";

import { useMeetingRecorder } from "@/hooks/useMeetingRecorder";
import { Button } from "@/components/shared/Button";

interface MeetingRecorderProps {
  meetingId: number;
  onStop: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function WaveformBars({ audioLevel }: { audioLevel: number }) {
  const barCount = 24;
  return (
    <div className="flex items-center justify-center gap-0.5 h-12">
      {Array.from({ length: barCount }, (_, i) => {
        const center = barCount / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const baseHeight = Math.max(0.1, 1 - distFromCenter * 0.7);
        const height = Math.max(4, baseHeight * audioLevel * 48 + Math.random() * audioLevel * 12);
        return (
          <div
            key={i}
            className="w-1 rounded-full bg-[var(--aiva-accent)] transition-all duration-75"
            style={{ height: `${Math.min(height, 48)}px`, opacity: 0.4 + audioLevel * 0.6 }}
          />
        );
      })}
    </div>
  );
}

export function MeetingRecorder({ meetingId, onStop }: MeetingRecorderProps) {
  const {
    isRecording,
    segments,
    duration,
    audioLevel,
    startRecording,
    stopRecording,
    error,
  } = useMeetingRecorder();

  function handleStart() {
    startRecording(meetingId);
  }

  function handleStop() {
    stopRecording();
    onStop();
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
        {!isRecording && (
          <Button variant="danger" size="sm" onClick={handleStart} className="mt-3">
            Retry Recording
          </Button>
        )}
      </div>
    );
  }

  if (!isRecording) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
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
        </div>
        <p className="text-sm text-[var(--aiva-text-muted)]">Ready to start recording</p>
        <Button onClick={handleStart}>
          Start Recording
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recording indicator + timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">
              Recording
            </span>
          </span>
        </div>
        <span className="text-2xl font-mono text-[var(--aiva-text-primary)] tabular-nums tracking-wider">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Waveform visualization */}
      <div className="py-2 bg-[var(--aiva-surface-hover)]/50 rounded-lg">
        <WaveformBars audioLevel={audioLevel} />
      </div>

      {/* Live transcript */}
      <div className="border border-[var(--aiva-border)] rounded-lg">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--aiva-border-subtle)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--aiva-accent)] animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--aiva-text-muted)]">
            Live Transcript
          </span>
          <span className="text-[11px] text-[var(--aiva-text-faint)] ml-auto">
            {segments.length} segment{segments.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto p-3 space-y-2">
          {segments.length === 0 ? (
            <p className="text-xs text-[var(--aiva-text-faint)] italic">
              Listening for speech...
            </p>
          ) : (
            segments.map((seg, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className="text-[var(--aiva-accent)] font-medium shrink-0 text-xs mt-0.5">
                  {seg.speaker}:
                </span>
                <span className="text-[var(--aiva-text-secondary)]">{seg.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stop button */}
      <div className="flex justify-center pt-2">
        <Button variant="danger" onClick={handleStop}>
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          Stop Recording
        </Button>
      </div>
    </div>
  );
}
