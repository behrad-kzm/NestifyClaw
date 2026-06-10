import { InboundService } from '../../../src/gateway/inbound/inbound.service';
import type { IncomingChannelMessage } from '../../../src/common/types';

function message(overrides: Partial<IncomingChannelMessage> = {}): IncomingChannelMessage {
  return {
    channel: 'telegram',
    chatId: '42',
    raw: {},
    ...overrides,
  };
}

describe('InboundService', () => {
  const service = new InboundService();

  it('classifies slash-prefixed text as a command', async () => {
    const decision = await service.classify(message({ text: '/start' }));
    expect(decision).toEqual({
      kind: 'command',
      reason: 'slash-prefixed text',
    });
  });

  it('classifies normal text as respond', async () => {
    const decision = await service.classify(message({ text: 'hello' }));
    expect(decision).toEqual({ kind: 'respond' });
  });

  it('classifies missing text as respond', async () => {
    const decision = await service.classify(message());
    expect(decision).toEqual({ kind: 'respond' });
  });
});
