"use client";

import { useEffect } from "react";
import { WorkstationShell } from "@/components/layout/WorkstationShell";
import { PanelContainer } from "@/components/layout/PanelContainer";
import { useAIVA } from "@/hooks/useAIVA";
import { MorningBriefingPanel } from "@/components/command-center/MorningBriefing";
import { ClientEvents } from "@/components/command-center/ClientEvents";
import { RecommendedContacts } from "@/components/command-center/RecommendedContacts";
import { TaskListPanel } from "@/components/command-center/TaskList";
import { MarketMoversPanel } from "@/components/command-center/MarketMovers";
import { QuickActions } from "@/components/command-center/QuickActions";
import { TopIdeas } from "@/components/command-center/TopIdeas";

export default function CommandCenterPage() {
  const aiva = useAIVA();

  useEffect(() => {
    aiva.briefing.fetch();
    aiva.events.fetch();
    aiva.recommendedContacts.fetch();
    aiva.tasks.fetch();
    aiva.marketMovers.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkstationShell>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--aiva-text-primary)] tracking-tight">
              Command Center
            </h1>
            <p className="text-sm text-[var(--aiva-text-muted)] mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--aiva-text-faint)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--aiva-accent)] animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Row 1: Morning Briefing (full width) */}
        <PanelContainer
          title="Morning Briefing"
          headerRight={
            <span className="text-[11px] text-[var(--aiva-text-faint)] font-mono">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          }
        >
          <MorningBriefingPanel
            briefing={aiva.briefing.data}
            loading={aiva.briefing.loading}
          />
        </PanelContainer>

        {/* Row 2: Client Events + Recommended Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PanelContainer title="Upcoming Client Events">
            <ClientEvents
              events={aiva.events.data}
              loading={aiva.events.loading}
            />
          </PanelContainer>

          <PanelContainer title="Recommended Contacts">
            <RecommendedContacts
              contacts={aiva.recommendedContacts.data}
              loading={aiva.recommendedContacts.loading}
            />
          </PanelContainer>
        </div>

        {/* Row 3: Top Ideas + Tasks + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <PanelContainer title="Top Ideas" className="lg:col-span-3">
            <TopIdeas />
          </PanelContainer>

          <PanelContainer title="Priority Tasks" className="lg:col-span-3">
            <TaskListPanel
              tasks={aiva.tasks.data}
              loading={aiva.tasks.loading}
            />
          </PanelContainer>

          <PanelContainer title="Market Movers" className="lg:col-span-4">
            <MarketMoversPanel
              movers={aiva.marketMovers.data}
              loading={aiva.marketMovers.loading}
            />
          </PanelContainer>

          <PanelContainer title="Quick Actions" className="lg:col-span-2">
            <QuickActions
              onRefreshBriefing={() => {
                aiva.briefing.fetch();
              }}
            />
          </PanelContainer>
        </div>
      </div>
    </WorkstationShell>
  );
}
