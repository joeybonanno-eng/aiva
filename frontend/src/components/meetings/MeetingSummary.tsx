"use client";

interface MeetingSummaryProps {
  summary: string;
}

export function MeetingSummary({ summary }: MeetingSummaryProps) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[var(--aiva-text-muted)]">
          Summary not available. Process the meeting to generate a summary.
        </p>
      </div>
    );
  }

  const paragraphs = summary.split("\n").filter((p) => p.trim());

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <div className="space-y-4">
        {paragraphs.map((paragraph, idx) => {
          const trimmed = paragraph.trim();

          if (trimmed.startsWith("# ")) {
            return (
              <h2
                key={idx}
                className="text-lg font-semibold text-[var(--aiva-text-primary)] border-b border-[var(--aiva-border-subtle)] pb-2"
              >
                {trimmed.replace(/^# /, "")}
              </h2>
            );
          }

          if (trimmed.startsWith("## ")) {
            return (
              <h3
                key={idx}
                className="text-base font-semibold text-[var(--aiva-text-secondary)] mt-4"
              >
                {trimmed.replace(/^## /, "")}
              </h3>
            );
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={idx} className="flex gap-2 pl-2">
                <span className="text-[var(--aiva-accent)] shrink-0 mt-0.5">
                  {"\u2022"}
                </span>
                <p className="text-sm text-[var(--aiva-text-secondary)] leading-relaxed">
                  {trimmed.replace(/^[-*] /, "")}
                </p>
              </div>
            );
          }

          if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
            return (
              <p
                key={idx}
                className="text-sm font-semibold text-[var(--aiva-text-secondary)] leading-relaxed"
              >
                {trimmed.replace(/\*\*/g, "")}
              </p>
            );
          }

          return (
            <p key={idx} className="text-sm text-[var(--aiva-text-secondary)] leading-relaxed">
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
}
