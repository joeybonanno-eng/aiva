"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/shared/Badge";
import type { TranscriptSegment } from "@/types";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function TranscriptPanel({ segments }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments.length]);

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[var(--aiva-text-muted)]">No transcript available yet.</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-[500px] overflow-y-auto space-y-3 pr-2"
    >
      {segments.map((segment) => (
        <div key={segment.id} className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <Badge variant="gray" className="font-mono">
              {formatTimestamp(segment.timestamp)}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-[var(--aiva-accent)]">
              {segment.speaker}
            </span>
            <p className="text-sm text-[var(--aiva-text-secondary)] mt-0.5 leading-relaxed">
              {segment.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
