import {
  buildAgentMainSessionKey,
  buildAgentPeerSessionKey,
} from '../../../src/gateway/routing/session-key';

describe('session-key', () => {
  const identityLinks = {
    alice: ['telegram:123', 'whatsapp:+15551230001'],
  };

  it.each([
    {
      name: 'main scope collapses DMs',
      dmScope: 'main' as const,
      expected: 'agent:main:main',
    },
    {
      name: 'per-peer scope isolates by sender',
      dmScope: 'per-peer' as const,
      expected: 'agent:main:direct:user123',
    },
    {
      name: 'per-channel-peer scope isolates by channel + sender',
      dmScope: 'per-channel-peer' as const,
      expected: 'agent:main:telegram:direct:user123',
    },
    {
      name: 'per-account-channel-peer scope includes account',
      dmScope: 'per-account-channel-peer' as const,
      accountId: 'work',
      expected: 'agent:main:telegram:work:direct:user123',
    },
  ])('$name', ({ dmScope, accountId, expected }) => {
    expect(
      buildAgentPeerSessionKey({
        agentId: 'main',
        channel: 'telegram',
        accountId,
        peerKind: 'direct',
        peerId: 'user123',
        dmScope,
      }),
    ).toBe(expected);
  });

  it('keeps group sessions distinct from DM main bucket', () => {
    const dmKey = buildAgentPeerSessionKey({
      agentId: 'main',
      channel: 'telegram',
      peerKind: 'direct',
      peerId: 'user123',
      dmScope: 'main',
    });
    const groupKey = buildAgentPeerSessionKey({
      agentId: 'main',
      channel: 'telegram',
      peerKind: 'group',
      peerId: '-100123',
    });

    expect(dmKey).toBe('agent:main:main');
    expect(groupKey).toBe('agent:main:telegram:group:-100123');
    expect(dmKey).not.toBe(groupKey);
  });

  it('resolves identityLinks to a canonical peer id', () => {
    expect(
      buildAgentPeerSessionKey({
        agentId: 'main',
        channel: 'telegram',
        peerKind: 'direct',
        peerId: '123',
        dmScope: 'per-channel-peer',
        identityLinks,
      }),
    ).toBe('agent:main:telegram:direct:alice');
  });

  it('builds the main session key', () => {
    expect(
      buildAgentMainSessionKey({ agentId: 'main', mainKey: 'inbox' }),
    ).toBe('agent:main:inbox');
  });
});
