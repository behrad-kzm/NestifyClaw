import {
  buildOpenClawConfigFromEnv,
  normalizeOllamaModelId,
  parseCsvList,
  toModelRef,
} from '../../../src/gateway/config/openclaw-config.factory';
import type { SessionConfig } from '../../../src/gateway/config/session-config.types';

const session: SessionConfig = {
  dmScope: 'per-channel-peer',
  mainKey: 'main',
  identityLinks: {},
};

describe('openclaw-config.factory', () => {
  it('parses csv model lists', () => {
    expect(parseCsvList('a, b,,c')).toEqual(['a', 'b', 'c']);
  });

  it('normalizes ollama model refs', () => {
    expect(normalizeOllamaModelId('ollama/qwen3.5:9b')).toBe('qwen3.5:9b');
    expect(toModelRef('qwen3.5:9b')).toBe('ollama/qwen3.5:9b');
  });

  it('builds OpenClaw config from env', () => {
    const config = buildOpenClawConfigFromEnv(
      {
        OLLAMA_BASE_URL: 'https://example.test/v1/',
        OLLAMA_PRIMARY_MODEL: 'qwen3.5:9b',
        OLLAMA_MODELS:
          'qwen3.5:27b,deepseek-r1:8b,qwen3.5:9b,gemma4:26b,gemma4:31b,gemma4:e4b',
        OLLAMA_FALLBACK_MODELS: 'deepseek-r1:8b',
        OLLAMA_API_KEY: 'ollama-local',
        OLLAMA_TIMEOUT_SECONDS: '120',
        NESTIFY_STATE_DIR: '~/.nestify-claw',
        AGENT_ID: 'main',
      },
      session,
    );

    expect(config.models.providers.ollama.baseUrl).toBe('https://example.test');
    expect(config.agents.defaults.model.primary).toBe('ollama/qwen3.5:9b');
    expect(config.agents.defaults.model.fallbacks).toEqual(['ollama/deepseek-r1:8b']);
    expect(config.models.providers.ollama.models.map((m) => m.id)).toEqual(
      expect.arrayContaining(['qwen3.5:27b', 'gemma4:e4b']),
    );
    expect(config.models.providers.ollama.timeoutSeconds).toBe(120);
  });

  it('throws when OLLAMA_BASE_URL is missing', () => {
    expect(() => buildOpenClawConfigFromEnv({}, session)).toThrow(/OLLAMA_BASE_URL/);
  });
});
