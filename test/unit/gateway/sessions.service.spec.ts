import { SessionsService } from '../../../src/gateway/sessions/sessions.service';
import { StateStoreService } from '../../../src/gateway/infra/state-store.service';
import type { SessionState } from '../../../src/common/types';

describe('SessionsService', () => {
  const state = new StateStoreService();
  const service = new SessionsService(state);

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

    expect(loaded?.data).toEqual({ turns: 2 });
    expect(loaded?.updatedAt).toBeGreaterThanOrEqual(before);
  });
});
