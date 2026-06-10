import type { SessionConfig } from './session-config.types';
import type {
  OpenClawConfig,
  OpenClawModelDefinition,
} from './openclaw-config.types';

const DEFAULT_CONTEXT_WINDOW = 32768;
const DEFAULT_MAX_TOKENS = 8192;
const REASONING_MODEL_RE =
  /(?:^|\/)(?:deepseek-r1|qwen3\.5|reasoning|r1)(?:[:/]|$)/i;

export function parseCsvList(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function normalizeOllamaModelId(modelRef: string): string {
  const trimmed = modelRef.trim();
  if (!trimmed) {
    return '';
  }
  const slash = trimmed.indexOf('/');
  if (slash >= 0 && trimmed.slice(0, slash).toLowerCase() === 'ollama') {
    return trimmed.slice(slash + 1);
  }
  return trimmed;
}

export function toModelRef(modelId: string): string {
  return modelId.includes('/') ? modelId : `ollama/${modelId}`;
}

function buildModelDefinition(modelId: string): OpenClawModelDefinition {
  return {
    id: modelId,
    name: modelId,
    input: ['text'],
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    maxTokens: DEFAULT_MAX_TOKENS,
    reasoning: REASONING_MODEL_RE.test(modelId),
  };
}

export function buildOpenClawConfigFromEnv(
  env: NodeJS.ProcessEnv,
  session: SessionConfig,
): OpenClawConfig {
  const baseUrl = (env.OLLAMA_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '');
  if (!baseUrl) {
    throw new Error(
      'OLLAMA_BASE_URL is required for Path B Ollama integration',
    );
  }

  const catalogIds = parseCsvList(env.OLLAMA_MODELS);
  const primaryId = normalizeOllamaModelId(
    env.OLLAMA_PRIMARY_MODEL ?? env.AGENT_MODEL ?? catalogIds[0] ?? '',
  );
  if (!primaryId) {
    throw new Error('OLLAMA_PRIMARY_MODEL or OLLAMA_MODELS is required');
  }

  const allModelIds = [
    ...new Set([
      primaryId,
      ...catalogIds,
      ...parseCsvList(env.OLLAMA_FALLBACK_MODELS),
    ]),
  ];
  const fallbackRefs = parseCsvList(env.OLLAMA_FALLBACK_MODELS)
    .map(normalizeOllamaModelId)
    .filter((id) => id && id !== primaryId)
    .map(toModelRef);

  const agentId = (env.AGENT_ID ?? 'main').trim() || 'main';
  const stateDir = expandHome(env.NESTIFY_STATE_DIR ?? '~/.nestify-claw');
  const workspace = expandHome(
    env.NESTIFY_WORKSPACE_DIR ?? `${stateDir}/workspace`,
  );

  return {
    agents: {
      defaults: {
        model: {
          primary: toModelRef(primaryId),
          fallbacks: fallbackRefs.length > 0 ? fallbackRefs : undefined,
        },
        workspace,
      },
      list: [{ id: agentId, workspace }],
    },
    models: {
      providers: {
        ollama: {
          baseUrl,
          apiKey:
            (env.OLLAMA_API_KEY ?? 'ollama-local').trim() || 'ollama-local',
          api: 'ollama',
          timeoutSeconds: parsePositiveInt(env.OLLAMA_TIMEOUT_SECONDS, 300),
          models: allModelIds.map(buildModelDefinition),
        },
      },
    },
    session,
    paths: {
      stateDir,
    },
  };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function expandHome(path: string): string {
  if (path.startsWith('~/')) {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
    return `${home}${path.slice(1)}`;
  }
  return path;
}
