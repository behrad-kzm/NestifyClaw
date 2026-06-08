import { Injectable } from '@nestjs/common';
import type {
  IncomingChannelMessage,
  RouteTarget,
  RoutingPort,
} from '../kernel';

const DEFAULT_AGENT_ID = 'main';

/**
 * Routing (bucket D): pick the agent + session for a message.
 *
 * TODO: port the real openclaw routing — thread bindings (subagents/acp),
 * per-group agent overrides, session-key derivation. For now: always the
 * default agent, with a deterministic per-conversation session key.
 */
@Injectable()
export class RoutingService implements RoutingPort {
  async resolve(message: IncomingChannelMessage): Promise<RouteTarget> {
    const agentId = DEFAULT_AGENT_ID;
    return {
      agentId,
      sessionKey: `agent:${agentId}:${message.channel}:${message.chatId}`,
      targetKind: 'agent',
    };
  }
}
