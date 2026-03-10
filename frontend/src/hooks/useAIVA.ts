"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type {
  MorningBriefing,
  DashboardEvent,
  Task,
  MarketMover,
  Meeting,
  Client,
  ClientInsights,
  Alert,
  MessageDraft,
  MeetingType,
  ActionStatus,
  MessageTone,
  MessageChannel,
  ClientIdea,
  ClientScore,
  ClientCallCycle,
} from "@/types";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): {
  execute: (...args: TArgs) => Promise<TResult | null>;
  data: TResult | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
} {
  const [state, setState] = useState<AsyncState<TResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await action(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { execute, ...state, reset };
}

/**
 * Core AIVA interaction hook.
 * Wraps all API calls with loading/error state management.
 */
export function useAIVA() {
  // ─── Briefing ────────────────────────────────────────

  const briefing = useAsyncAction(
    useCallback(() => apiClient.getMorningBriefing(), [])
  );

  // ─── Dashboard ───────────────────────────────────────

  const events = useAsyncAction(
    useCallback(() => apiClient.getEvents(), [])
  );

  const recommendedContacts = useAsyncAction(
    useCallback(() => apiClient.getRecommendedContacts(), [])
  );

  const tasks = useAsyncAction(
    useCallback(() => apiClient.getTasks(), [])
  );

  const marketMovers = useAsyncAction(
    useCallback(() => apiClient.getMarketMovers(), [])
  );

  // ─── Meetings ────────────────────────────────────────

  const createMeeting = useAsyncAction(
    useCallback(
      (data: {
        client_id: number;
        title: string;
        meeting_type: MeetingType;
        started_at: string;
      }) => apiClient.createMeeting(data),
      []
    )
  );

  const listMeetings = useAsyncAction(
    useCallback(
      (params?: {
        status?: string;
        client_id?: number;
        limit?: number;
        offset?: number;
      }) => apiClient.listMeetings(params),
      []
    )
  );

  const getMeeting = useAsyncAction(
    useCallback((id: number) => apiClient.getMeeting(id), [])
  );

  const startRecording = useAsyncAction(
    useCallback((meetingId: number) => apiClient.startRecording(meetingId), [])
  );

  const stopRecording = useAsyncAction(
    useCallback((meetingId: number) => apiClient.stopRecording(meetingId), [])
  );

  const processMeeting = useAsyncAction(
    useCallback((meetingId: number) => apiClient.processMeeting(meetingId), [])
  );

  const updateAction = useAsyncAction(
    useCallback(
      (
        meetingId: number,
        actionId: number,
        data: {
          status?: ActionStatus;
          description?: string;
          due_date?: string;
        }
      ) => apiClient.updateAction(meetingId, actionId, data),
      []
    )
  );

  // ─── Clients ─────────────────────────────────────────

  const listClients = useAsyncAction(
    useCallback(
      (params?: {
        status?: string;
        search?: string;
        limit?: number;
        offset?: number;
      }) => apiClient.listClients(params),
      []
    )
  );

  const getClient = useAsyncAction(
    useCallback((id: number) => apiClient.getClient(id), [])
  );

  const getClientInsights = useAsyncAction(
    useCallback(
      (clientId: number) => apiClient.getClientInsights(clientId),
      []
    )
  );

  // ─── Alerts ──────────────────────────────────────────

  const listAlerts = useAsyncAction(
    useCallback(
      (params?: {
        type?: string;
        severity?: string;
        is_read?: boolean;
        limit?: number;
        offset?: number;
      }) => apiClient.listAlerts(params),
      []
    )
  );

  const actOnAlert = useAsyncAction(
    useCallback(
      (alertId: number, action: string) =>
        apiClient.actOnAlert(alertId, action),
      []
    )
  );

  // ─── Messages ────────────────────────────────────────

  const createDraft = useAsyncAction(
    useCallback(
      (data: {
        client_id: number;
        subject: string;
        body?: string;
        tone: MessageTone;
        channel: MessageChannel;
      }) => apiClient.createDraft(data),
      []
    )
  );

  const listDrafts = useAsyncAction(
    useCallback(
      (params?: {
        client_id?: number;
        status?: string;
        limit?: number;
        offset?: number;
      }) => apiClient.listDrafts(params),
      []
    )
  );

  // ─── Ideas ─────────────────────────────────────────────

  const listIdeas = useAsyncAction(
    useCallback(
      (params?: { status?: string; limit?: number; offset?: number }) =>
        apiClient.listIdeas(params),
      []
    )
  );

  const getIdea = useAsyncAction(
    useCallback((id: number) => apiClient.getIdea(id), [])
  );

  const sendIdea = useAsyncAction(
    useCallback((id: number) => apiClient.sendIdea(id), [])
  );

  const dismissIdea = useAsyncAction(
    useCallback((id: number) => apiClient.dismissIdea(id), [])
  );

  const customizeIdea = useAsyncAction(
    useCallback(
      (id: number, data: { subject?: string; rendered_content?: string; channel?: string }) =>
        apiClient.customizeIdea(id, data),
      []
    )
  );

  const generateIdeas = useAsyncAction(
    useCallback(() => apiClient.generateIdeas(), [])
  );

  // ─── Scoring ───────────────────────────────────────────

  const getClientScore = useAsyncAction(
    useCallback((clientId: number) => apiClient.getClientScore(clientId), [])
  );

  const refreshScores = useAsyncAction(
    useCallback(() => apiClient.refreshScores(), [])
  );

  const getScoreLeaderboard = useAsyncAction(
    useCallback((limit?: number) => apiClient.getScoreLeaderboard(limit), [])
  );

  // ─── Call Cycles ───────────────────────────────────────

  const getClientCallCycle = useAsyncAction(
    useCallback((clientId: number) => apiClient.getClientCallCycle(clientId), [])
  );

  const setClientCallCycle = useAsyncAction(
    useCallback(
      (clientId: number, days: number) => apiClient.setClientCallCycle(clientId, days),
      []
    )
  );

  const listCallCycles = useAsyncAction(
    useCallback(
      (params?: { status?: string }) => apiClient.listCallCycles(params),
      []
    )
  );

  return {
    // Briefing
    briefing: {
      fetch: briefing.execute as () => Promise<MorningBriefing | null>,
      data: briefing.data as MorningBriefing | null,
      loading: briefing.loading,
      error: briefing.error,
    },

    // Dashboard
    events: {
      fetch: events.execute as () => Promise<DashboardEvent[] | null>,
      data: events.data as DashboardEvent[] | null,
      loading: events.loading,
      error: events.error,
    },
    recommendedContacts: {
      fetch: recommendedContacts.execute,
      data: recommendedContacts.data,
      loading: recommendedContacts.loading,
      error: recommendedContacts.error,
    },
    tasks: {
      fetch: tasks.execute as () => Promise<Task[] | null>,
      data: tasks.data as Task[] | null,
      loading: tasks.loading,
      error: tasks.error,
    },
    marketMovers: {
      fetch: marketMovers.execute as () => Promise<MarketMover[] | null>,
      data: marketMovers.data as MarketMover[] | null,
      loading: marketMovers.loading,
      error: marketMovers.error,
    },

    // Meetings
    meetings: {
      create: createMeeting.execute,
      list: listMeetings.execute as (params?: {
        status?: string;
        client_id?: number;
        limit?: number;
        offset?: number;
      }) => Promise<{ items: Meeting[]; total: number } | null>,
      get: getMeeting.execute as (id: number) => Promise<Meeting | null>,
      startRecording: startRecording.execute as (id: number) => Promise<Meeting | null>,
      stopRecording: stopRecording.execute as (id: number) => Promise<Meeting | null>,
      process: processMeeting.execute as (id: number) => Promise<Meeting | null>,
      updateAction: updateAction.execute,
      createLoading: createMeeting.loading,
      listData: listMeetings.data as { items: Meeting[]; total: number } | null,
      listLoading: listMeetings.loading,
      listError: listMeetings.error,
      currentMeeting: getMeeting.data as Meeting | null,
      currentLoading: getMeeting.loading,
    },

    // Clients
    clients: {
      list: listClients.execute as (params?: {
        status?: string;
        search?: string;
        limit?: number;
        offset?: number;
      }) => Promise<{ items: Client[]; total: number } | null>,
      get: getClient.execute as (id: number) => Promise<Client | null>,
      getInsights: getClientInsights.execute as (
        id: number
      ) => Promise<ClientInsights | null>,
      listData: listClients.data as { items: Client[]; total: number } | null,
      listLoading: listClients.loading,
      listError: listClients.error,
      current: getClient.data as Client | null,
      currentLoading: getClient.loading,
      insights: getClientInsights.data as ClientInsights | null,
      insightsLoading: getClientInsights.loading,
    },

    // Alerts
    alerts: {
      list: listAlerts.execute as (params?: {
        type?: string;
        severity?: string;
        is_read?: boolean;
        limit?: number;
        offset?: number;
      }) => Promise<{ items: Alert[]; total: number } | null>,
      act: actOnAlert.execute,
      listData: listAlerts.data as { items: Alert[]; total: number } | null,
      listLoading: listAlerts.loading,
      listError: listAlerts.error,
    },

    // Messages
    messages: {
      createDraft: createDraft.execute,
      listDrafts: listDrafts.execute as (params?: {
        client_id?: number;
        status?: string;
        limit?: number;
        offset?: number;
      }) => Promise<{ items: MessageDraft[]; total: number } | null>,
      draftsData: listDrafts.data as {
        items: MessageDraft[];
        total: number;
      } | null,
      draftsLoading: listDrafts.loading,
      draftsError: listDrafts.error,
      createLoading: createDraft.loading,
      createError: createDraft.error,
    },

    // Ideas
    ideas: {
      list: listIdeas.execute as (params?: {
        status?: string;
        limit?: number;
        offset?: number;
      }) => Promise<{ items: ClientIdea[]; total: number } | null>,
      get: getIdea.execute as (id: number) => Promise<ClientIdea | null>,
      send: sendIdea.execute,
      dismiss: dismissIdea.execute,
      customize: customizeIdea.execute,
      generate: generateIdeas.execute as () => Promise<{ items: ClientIdea[]; total: number } | null>,
      listData: listIdeas.data as { items: ClientIdea[]; total: number } | null,
      listLoading: listIdeas.loading,
      listError: listIdeas.error,
      generateLoading: generateIdeas.loading,
    },

    // Scoring
    scoring: {
      getScore: getClientScore.execute as (id: number) => Promise<ClientScore | null>,
      refresh: refreshScores.execute,
      leaderboard: getScoreLeaderboard.execute,
      scoreData: getClientScore.data as ClientScore | null,
      scoreLoading: getClientScore.loading,
      refreshLoading: refreshScores.loading,
      leaderboardData: getScoreLeaderboard.data,
    },

    // Call Cycles
    callCycles: {
      get: getClientCallCycle.execute as (id: number) => Promise<ClientCallCycle | null>,
      set: setClientCallCycle.execute,
      list: listCallCycles.execute as (params?: {
        status?: string;
      }) => Promise<{ items: ClientCallCycle[]; total: number } | null>,
      data: getClientCallCycle.data as ClientCallCycle | null,
      loading: getClientCallCycle.loading,
      listData: listCallCycles.data as { items: ClientCallCycle[]; total: number } | null,
    },
  };
}
