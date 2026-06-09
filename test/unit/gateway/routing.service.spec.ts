import { RoutingService } from '../../../src/gateway/routing/routing.service';
import type { IncomingChannelMessage } from '../../../src/common/types';

describe('RoutingService', () => {
  const service = new RoutingService();

  it('routes to the default agent with a deterministic session key', async () => {
    const message: IncomingChannelMessage = {
      channel: 'telegram',
      chatId: '99',
      text: 'hi',
      raw: {},
    };

    await expect(service.resolve(message)).resolves.toEqual({
      agentId: 'main',
      sessionKey: 'agent:main:telegram:99',
      targetKind: 'agent',
    });
  });
});
