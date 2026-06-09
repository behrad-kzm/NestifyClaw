import { AgentRuntimeService } from '../../../src/core/host/agent-runtime.service';
import type { TurnInput } from '../../../src/common/types';

describe('AgentRuntimeService', () => {
  const service = new AgentRuntimeService();

  it('returns a stub echo reply for the routed agent', async () => {
    const input: TurnInput = {
      route: {
        agentId: 'main',
        sessionKey: 'agent:main:telegram:5',
        targetKind: 'agent',
      },
      message: {
        channel: 'telegram',
        chatId: '5',
        text: 'hello',
        raw: {},
      },
      session: null,
    };

    await expect(service.runTurn(input)).resolves.toEqual({
      replies: [{ text: '[stub agent:main] received: hello' }],
    });
  });

  it('handles missing message text', async () => {
    const input: TurnInput = {
      route: {
        agentId: 'main',
        sessionKey: 'agent:main:telegram:5',
        targetKind: 'agent',
      },
      message: {
        channel: 'telegram',
        chatId: '5',
        raw: {},
      },
      session: null,
    };

    await expect(service.runTurn(input)).resolves.toEqual({
      replies: [{ text: '[stub agent:main] received: ' }],
    });
  });
});
