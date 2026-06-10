import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_DM_SCOPE,
  DEFAULT_MAIN_KEY,
  type DmScope,
  type SessionConfig,
} from './session-config.types';

const DM_SCOPE_VALUES: ReadonlySet<string> = new Set([
  'main',
  'per-peer',
  'per-channel-peer',
  'per-account-channel-peer',
]);

@Injectable()
export class SessionConfigService {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  getConfig(): SessionConfig {
    return {
      dmScope: this.resolveDmScope(),
      mainKey: this.config.get<string>('SESSION_MAIN_KEY')?.trim() || DEFAULT_MAIN_KEY,
      identityLinks: this.resolveIdentityLinks(),
    };
  }

  private resolveDmScope(): DmScope {
    const raw = this.config.get<string>('SESSION_DM_SCOPE')?.trim().toLowerCase();
    if (raw && DM_SCOPE_VALUES.has(raw)) {
      return raw as DmScope;
    }
    return DEFAULT_DM_SCOPE;
  }

  private resolveIdentityLinks(): Record<string, string[]> {
    const raw = this.config.get<string>('SESSION_IDENTITY_LINKS')?.trim();
    if (!raw) {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }
      const links: Record<string, string[]> = {};
      for (const [canonical, ids] of Object.entries(parsed)) {
        if (!canonical.trim() || !Array.isArray(ids)) {
          continue;
        }
        const normalized = ids
          .filter((id): id is string => typeof id === 'string')
          .map((id) => id.trim())
          .filter(Boolean);
        if (normalized.length > 0) {
          links[canonical.trim()] = normalized;
        }
      }
      return links;
    } catch {
      return {};
    }
  }
}
