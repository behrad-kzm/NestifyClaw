import { Inject, Injectable } from '@nestjs/common';
import {
  STATE_STORE_PORT,
  type SessionState,
  type SessionStorePort,
  type StateStorePort,
} from '../../common/types';

const SESSIONS_NAMESPACE = 'sessions';

/**
 * Session persistence (bucket D). Backed by the global StateStorePort, so it
 * inherits whatever persistence backend Infra provides.
 *
 * TODO: align with openclaw `session-store-runtime` (transcripts, group
 * history, updatedAt semantics) when wiring the real agent runtime.
 */
@Injectable()
export class SessionsService implements SessionStorePort {
  constructor(
    @Inject(STATE_STORE_PORT) private readonly state: StateStorePort,
  ) {}

  async load(sessionKey: string): Promise<SessionState | null> {
    return this.state.get<SessionState>(SESSIONS_NAMESPACE, sessionKey);
  }

  async save(stateToSave: SessionState): Promise<void> {
    await this.state.set(SESSIONS_NAMESPACE, stateToSave.sessionKey, {
      ...stateToSave,
      updatedAt: Date.now(),
    });
  }
}
