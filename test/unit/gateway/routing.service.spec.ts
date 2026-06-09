import { Test } from '@nestjs/testing';
import type { IncomingChannelMessage } from '../../../src/common/types';
import { SessionConfigService } from '../../../src/gateway/config/session-config.service';
import type { SessionConfig } from '../../../src/gateway/config/session-config.types';
import { RoutingService } from '../../../src/gateway/routing/routing.service';

function message(
  overrides: Partial<IncomingChannelMessage> = {},
): IncomingChannelMessage {
  return {
    channel: 'telegram',
    chatId: '99',
    raw: {},
    ...overrides,
  };
}

describe('RoutingService', () => {
  let service: RoutingService;
  let sessionConfig: SessionConfig;

  beforeEach(async () => {
    sessionConfig = {
      dmScope: 'per-channel-peer',
      mainKey: 'main',
      identityLinks: {},
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RoutingService,
        {
          provide: SessionConfigService,
          useValue: {
            getConfig: () => sessionConfig,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(RoutingService);
  });

  it('routes DMs with OpenClaw per-channel-peer session keys', async () => {
    await expect(
      service.resolve(
        message({
          chatType: 'direct',
          peerId: '99',
          text: 'hi',
        }),
      ),
    ).resolves.toEqual({
      agentId: 'main',
      sessionKey: 'agent:main:telegram:direct:99',
      targetKind: 'agent',
      channel: 'telegram',
      chatId: '99',
    });
  });

  it('collapses DMs when dmScope is main', async () => {
    sessionConfig.dmScope = 'main';

    await expect(
      service.resolve(message({ chatType: 'direct', peerId: '99' })),
    ).resolves.toEqual({
      agentId: 'main',
      sessionKey: 'agent:main:main',
      targetKind: 'agent',
      channel: 'telegram',
      chatId: '99',
    });
  });

  it('routes group chats to isolated group session keys', async () => {
    await expect(
      service.resolve(
        message({
          chatType: 'group',
          chatId: '-100456',
          peerId: '-100456',
        }),
      ),
    ).resolves.toEqual({
      agentId: 'main',
      sessionKey: 'agent:main:telegram:group:-100456',
      targetKind: 'agent',
      channel: 'telegram',
      chatId: '-100456',
    });
  });

  it('applies identityLinks for linked peers', async () => {
    sessionConfig.identityLinks = {
      alice: ['telegram:777'],
    };

    await expect(
      service.resolve(
        message({
          chatType: 'direct',
          peerId: '777',
        }),
      ),
    ).resolves.toEqual({
      agentId: 'main',
      sessionKey: 'agent:main:telegram:direct:alice',
      targetKind: 'agent',
      channel: 'telegram',
      chatId: '99',
    });
  });
});
