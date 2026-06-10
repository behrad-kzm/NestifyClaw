import { AgentRuntimeService } from '../../../src/core/host/agent-runtime.service';
import { OpenClawConfigService } from '../../../src/gateway/config/openclaw-config.service';
import { OllamaClient } from '../../../src/core/ollama/ollama.client';
import { OpenClawSessionStore } from '../../../src/core/sessions/openclaw-session.store';
import type { TurnInput } from '../../../src/common/types';

describe('AgentRuntimeService', () => {
  const openClawConfig = {
    isReady: jest.fn(),
    getConfig: jest.fn(),
  } as unknown as OpenClawConfigService;

  const ollama = {
    chat: jest.fn(),
  } as unknown as OllamaClient;

  const sessions = {
    configure: jest.fn(),
    save: jest.fn(),
    appendMessage: jest.fn(),
    getChatHistory: jest.fn(),
  } as unknown as OpenClawSessionStore;

  const service = new AgentRuntimeService(openClawConfig, ollama, sessions);

  const baseInput: TurnInput = {
    route: {
      agentId: 'main',
      sessionKey: 'agent:main:telegram:direct:5',
      targetKind: 'agent',
      channel: 'telegram',
      chatId: '5',
    },
    message: {
      channel: 'telegram',
      chatId: '5',
      text: 'hello',
      raw: {},
    },
    session: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (sessions.getChatHistory as jest.Mock).mockResolvedValue([]);
    (sessions.save as jest.Mock).mockResolvedValue(undefined);
    (sessions.appendMessage as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns a stub echo reply when Ollama config is not loaded', async () => {
    (openClawConfig.isReady as jest.Mock).mockReturnValue(false);

    await expect(service.runTurn(baseInput)).resolves.toEqual({
      replies: [{ text: '[stub agent:main] received: hello' }],
    });
    expect(ollama.chat).not.toHaveBeenCalled();
  });

  it('calls Ollama with primary model and returns assistant text', async () => {
    (openClawConfig.isReady as jest.Mock).mockReturnValue(true);
    (openClawConfig.getConfig as jest.Mock).mockReturnValue({
      agents: {
        defaults: {
          model: { primary: 'ollama/qwen3.5:9b', fallbacks: ['ollama/deepseek-r1:8b'] },
        },
        list: [{ id: 'main' }],
      },
      paths: { stateDir: '/tmp/nestify' },
    });
    (ollama.chat as jest.Mock).mockResolvedValue('assistant says hi');
    (sessions.getChatHistory as jest.Mock).mockResolvedValue([
      { role: 'user', content: 'hello' },
    ]);

    process.env.OLLAMA_BASE_URL = 'https://example.test';
    process.env.OLLAMA_API_KEY = 'ollama-local';

    await expect(service.runTurn(baseInput)).resolves.toEqual({
      replies: [{ text: 'assistant says hi' }],
    });

    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://example.test' }),
      'ollama/qwen3.5:9b',
      [{ role: 'user', content: 'hello' }],
    );
    expect(sessions.appendMessage).toHaveBeenCalledWith(
      'agent:main:telegram:direct:5',
      'assistant',
      'assistant says hi',
    );
  });

  it('falls back to the next model when primary fails', async () => {
    (openClawConfig.isReady as jest.Mock).mockReturnValue(true);
    (openClawConfig.getConfig as jest.Mock).mockReturnValue({
      agents: {
        defaults: {
          model: { primary: 'ollama/qwen3.5:9b', fallbacks: ['ollama/deepseek-r1:8b'] },
        },
        list: [{ id: 'main' }],
      },
      paths: { stateDir: '/tmp/nestify' },
    });
    (ollama.chat as jest.Mock)
      .mockRejectedValueOnce(new Error('primary down'))
      .mockResolvedValueOnce('fallback ok');
    (sessions.getChatHistory as jest.Mock).mockResolvedValue([
      { role: 'user', content: 'hello' },
    ]);

    process.env.OLLAMA_BASE_URL = 'https://example.test';

    await expect(service.runTurn(baseInput)).resolves.toEqual({
      replies: [{ text: 'fallback ok' }],
    });
    expect(ollama.chat).toHaveBeenCalledTimes(2);
  });
});
