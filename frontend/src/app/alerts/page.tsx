"use client";

import { useEffect, useState } from "react";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { PanelContainer } from "@/components/layout/PanelContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Spinner } from "@/components/shared/Spinner";
import { useAIVA } from "@/hooks/useAIVA";
import type { Alert } from "@/types";

const TYPE_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Market", value: "market" },
  { label: "Client", value: "client" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Compliance", value: "compliance" },
  { label: "Opportunity", value: "opportunity" },
];

const SEVERITY_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

const severityBorderColors: Record<string, string> = {
  critical: "border-l-red-400",
  warning: "border-l-amber-400",
  info: "border-l-blue-400",
};

const severityVariants: Record<string, "red" | "amber" | "blue"> = {
  critical: "red",
  warning: "amber",
  info: "blue",
};

const typeVariants: Record<string, "red" | "amber" | "blue" | "emerald" | "purple" | "cyan"> = {
  market: "blue",
  client: "purple",
  portfolio: "emerald",
  compliance: "red",
  opportunity: "cyan",
};

export default function AlertsPage() {
  const aiva = useAIVA();

  const [activeType, setActiveType] = useState("all");
  const [activeSeverity, setActiveSeverity] = useState("all");

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchAlerts() {
    const params: {
      type?: string;
      severity?: string;
      limit?: number;
    } = { limit: 50 };
    if (activeType !== "all") params.type = activeType;
    if (activeSeverity !== "all") params.severity = activeSeverity;
    aiva.alerts.list(params);
  }

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, activeSeverity]);

  async function handleAction(alertId: number, action: string) {
    await aiva.alerts.act(alertId, action);
    fetchAlerts();
  }

  const alerts: Alert[] = aiva.alerts.listData?.items || [];

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
              Alerts
            </h1>
            <p className="text-sm text-[var(--aiva-text-muted)] mt-0.5">
              {aiva.alerts.listData?.total ?? 0} alerts
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Type filter */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)] block mb-1.5">
              Type
            </span>
            <div className="flex items-center gap-1 bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border-subtle)] rounded-lg p-1">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveType(tab.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeType === tab.value
                      ? "bg-[var(--aiva-surface-hover)] text-[var(--aiva-accent)]"
                      : "text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-secondary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity filter */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--aiva-text-faint)] block mb-1.5">
              Severity
            </span>
            <div className="flex items-center gap-1 bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border-subtle)] rounded-lg p-1">
              {SEVERITY_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveSeverity(tab.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeSeverity === tab.value
                      ? "bg-[var(--aiva-surface-hover)] text-[var(--aiva-accent)]"
                      : "text-[var(--aiva-text-muted)] hover:text-[var(--aiva-text-secondary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alert cards */}
        {aiva.alerts.listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : alerts.length === 0 ? (
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
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <p className="text-sm text-[var(--aiva-text-muted)]">No alerts match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  bg-[var(--aiva-surface-elevated)] border border-[var(--aiva-border)] rounded-lg overflow-hidden
                  border-l-4 ${severityBorderColors[alert.severity] || "border-l-gray-600"}
                  ${alert.is_read ? "opacity-60" : ""}
                `}
              >
                <div className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    {/* Severity icon */}
                    <div className="mt-0.5 shrink-0">
                      {alert.severity === "critical" ? (
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                      ) : alert.severity === "warning" ? (
                        <svg
                          className="w-5 h-5 text-amber-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[var(--aiva-text-primary)]">
                          {alert.title}
                        </span>
                        <Badge variant={severityVariants[alert.severity] || "gray"}>
                          {alert.severity}
                        </Badge>
                        <Badge variant={typeVariants[alert.type] || "gray"}>
                          {alert.type}
                        </Badge>
                        {alert.is_read && (
                          <Badge variant="gray">Read</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--aiva-text-muted)] mt-1">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-[var(--aiva-text-faint)] font-mono">
                          {new Date(alert.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!alert.is_read && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(alert.id, "acknowledge")}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(alert.id, "dismiss")}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkstationShell>
  );
}
