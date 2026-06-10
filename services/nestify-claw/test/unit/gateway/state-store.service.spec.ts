import { StateStoreService } from '../../../src/gateway/infra/state-store.service';

describe('StateStoreService', () => {
  const service = new StateStoreService();

  it('stores values under namespace-scoped keys', async () => {
    await service.set('sessions', 'agent:main:telegram:1', { count: 1 });
    await expect(service.get('sessions', 'agent:main:telegram:1')).resolves.toEqual({
      count: 1,
    });
  });

  it('returns null for missing keys', async () => {
    await expect(service.get('sessions', 'missing')).resolves.toBeNull();
  });

  it('deletes stored values', async () => {
    await service.set('sessions', 'temp', { ok: true });
    await service.delete('sessions', 'temp');
    await expect(service.get('sessions', 'temp')).resolves.toBeNull();
  });

  it('isolates namespaces', async () => {
    await service.set('a', 'key', 'alpha');
    await service.set('b', 'key', 'beta');
    await expect(service.get('a', 'key')).resolves.toBe('alpha');
    await expect(service.get('b', 'key')).resolves.toBe('beta');
  });
});
