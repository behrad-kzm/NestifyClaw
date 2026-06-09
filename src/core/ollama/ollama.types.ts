export type OllamaChatRole = 'system' | 'user' | 'assistant';

export type OllamaChatMessage = {
  role: OllamaChatRole;
  content: string;
};

export type OllamaChatRequest = {
  model: string;
  messages: OllamaChatMessage[];
  stream: boolean;
  options?: Record<string, unknown>;
};

export type OllamaChatResponse = {
  message?: {
    role?: string;
    content?: string;
    thinking?: string;
  };
  error?: string;
};

export type OllamaClientConfig = {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  numCtx: number;
  extraHeaders: Record<string, string>;
};
