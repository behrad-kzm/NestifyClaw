/** OpenClaw-aligned DM session isolation mode (`session.dmScope`). */
export type DmScope =
  | 'main'
  | 'per-peer'
  | 'per-channel-peer'
  | 'per-account-channel-peer';

export type SessionConfig = {
  dmScope: DmScope;
  mainKey: string;
  identityLinks: Record<string, string[]>;
};

export const DEFAULT_DM_SCOPE: DmScope = 'main';
export const DEFAULT_MAIN_KEY = 'main';
export const DEFAULT_AGENT_ID = 'main';
