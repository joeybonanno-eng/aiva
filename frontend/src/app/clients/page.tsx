"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { Badge } from "@/components/shared/Badge";
import { Spinner } from "@/components/shared/Spinner";
import { Card } from "@/components/shared/Card";
import { useAIVA } from "@/hooks/useAIVA";
import { apiClient } from "@/lib/api-client";
import { ScoreBadge } from "@/components/ideas/ScoreBadge";
import type { Client, RiskProfile, ClientStatus, ClientScore } from "@/types";

const riskVariants: Record<RiskProfile, "emerald" | "blue" | "amber" | "red"> = {
  conservative: "blue",
  moderate: "emerald",
  aggressive: "amber",
  very_aggressive: "red",
};

const statusVariants: Record<ClientStatus, "emerald" | "blue" | "amber" | "gray"> = {
  active: "emerald",
  prospect: "blue",
  inactive: "amber",
  churned: "gray",
};

function formatAUM(aum: number): string {
  if (aum >= 1_000_000_000) {
    return `$${(aum / 1_000_000_000).toFixed(1)}B`;
  }
  if (aum >= 1_000_000) {
    return `$${(aum / 1_000_000).toFixed(1)}M`;
  }
  if (aum >= 1_000) {
    return `$${(aum / 1_000).toFixed(0)}K`;
  }
  return `$${aum.toFixed(0)}`;
}

export default function ClientsPage() {
  const router = useRouter();
  const aiva = useAIVA();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "aum" | "score">("name");
  const [scoreMap, setScoreMap] = useState<Record<number, number>>({});

  useEffect(() => {
    aiva.clients.list({ limit: 100 });
    // Fetch score leaderboard for display
    apiClient.getScoreLeaderboard(100).then((data) => {
      const map: Record<number, number> = {};
      for (const entry of data.items) {
        map[entry.client_id] = entry.composite_score;
      }
      setScoreMap(map);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clients: Client[] = aiva.clients.listData?.items || [];

  const filteredClients = useMemo(() => {
    let result = clients;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sortBy === "aum") {
      result = [...result].sort((a, b) => b.aum - a.aum);
    } else if (sortBy === "score") {
      result = [...result].sort((a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0));
    } else {
      result = [...result].sort((a, b) => a.last_name.localeCompare(b.last_name));
    }
    return result;
  }, [clients, debouncedSearch, sortBy, scoreMap]);

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
              Clients
            </h1>
            <p className="text-sm text-[var(--aiva-text-muted)] mt-0.5">
              {aiva.clients.listData?.total ?? 0} total clients
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--aiva-text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name or company..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg text-sm text-[var(--aiva-text-primary)] placeholder-[var(--aiva-text-faint)] focus:outline-none focus:border-[var(--aiva-accent)] focus:ring-1 focus:ring-[var(--aiva-accent)]/30 transition-colors"
          />
        </div>

        {/* Sort options */}
        <div className="flex gap-2">
          {(["name", "aum", "score"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                sortBy === s
                  ? "bg-[var(--aiva-accent-surface)] text-[var(--aiva-accent)] border-[var(--aiva-accent)]/30"
                  : "bg-[var(--aiva-surface-elevated)] text-[var(--aiva-text-muted)] border-[var(--aiva-border)] hover:text-[var(--aiva-text-primary)]"
              }`}
            >
              Sort by {s === "aum" ? "AUM" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Client grid */}
        {aiva.clients.listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <p className="text-sm text-[var(--aiva-text-muted)]">
              {debouncedSearch ? "No clients match your search." : "No clients found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                hover
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <div className="space-y-3">
                  {/* Name + initials */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] flex items-center justify-center text-sm font-semibold text-[var(--aiva-accent)] shrink-0">
                      {client.first_name[0]}
                      {client.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--aiva-text-primary)] truncate">
                        {client.first_name} {client.last_name}
                      </p>
                      <p className="text-xs text-[var(--aiva-text-muted)] truncate">
                        {client.title} at {client.company}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                          AUM
                        </span>
                        <p className="text-sm font-semibold text-[var(--aiva-text-primary)] font-mono">
                          {formatAUM(client.aum)}
                        </p>
                      </div>
                      {scoreMap[client.id] !== undefined && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                            Score
                          </span>
                          <div className="mt-0.5">
                            <ScoreBadge score={scoreMap[client.id]} size="sm" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={riskVariants[client.risk_profile]}>
                        {client.risk_profile.replace("_", " ")}
                      </Badge>
                      <Badge variant={statusVariants[client.status]}>
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </WorkstationShell>
  );
}
