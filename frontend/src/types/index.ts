/* ═══════════════════════════════════════════════════════════
   AIVA Type Definitions
   AI Virtual Advisor — Wealth Management Workstation
   ═══════════════════════════════════════════════════════════ */

// ─── Auth & User ──────────────────────────────────────────

export interface Advisor {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

// ─── Clients ──────────────────────────────────────────────

export type RiskProfile =
  | "conservative"
  | "moderate"
  | "aggressive"
  | "very_aggressive";

export type ClientStatus = "active" | "prospect" | "inactive" | "churned";

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  aum: number;
  risk_profile: RiskProfile;
  status: ClientStatus;
  advisor_id: number;
  created_at: string;
}

export interface ClientPortfolio {
  id: number;
  client_id: number;
  asset_class: string;
  ticker: string;
  name: string;
  value: number;
  allocation_pct: number;
  gain_loss_pct: number;
}

// ─── Meetings ─────────────────────────────────────────────

export type MeetingStatus =
  | "scheduled"
  | "recording"
  | "processing"
  | "completed";

export type MeetingType =
  | "initial_consultation"
  | "portfolio_review"
  | "quarterly_review"
  | "annual_review"
  | "ad_hoc"
  | "follow_up";

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker: string;
  text: string;
  timestamp: string;
  confidence: number;
}

export type ActionPriority = "high" | "medium" | "low";
export type ActionStatus = "pending" | "completed";

export interface MeetingAction {
  id: number;
  meeting_id: number;
  description: string;
  assignee: string;
  priority: ActionPriority;
  due_date: string;
  status: ActionStatus;
  created_at: string;
}

export interface Meeting {
  id: number;
  advisor_id: number;
  client_id: number;
  client: Client;
  title: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  started_at: string;
  ended_at: string | null;
  transcript_segments: TranscriptSegment[];
  summary: string | null;
  action_items: MeetingAction[];
  follow_up_draft: string | null;
  created_at: string;
}

// ─── Alerts ───────────────────────────────────────────────

export type AlertType =
  | "market"
  | "client"
  | "portfolio"
  | "compliance"
  | "opportunity";

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: number;
  advisor_id: number;
  type: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  client_id: number | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

// ─── Tasks ────────────────────────────────────────────────

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: number;
  advisor_id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  client_id: number | null;
  created_at: string;
}

// ─── Life Events ──────────────────────────────────────────

export interface LifeEvent {
  id: number;
  client_id: number;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
  impact: string;
}

// ─── Communications ──────────────────────────────────────

export type CommunicationChannel = "email" | "phone" | "meeting" | "text";
export type CommunicationDirection = "inbound" | "outbound";

export interface CommunicationLog {
  id: number;
  client_id: number;
  advisor_id: number;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject: string;
  content: string;
  created_at: string;
}

// ─── Messages ─────────────────────────────────────────────

export type MessageTone =
  | "professional"
  | "friendly"
  | "formal"
  | "empathetic"
  | "urgent";
export type MessageChannel = "email" | "phone" | "text";
export type MessageStatus = "draft" | "sent";

export interface MessageDraft {
  id: number;
  advisor_id: number;
  client_id: number;
  subject: string;
  body: string;
  tone: MessageTone;
  channel: MessageChannel;
  status: MessageStatus;
  created_at: string;
}

// ─── Morning Briefing ─────────────────────────────────────

export interface MorningBriefing {
  summary: string;
  key_events: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    urgency: string;
  }>;
  recommended_contacts: Array<{
    client_id: number;
    client_name: string;
    reason: string;
    last_contact: string;
    priority: string;
  }>;
  market_highlights: Array<{
    symbol: string;
    name: string;
    change_pct: number;
    relevance: string;
  }>;
  priority_tasks: Array<{
    id: number;
    title: string;
    due_date: string;
    priority: string;
    client_name: string | null;
  }>;
}

// ─── Dashboard ────────────────────────────────────────────

export interface DashboardEvent {
  id: number;
  client_id: number;
  client_name: string;
  event_type: string;
  description: string;
  date: string;
  urgency: string;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  volume: number;
}

// ─── WebSocket Messages ───────────────────────────────────

export interface WSMessage {
  type: string;
  payload: unknown;
}

export interface WSAlertMessage extends WSMessage {
  type: "alert";
  payload: Alert;
}

export interface WSTranscriptMessage extends WSMessage {
  type: "transcript_segment";
  payload: TranscriptSegment;
}

export interface WSMeetingStatusMessage extends WSMessage {
  type: "meeting_status";
  payload: {
    meeting_id: number;
    status: MeetingStatus;
  };
}

// ─── API Responses ────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ClientInsights {
  summary: string;
  risk_assessment: string;
  opportunities: string[];
  concerns: string[];
  recommended_actions: string[];
  portfolio_analysis: string;
  relationship_health: string;
}

// ─── Ticker Quotes ───────────────────────────────────────

export interface TickerQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  day_high: number | null;
  day_low: number | null;
  year_high: number | null;
  year_low: number | null;
  pe_ratio: number | null;
  market_cap: number | null;
  volume: number | null;
  analyst_rating: "Buy" | "Hold" | "Sell" | null;
  analyst_target: number | null;
  cached_at: string;
}

export interface TickerHolder {
  client_id: number;
  client_name: string;
  value: number;
  allocation_pct: number;
  gain_loss_pct: number;
}

// ─── Command Bar ──────────────────────────────────────────

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: "navigation" | "client" | "action" | "search";
  action: () => void;
}

// ─── Ideas ───────────────────────────────────────────────

export type IdeaStatus = "pending" | "sent" | "dismissed";

export type IdeaTriggerType =
  | "portfolio_downgrade"
  | "concentrated_position"
  | "life_event_approaching"
  | "call_cycle_overdue"
  | "market_event"
  | "portfolio_drift"
  | "behavioral_signal";

export interface ClientIdea {
  id: number;
  client_id: number;
  client_name: string;
  template_id: number | null;
  trigger_type: IdeaTriggerType;
  trigger_data: Record<string, string> | null;
  subject: string;
  rendered_content: string;
  channel: string;
  score: number;
  status: IdeaStatus;
  created_at: string;
}

// ─── Client Scoring ──────────────────────────────────────

export interface ClientScore {
  client_id: number;
  client_name: string;
  engagement_score: number;
  urgency_score: number;
  revenue_score: number;
  risk_score: number;
  composite_score: number;
  factors: Record<string, unknown> | null;
  calculated_at: string;
}

// ─── Call Cycles ─────────────────────────────────────────

export type CallCycleStatus =
  | "on_track"
  | "due_soon"
  | "overdue"
  | "urgent_override";

export interface ClientCallCycle {
  client_id: number;
  client_name: string;
  call_cycle_days: number;
  last_contacted_at: string | null;
  next_due_at: string | null;
  override_active: boolean;
  override_reason: string | null;
  status: CallCycleStatus;
}
