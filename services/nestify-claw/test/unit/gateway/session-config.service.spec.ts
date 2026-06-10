import { ConfigService } from '@nestjs/config';
import { SessionConfigService } from '../../../src/gateway/config/session-config.service';

describe('SessionConfigService', () => {
  function createService(env: Record<string, string | undefined>) {
    return new SessionConfigService({
      get: (key: string) => env[key],
    } as ConfigService);
  }

  it('defaults to OpenClaw main dmScope', () => {
    expect(createService({}).getConfig()).toEqual({
      dmScope: 'main',
      mainKey: 'main',
      identityLinks: {},
    });
  });

  it('reads dmScope and identityLinks from env', () => {
    expect(
      createService({
        SESSION_DM_SCOPE: 'per-channel-peer',
        SESSION_MAIN_KEY: 'inbox',
        SESSION_IDENTITY_LINKS: JSON.stringify({
          alice: ['telegram:123'],
        }),
      }).getConfig(),
    ).toEqual({
      dmScope: 'per-channel-peer',
      mainKey: 'inbox',
      identityLinks: { alice: ['telegram:123'] },
    });
  });

  it('ignores invalid dmScope values', () => {
    expect(
      createService({ SESSION_DM_SCOPE: 'invalid' }).getConfig().dmScope,
    ).toBe('main');
  });
});
