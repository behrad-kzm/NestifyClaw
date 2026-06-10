import { Test } from '@nestjs/testing';
import {
  AGENT_RUNTIME_PORT,
  COMMANDS_PORT,
  DELIVERY_PORT,
  INBOUND_PORT,
  MEDIA_PORT,
  ROUTING_PORT,
  SESSION_STORE_PORT,
  type IncomingChannelMessage,
} from '../../../src/common/types';
import { GatewayService } from '../../../src/gateway/gateway.service';

const message: IncomingChannelMessage = {
  channel: 'telegram',
  chatId: '7',
  text: 'ping',
  raw: {},
};

describe('GatewayService', () => {
  const commands = { tryHandle: jest.fn() };
  const inbound = { classify: jest.fn() };
  const routing = { resolve: jest.fn() };
  const sessions = { load: jest.fn(), save: jest.fn() };
  const agent = { runTurn: jest.fn() };
  const media = { resolveInbound: jest.fn(), prepareOutbound: jest.fn() };
  const delivery = { deliver: jest.fn() };

  let gateway: GatewayService;

  beforeEach(async () => {
    jest.clearAllMocks();

    commands.tryHandle.mockResolvedValue(false);
    inbound.classify.mockResolvedValue({ kind: 'respond' });
    routing.resolve.mockResolvedValue({
      agentId: 'main',
      sessionKey: 'agent:main:telegram:7',
      targetKind: 'agent',
      channel: 'telegram',
      chatId: '7',
    });
    sessions.load.mockResolvedValue(null);
    media.resolveInbound.mockResolvedValue(null);
    media.prepareOutbound.mockImplementation(async (reply) => reply);
    agent.runTurn.mockResolvedValue({
      replies: [{ text: 'agent reply' }],
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        GatewayService,
        { provide: COMMANDS_PORT, useValue: commands },
        { provide: INBOUND_PORT, useValue: inbound },
        { provide: ROUTING_PORT, useValue: routing },
        { provide: SESSION_STORE_PORT, useValue: sessions },
        { provide: AGENT_RUNTIME_PORT, useValue: agent },
        { provide: MEDIA_PORT, useValue: media },
        { provide: DELIVERY_PORT, useValue: delivery },
      ],
    }).compile();

    gateway = moduleRef.get(GatewayService);
  });

  it('short-circuits when commands handle the message', async () => {
    commands.tryHandle.mockResolvedValue(true);

    await gateway.handleInbound(message);

    expect(commands.tryHandle).toHaveBeenCalledWith(message);
    expect(inbound.classify).not.toHaveBeenCalled();
    expect(agent.runTurn).not.toHaveBeenCalled();
  });

  it('ignores messages classified as ignore', async () => {
    inbound.classify.mockResolvedValue({ kind: 'ignore', reason: 'gated' });

    await gateway.handleInbound(message);

    expect(routing.resolve).not.toHaveBeenCalled();
    expect(agent.runTurn).not.toHaveBeenCalled();
  });

  it('runs the full pipeline for respond decisions', async () => {
    await gateway.handleInbound(message);

    expect(routing.resolve).toHaveBeenCalledWith(message);
    expect(sessions.load).toHaveBeenCalledWith('agent:main:telegram:7');
    expect(media.resolveInbound).toHaveBeenCalledWith(message);
    expect(agent.runTurn).toHaveBeenCalledWith({
      route: {
        agentId: 'main',
        sessionKey: 'agent:main:telegram:7',
        targetKind: 'agent',
        channel: 'telegram',
        chatId: '7',
      },
      message,
      session: null,
    });
    expect(media.prepareOutbound).toHaveBeenCalledWith({ text: 'agent reply' });
    expect(delivery.deliver).toHaveBeenCalledWith(
      {
        agentId: 'main',
        sessionKey: 'agent:main:telegram:7',
        targetKind: 'agent',
        channel: 'telegram',
        chatId: '7',
      },
      { text: 'agent reply' },
    );
    expect(sessions.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionKey: 'agent:main:telegram:7',
        data: {},
      }),
    );
  });
});
