"use client";

import Link from "next/link";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";

interface RecommendedContact {
  client_id: number;
  client_name: string;
  reason: string;
  last_contact: string;
  priority: string;
}

interface RecommendedContactsProps {
  contacts: RecommendedContact[] | null;
  loading: boolean;
}

const priorityVariants: Record<string, "red" | "amber" | "emerald" | "gray"> = {
  high: "red",
  medium: "amber",
  low: "emerald",
};

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <div className="h-3.5 bg-[var(--aiva-surface-hover)] rounded w-1/2" />
            <div className="h-3 bg-[var(--aiva-surface-hover)] rounded w-3/4" />
          </div>
          <div className="h-7 bg-[var(--aiva-surface-hover)] rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function daysSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function RecommendedContacts({
  contacts,
  loading,
}: RecommendedContactsProps) {
  if (loading) {
    return <SkeletonRows />;
  }

  if (!contacts || contacts.length === 0) {
    return (
      <p className="text-sm text-[var(--aiva-text-muted)]">No recommended contacts today.</p>
    );
  }

  return (
    <div className="space-y-1">
      {contacts.map((contact) => (
        <div
          key={contact.client_id}
          className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[var(--aiva-surface-hover)]/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/clients/${contact.client_id}`}
                className="text-sm font-medium text-[var(--aiva-accent)] hover:text-[var(--aiva-accent-hover)] transition-colors truncate"
              >
                {contact.client_name}
              </Link>
              <Badge
                variant={priorityVariants[contact.priority] || "gray"}
              >
                {contact.priority}
              </Badge>
            </div>
            <p className="text-xs text-[var(--aiva-text-muted)] mt-0.5 truncate">
              {contact.reason}
            </p>
            <p className="text-[11px] text-[var(--aiva-text-faint)] mt-0.5">
              Last contact: {daysSince(contact.last_contact)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.href = `/messages?compose=true&client_id=${contact.client_id}`;
            }}
          >
            Contact
          </Button>
        </div>
      ))}
    </div>
  );
}
