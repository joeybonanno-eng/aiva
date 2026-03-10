"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";

interface FollowUpDraftProps {
  draft: string;
}

export function FollowUpDraft({ draft }: FollowUpDraftProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(draft);
  const [copied, setCopied] = useState(false);

  if (!draft) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[var(--aiva-text-muted)]">
          Follow-up draft not available. Process the meeting to generate a draft.
        </p>
      </div>
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(isEditing ? editText : draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <svg
                className="w-3.5 h-3.5 text-[var(--aiva-accent)]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Copied
            </>
          ) : (
            <>
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
              Copy to Clipboard
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (isEditing) {
              setIsEditing(false);
            } else {
              setEditText(draft);
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? "Done" : "Edit"}
        </Button>
      </div>

      {/* Draft content */}
      <Card>
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[300px] bg-transparent text-sm text-[var(--aiva-text-secondary)] leading-relaxed resize-y focus:outline-none"
            spellCheck
          />
        ) : (
          <div className="space-y-3">
            {(isEditing ? editText : draft)
              .split("\n")
              .map((line, idx) => (
                <p
                  key={idx}
                  className="text-sm text-[var(--aiva-text-secondary)] leading-relaxed"
                >
                  {line || "\u00A0"}
                </p>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
