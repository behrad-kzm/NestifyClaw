/**
 * Ports (interfaces) for every core subsystem (Component 2, buckets A-J).
 *
 * Domain modules depend on each other ONLY through these interfaces, never on a
 * concrete service class. This keeps the module graph acyclic and lets us swap
 * the current stub implementations for real ones (the "strangler" approach)
 * without touching any caller.
 */
import type {
  ApprovalDecision,
  ApprovalRequest,
  IncomingChannelMessage,
  InboundDecision,
  OutboundReply,
  RouteTarget,
  SessionState,
  TurnInput,
  TurnResult,
} from './models';

/** B - secrets access (tokens, credentials). */
export interface SecretsPort {
  get(key: string): Promise<string | undefined>;
}

/** C - inbound pipeline: classify + gate an incoming message. */
export interface InboundPort {
  classify(message: IncomingChannelMessage): Promise<InboundDecision>;
}

/** D - routing: pick the agent/session/target for a message. */
export interface RoutingPort {
  resolve(message: IncomingChannelMessage): Promise<RouteTarget>;
}

/** D - session persistence. */
export interface SessionStorePort {
  load(sessionKey: string): Promise<SessionState | null>;
  save(state: SessionState): Promise<void>;
}

/** E - agent execution: run one turn and produce replies. */
export interface AgentRuntimePort {
  runTurn(input: TurnInput): Promise<TurnResult>;
}

/** F - human-in-the-loop approval for tool/command execution. */
export interface ApprovalPort {
  request(req: ApprovalRequest): Promise<ApprovalDecision>;
}

/** G - outbound delivery back to the channel. */
export interface DeliveryPort {
  deliver(target: RouteTarget, reply: OutboundReply): Promise<void>;
}

/** H - media in/out (download inbound, prepare outbound). */
export interface MediaPort {
  resolveInbound(message: IncomingChannelMessage): Promise<unknown>;
  prepareOutbound(reply: OutboundReply): Promise<OutboundReply>;
}

/** I - native commands / skills. Returns true if it handled the message. */
export interface CommandsPort {
  tryHandle(message: IncomingChannelMessage): Promise<boolean>;
}

/** J - generic namespaced key/value persistence used by other subsystems. */
export interface StateStorePort {
  get<T>(namespace: string, key: string): Promise<T | null>;
  set<T>(namespace: string, key: string, value: T): Promise<void>;
  delete(namespace: string, key: string): Promise<void>;
}

/** The orchestrator a connector calls for every inbound message. */
export interface MessageEnginePort {
  handleInbound(message: IncomingChannelMessage): Promise<void>;
}
