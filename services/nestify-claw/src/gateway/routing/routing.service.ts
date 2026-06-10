import { Inject, Injectable } from '@nestjs/common';
import type {
  IncomingChannelMessage,
  RouteTarget,
  RoutingPort,
} from '../../common/types';
import { SessionConfigService } from '../config/session-config.service';
import { DEFAULT_AGENT_ID } from '../config/session-config.types';
import { buildAgentPeerSessionKey, type ChatType } from './session-key';

/**
 * Routing (bucket D): pick the agent + session for a message.
 *
 * Session keys follow OpenClaw's `buildAgentPeerSessionKey` rules, driven by
 * `session.dmScope` and `session.identityLinks` (env: SESSION_DM_SCOPE, etc.).
 */
@Injectable()
export class RoutingService implements RoutingPort {
  constructor(
    @Inject(SessionConfigService)
    private readonly sessionConfig: SessionConfigService,
  ) {}

  async resolve(message: IncomingChannelMessage): Promise<RouteTarget> {
    const agentId = DEFAULT_AGENT_ID;
    const session = this.sessionConfig.getConfig();
    const { peerKind, peerId } = resolvePeerContext(message);

    const sessionKey = buildAgentPeerSessionKey({
      agentId,
      mainKey: session.mainKey,
      channel: message.channel,
      accountId: message.accountId,
      peerKind,
      peerId,
      identityLinks: session.identityLinks,
      dmScope: session.dmScope,
    });

    return {
      agentId,
      sessionKey,
      targetKind: 'agent',
      channel: message.channel,
      chatId: message.chatId,
    };
  }
}

function resolvePeerContext(message: IncomingChannelMessage): {
  peerKind: ChatType;
  peerId: string;
} {
  const chatType = message.chatType ?? 'direct';
  const peerKind = toPeerKind(chatType);

  if (peerKind === 'direct') {
    const peerId =
      message.peerId?.trim() ||
      message.senderId?.trim() ||
      message.chatId?.trim() ||
      'unknown';
    return { peerKind, peerId };
  }

  const peerId = message.peerId?.trim() || message.chatId?.trim() || 'unknown';
  return { peerKind, peerId };
}

function toPeerKind(chatType: IncomingChannelMessage['chatType']): ChatType {
  switch (chatType) {
    case 'group':
      return 'group';
    case 'channel':
      return 'channel';
    case 'room':
      return 'room';
    default:
      return 'direct';
  }
}
