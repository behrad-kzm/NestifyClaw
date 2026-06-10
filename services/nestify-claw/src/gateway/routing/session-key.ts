/**
 * OpenClaw-aligned session key derivation (ported from openclaw/src/routing/session-key.ts).
 */
import { normalizeLowercaseStringOrEmpty } from '../../common/openclaw/plugin-sdk/string-coerce-runtime';
import type { DmScope } from '../config/session-config.types';
import { DEFAULT_AGENT_ID, DEFAULT_MAIN_KEY } from '../config/session-config.types';

export type ChatType = 'direct' | 'group' | 'channel' | 'room';

const VALID_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const INVALID_CHARS_RE = /[^a-z0-9_-]+/g;
const LEADING_DASH_RE = /^-+/;
const TRAILING_DASH_RE = /-+$/;
const DEFAULT_ACCOUNT_ID = 'default';

function normalizeToken(value: string | undefined | null): string {
  return normalizeLowercaseStringOrEmpty(value);
}

export function normalizeMainKey(value: string | undefined | null): string {
  return normalizeLowercaseStringOrEmpty(value) || DEFAULT_MAIN_KEY;
}

export function normalizeAgentId(value: string | undefined | null): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return DEFAULT_AGENT_ID;
  }
  const normalized = normalizeLowercaseStringOrEmpty(trimmed);
  if (VALID_ID_RE.test(trimmed)) {
    return normalized;
  }
  return (
    normalized
      .replace(INVALID_CHARS_RE, '-')
      .replace(LEADING_DASH_RE, '')
      .replace(TRAILING_DASH_RE, '')
      .slice(0, 64) || DEFAULT_AGENT_ID
  );
}

export function normalizeAccountId(value: string | undefined | null): string {
  const normalized = normalizeLowercaseStringOrEmpty(value);
  return normalized || DEFAULT_ACCOUNT_ID;
}

export function normalizeSessionPeerId(params: {
  channel: string | undefined | null;
  peerKind?: string | null;
  peerId?: string | null;
}): string {
  const peerId = (params.peerId ?? '').trim();
  if (!peerId) {
    return '';
  }
  // Preserve opaque group/channel ids (e.g. Telegram -100…, mixed-case Signal groups).
  const kind = normalizeToken(params.peerKind);
  if (kind === 'group' || kind === 'channel' || kind === 'room') {
    if (peerId.startsWith('-') || /[A-Z]/.test(peerId)) {
      return peerId;
    }
  }
  return normalizeLowercaseStringOrEmpty(peerId);
}

export function buildAgentMainSessionKey(params: {
  agentId: string;
  mainKey?: string | undefined;
}): string {
  return `agent:${normalizeAgentId(params.agentId)}:${normalizeMainKey(params.mainKey)}`;
}

function resolveLinkedPeerId(params: {
  identityLinks?: Record<string, string[]>;
  channel: string;
  peerId: string;
}): string | null {
  const identityLinks = params.identityLinks;
  if (!identityLinks) {
    return null;
  }
  const peerId = params.peerId.trim();
  if (!peerId) {
    return null;
  }
  const candidates = new Set<string>();
  const rawCandidate = normalizeToken(peerId);
  if (rawCandidate) {
    candidates.add(rawCandidate);
  }
  const channel = normalizeToken(params.channel);
  if (channel) {
    const scopedCandidate = normalizeToken(`${channel}:${peerId}`);
    if (scopedCandidate) {
      candidates.add(scopedCandidate);
    }
  }
  for (const [canonical, ids] of Object.entries(identityLinks)) {
    const canonicalName = canonical.trim();
    if (!canonicalName || !Array.isArray(ids)) {
      continue;
    }
    for (const id of ids) {
      const normalized = normalizeToken(id);
      if (normalized && candidates.has(normalized)) {
        return canonicalName;
      }
    }
  }
  return null;
}

export function buildAgentPeerSessionKey(params: {
  agentId: string;
  mainKey?: string | undefined;
  channel: string;
  accountId?: string | null;
  peerKind?: ChatType | null;
  peerId?: string | null;
  identityLinks?: Record<string, string[]>;
  dmScope?: DmScope;
}): string {
  const peerKind = params.peerKind ?? 'direct';
  if (peerKind === 'direct') {
    const dmScope = params.dmScope ?? 'main';
    let peerId = (params.peerId ?? '').trim();
    const linkedPeerId =
      dmScope === 'main'
        ? null
        : resolveLinkedPeerId({
            identityLinks: params.identityLinks,
            channel: params.channel,
            peerId,
          });
    if (linkedPeerId) {
      peerId = linkedPeerId;
    }
    peerId = normalizeLowercaseStringOrEmpty(peerId);
    if (dmScope === 'per-account-channel-peer' && peerId) {
      const channel = normalizeLowercaseStringOrEmpty(params.channel) || 'unknown';
      const accountId = normalizeAccountId(params.accountId);
      return `agent:${normalizeAgentId(params.agentId)}:${channel}:${accountId}:direct:${peerId}`;
    }
    if (dmScope === 'per-channel-peer' && peerId) {
      const channel = normalizeLowercaseStringOrEmpty(params.channel) || 'unknown';
      return `agent:${normalizeAgentId(params.agentId)}:${channel}:direct:${peerId}`;
    }
    if (dmScope === 'per-peer' && peerId) {
      return `agent:${normalizeAgentId(params.agentId)}:direct:${peerId}`;
    }
    return buildAgentMainSessionKey({
      agentId: params.agentId,
      mainKey: params.mainKey,
    });
  }
  const channel = normalizeLowercaseStringOrEmpty(params.channel) || 'unknown';
  const peerId =
    normalizeSessionPeerId({
      channel: params.channel,
      peerKind,
      peerId: params.peerId,
    }) || 'unknown';
  return `agent:${normalizeAgentId(params.agentId)}:${channel}:${peerKind}:${peerId}`;
}
