/** Minimal OpenClaw-shaped config built from nestify .env (Path B). */

export type OpenClawModelDefinition = {
  id: string;
  name: string;
  input: Array<'text' | 'image'>;
  contextWindow: number;
  maxTokens: number;
  reasoning?: boolean;
};

export type OpenClawProviderConfig = {
  baseUrl: string;
  apiKey: string;
  api: 'ollama';
  timeoutSeconds: number;
  models: OpenClawModelDefinition[];
};

export type OpenClawConfig = {
  agents: {
    defaults: {
      model: {
        primary: string;
        fallbacks?: string[];
      };
      workspace: string;
    };
    list: Array<{ id: string; workspace?: string }>;
  };
  models: {
    providers: {
      ollama: OpenClawProviderConfig;
    };
  };
  session: {
    dmScope: import('./session-config.types').DmScope;
    mainKey: string;
    identityLinks: Record<string, string[]>;
  };
  paths: {
    stateDir: string;
  };
};
