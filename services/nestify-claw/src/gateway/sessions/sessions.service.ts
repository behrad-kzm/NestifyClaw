import { Inject, Injectable } from '@nestjs/common';
import { OpenClawSessionStore } from '../../core/sessions/openclaw-session.store';
import type { SessionState, SessionStorePort } from '../../common/types';

/**
 * Session persistence (bucket D). Backed by OpenClaw-style filesystem store
 * under NESTIFY_STATE_DIR when configured.
 */
@Injectable()
export class SessionsService implements SessionStorePort {
  constructor(
    @Inject(OpenClawSessionStore)
    private readonly store: OpenClawSessionStore,
  ) {}

  async load(sessionKey: string): Promise<SessionState | null> {
    if (!this.store.isConfigured()) {
      return null;
    }
    return this.store.load(sessionKey);
  }

  async save(stateToSave: SessionState): Promise<void> {
    if (!this.store.isConfigured()) {
      return;
    }
    await this.store.save({
      ...stateToSave,
      updatedAt: Date.now(),
    });
  }
}
