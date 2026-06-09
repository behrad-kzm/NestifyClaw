/**
 * Port interfaces (dependency-inversion contracts) for gateway pipeline and agents.
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

export interface SecretsPort {
  get(key: string): Promise<string | undefined>;
}

export interface InboundPort {
  classify(message: IncomingChannelMessage): Promise<InboundDecision>;
}

export interface RoutingPort {
  resolve(message: IncomingChannelMessage): Promise<RouteTarget>;
}

export interface SessionStorePort {
  load(sessionKey: string): Promise<SessionState | null>;
  save(state: SessionState): Promise<void>;
}

export interface AgentRuntimePort {
  runTurn(input: TurnInput): Promise<TurnResult>;
}

export interface ApprovalPort {
  request(req: ApprovalRequest): Promise<ApprovalDecision>;
}

export interface DeliveryPort {
  deliver(target: RouteTarget, reply: OutboundReply): Promise<void>;
}

export interface MediaPort {
  resolveInbound(message: IncomingChannelMessage): Promise<unknown>;
  prepareOutbound(reply: OutboundReply): Promise<OutboundReply>;
}

export interface CommandsPort {
  tryHandle(message: IncomingChannelMessage): Promise<boolean>;
}

export interface StateStorePort {
  get<T>(namespace: string, key: string): Promise<T | null>;
  set<T>(namespace: string, key: string, value: T): Promise<void>;
  delete(namespace: string, key: string): Promise<void>;
}

/** Gateway orchestrator — openclaw-aligned entry for inbound message handling. */
export interface GatewayPort {
  handleInbound(message: IncomingChannelMessage): Promise<void>;
}
