import { Injectable, Logger } from '@nestjs/common';
import { fetch } from 'undici';
import { normalizeOllamaModelId } from '../../gateway/config/openclaw-config.factory';
import type {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaClientConfig,
} from './ollama.types';

@Injectable()
export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name);

  async chat(
    config: OllamaClientConfig,
    modelRef: string,
    messages: OllamaChatMessage[],
  ): Promise<string> {
    const model = normalizeOllamaModelId(modelRef);
    const body: OllamaChatRequest = {
      model,
      messages,
      stream: false,
      options: { num_ctx: config.numCtx },
    };

    const url = `${config.baseUrl.replace(/\/+$/, '')}/api/chat`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
          ...config.extraHeaders,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = (await response.json()) as OllamaChatResponse;
      if (!response.ok) {
        const detail = payload.error ?? response.statusText;
        throw new Error(`Ollama ${response.status}: ${detail}`);
      }
      if (payload.error) {
        throw new Error(payload.error);
      }

      const content = payload.message?.content?.trim();
      if (!content) {
        throw new Error('Ollama returned an empty assistant message');
      }
      return content;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`chat failed model=${model}: ${message}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function parseOllamaExtraHeaders(
  raw: string | undefined,
): Record<string, string> {
  if (!raw?.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }
    return headers;
  } catch {
    return {};
  }
}

export function buildOllamaClientConfigFromEnv(
  env: NodeJS.ProcessEnv,
): OllamaClientConfig {
  const baseUrl = (env.OLLAMA_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '');
  const timeoutSeconds = Number.parseInt(
    env.OLLAMA_TIMEOUT_SECONDS ?? '300',
    10,
  );
  const numCtx = Number.parseInt(env.OLLAMA_NUM_CTX ?? '32768', 10);

  return {
    baseUrl,
    apiKey: (env.OLLAMA_API_KEY ?? 'ollama-local').trim() || 'ollama-local',
    timeoutMs:
      Number.isFinite(timeoutSeconds) && timeoutSeconds > 0
        ? timeoutSeconds * 1000
        : 300_000,
    numCtx: Number.isFinite(numCtx) && numCtx > 0 ? numCtx : 32768,
    extraHeaders: parseOllamaExtraHeaders(env.OLLAMA_EXTRA_HEADERS),
  };
}
