"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { PanelContainer } from "@/components/layout/PanelContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Spinner } from "@/components/shared/Spinner";
import { useAIVA } from "@/hooks/useAIVA";
import { apiClient } from "@/lib/api-client";
import { ClientScoreBadge } from "@/components/clients/ClientScoreBadge";
import { CallCycleIndicator } from "@/components/clients/CallCycleIndicator";
import { CallCycleSettingsModal } from "@/components/clients/CallCycleSettingsModal";
import { TickerSymbol } from "@/components/shared/TickerSymbol";
import type {
  ClientPortfolio,
  LifeEvent,
  CommunicationLog,
  RiskProfile,
  ClientStatus,
} from "@/types";

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
  if (aum >= 1_000_000_000) return `$${(aum / 1_000_000_000).toFixed(2)}B`;
  if (aum >= 1_000_000) return `$${(aum / 1_000_000).toFixed(2)}M`;
  if (aum >= 1_000) return `$${(aum / 1_000).toFixed(0)}K`;
  return `$${aum.toFixed(0)}`;
}

function formatCurrency(val: number): string {
  return val.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const channelIcons: Record<string, React.ReactNode> = {
  email: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  phone: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  meeting: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  text: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
};

const eventTypeIcons: Record<string, string> = {
  birthday: "🎂",
  marriage: "💍",
  retirement: "🏖",
  new_job: "💼",
  new_child: "👶",
  inheritance: "📜",
  divorce: "📋",
  health: "🏥",
  relocation: "🏠",
  education: "🎓",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const aiva = useAIVA();
  const clientId = Number(params.id);

  const [portfolio, setPortfolio] = useState<ClientPortfolio[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingComms, setLoadingComms] = useState(true);
  const [showCycleSettings, setShowCycleSettings] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    aiva.clients.get(clientId);
    aiva.clients.getInsights(clientId);

    // Fetch additional client data
    async function fetchPortfolio() {
      try {
        const data = await apiClient.getClientPortfolio(clientId);
        setPortfolio(data);
      } catch {
        setPortfolio([]);
      } finally {
        setLoadingPortfolio(false);
      }
    }

    async function fetchLifeEvents() {
      try {
        const data = await apiClient.getClientLifeEvents(clientId);
        setLifeEvents(data);
      } catch {
        setLifeEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    }

    async function fetchCommunications() {
      try {
        const data = await apiClient.getClientCommunications(clientId);
        setCommunications(data);
      } catch {
        setCommunications([]);
      } finally {
        setLoadingComms(false);
      }
    }

    fetchPortfolio();
    fetchLifeEvents();
    fetchCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const client = aiva.clients.current;

  if (aiva.clients.currentLoading) {
    return (
      <WorkstationShell>
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </WorkstationShell>
    );
  }

  if (!client) {
    return (
      <WorkstationShell>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-[var(--aiva-text-muted)]">Client not found.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/clients")}
          >
            Back to Clients
          </Button>
        </div>
      </WorkstationShell>
    );
  }

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Back + Header */}
        <div>
          <button
            onClick={() => router.push("/clients")}
            className="flex items-center gap-1 text-sm text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-secondary)] transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Clients
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] flex items-center justify-center text-lg font-bold text-[var(--aiva-accent)]">
                {client.first_name[0]}
                {client.last_name[0]}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-sm text-[var(--aiva-text-muted)]">
                  {client.title} at {client.company}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(`/messages?compose=true&client_id=${client.id}`)
                }
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Message
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  router.push(`/meetings?new=true&client_id=${client.id}`)
                }
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
              AUM
            </span>
            <p className="text-lg font-bold text-[var(--aiva-text-primary)] font-mono mt-0.5">
              {formatAUM(client.aum)}
            </p>
          </div>
          <div className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
              Risk Profile
            </span>
            <div className="mt-1">
              <Badge variant={riskVariants[client.risk_profile]}>
                {client.risk_profile.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <div className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
              Status
            </span>
            <div className="mt-1">
              <Badge variant={statusVariants[client.status]}>
                {client.status}
              </Badge>
            </div>
          </div>
          <div className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
              Client Since
            </span>
            <p className="text-sm text-[var(--aiva-text-secondary)] mt-1 font-mono">
              {new Date(client.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
              Engagement Score
            </span>
            <div className="mt-1">
              <ClientScoreBadge clientId={clientId} />
            </div>
          </div>
          <div className="bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
              Call Cycle
            </span>
            <div className="mt-1">
              <CallCycleIndicator
                clientId={clientId}
                onSettingsClick={() => setShowCycleSettings(true)}
              />
            </div>
          </div>
        </div>

        {/* Section 1: Portfolio Summary */}
        <PanelContainer title="Portfolio Summary" noPadding>
          {loadingPortfolio ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : portfolio.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--aiva-text-muted)]">No portfolio holdings found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--aiva-border-subtle)]">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Ticker
                    </th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Name
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Value
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Allocation
                    </th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)]">
                      Gain/Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--aiva-border-subtle)]/50">
                  {portfolio.map((holding) => (
                    <tr
                      key={holding.id}
                      className="hover:bg-[var(--aiva-surface-hover)]/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono font-semibold text-[var(--aiva-text-primary)]">
                        <TickerSymbol symbol={holding.ticker}>
                          {holding.ticker}
                        </TickerSymbol>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--aiva-text-muted)]">
                        {holding.name}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--aiva-text-secondary)] font-mono tabular-nums">
                        {formatCurrency(holding.value)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--aiva-text-muted)] font-mono tabular-nums">
                        {holding.allocation_pct.toFixed(1)}%
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono tabular-nums font-medium ${
                          holding.gain_loss_pct >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {holding.gain_loss_pct >= 0 ? "+" : ""}
                        {holding.gain_loss_pct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelContainer>

        {/* Section 2 + 3: Life Events + Communications side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Life Events */}
          <PanelContainer title="Life Events">
            {loadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : lifeEvents.length === 0 ? (
              <p className="text-sm text-[var(--aiva-text-muted)]">No life events recorded.</p>
            ) : (
              <div className="space-y-3">
                {lifeEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 bg-[var(--aiva-surface-hover)]/40 rounded-lg"
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {eventTypeIcons[event.event_type] || "📌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--aiva-text-secondary)]">
                          {event.title}
                        </span>
                        <Badge
                          variant={
                            event.impact === "high"
                              ? "red"
                              : event.impact === "medium"
                              ? "amber"
                              : "gray"
                          }
                        >
                          {event.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--aiva-text-muted)] mt-0.5">
                        {event.description}
                      </p>
                      <span className="text-[11px] text-[var(--aiva-text-faint)] font-mono mt-1 block">
                        {new Date(event.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelContainer>

          {/* Communication History */}
          <PanelContainer title="Communication History">
            {loadingComms ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : communications.length === 0 ? (
              <p className="text-sm text-[var(--aiva-text-muted)]">
                No communications recorded.
              </p>
            ) : (
              <div className="space-y-1">
                {communications.map((comm) => (
                  <div
                    key={comm.id}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[var(--aiva-surface-hover)]/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--aiva-surface-hover)] border border-[var(--aiva-border)] flex items-center justify-center text-[var(--aiva-text-muted)] shrink-0">
                      {channelIcons[comm.channel] || channelIcons.email}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--aiva-text-secondary)] truncate">
                          {comm.subject}
                        </span>
                        <Badge variant={comm.direction === "outbound" ? "emerald" : "blue"}>
                          {comm.direction}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[var(--aiva-text-faint)] font-mono">
                        {new Date(comm.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelContainer>
        </div>
      </div>

      {/* Call Cycle Settings Modal */}
      {showCycleSettings && (
        <CallCycleSettingsModal
          clientName={`${client.first_name} ${client.last_name}`}
          currentDays={aiva.callCycles.data?.call_cycle_days ?? 90}
          onSave={async (days) => {
            await aiva.callCycles.set(clientId, days);
            setShowCycleSettings(false);
          }}
          onClose={() => setShowCycleSettings(false)}
        />
      )}
    </WorkstationShell>
  );
}
