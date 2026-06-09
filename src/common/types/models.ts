/**
 * Shared domain types used across connectors, gateway pipeline, and agent runtime.
 */
import type { IncomingChannelMessage } from '../extension/nestify-extension';

export type { IncomingChannelMessage };

/** What the inbound pipeline decided to do with a message. */
export type InboundDecisionKind = 'respond' | 'ignore' | 'command';

export interface InboundDecision {
  kind: InboundDecisionKind;
  /** Human-readable explanation, useful for logs/diagnostics. */
  reason?: string;
}

/** Where a message should be handled: which agent/session/target kind. */
export type RouteTargetKind = 'agent' | 'subagent' | 'acp';

export interface RouteTarget {
  agentId: string;
  sessionKey: string;
  targetKind: RouteTargetKind;
  /** Source channel id for outbound delivery routing. */
  channel?: string;
  /** Channel-native chat/conversation id for delivery. */
  chatId?: string;
}

/** Persisted per-conversation state. */
export interface SessionState {
  sessionKey: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

/** A single outbound reply produced by an agent turn. */
export interface OutboundReply {
  text?: string;
  /** Reserved for media/attachments handled by the MediaPort. */
  media?: unknown;
}

export interface TurnInput {
  route: RouteTarget;
  message: IncomingChannelMessage;
  session: SessionState | null;
}

export interface TurnResult {
  replies: OutboundReply[];
}

/** A request to a human to approve a tool/command execution. */
export interface ApprovalRequest {
  sessionKey: string;
  action: string;
  details?: unknown;
}

export interface ApprovalDecision {
  approved: boolean;
  by?: string;
}
