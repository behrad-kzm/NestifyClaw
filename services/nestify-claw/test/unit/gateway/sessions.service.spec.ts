import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { OpenClawSessionStore } from '../../../src/core/sessions/openclaw-session.store';
import { SessionsService } from '../../../src/gateway/sessions/sessions.service';
import type { SessionState } from '../../../src/common/types';

describe('SessionsService', () => {
  let tempDir = '';
  let store: OpenClawSessionStore;
  let service: SessionsService;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'nestify-sessions-'));
    store = new OpenClawSessionStore();
    store.configure({ stateDir: tempDir, agentId: 'main' });
    service = new SessionsService(store);
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('loads null when no session exists', async () => {
    await expect(service.load('agent:main:telegram:1')).resolves.toBeNull();
  });

  it('persists session state with an updated timestamp', async () => {
    const before = Date.now();
    const session: SessionState = {
      sessionKey: 'agent:main:telegram:1',
      data: { turns: 2 },
      updatedAt: 0,
    };

    await service.save(session);
    const loaded = await service.load('agent:main:telegram:1');

    expect(loaded?.data).toEqual(expect.objectContaining({ turns: 2, sessionId: expect.any(String) }));
    expect(loaded?.updatedAt).toBeGreaterThanOrEqual(before);
  });
});
