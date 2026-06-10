import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { AgentRuntimePort, TurnInput, TurnResult } from '../../common/types';
import { OpenClawConfigService } from '../../gateway/config/openclaw-config.service';
import { toModelRef } from '../../gateway/config/openclaw-config.factory';
import {
  buildOllamaClientConfigFromEnv,
  OllamaClient,
} from '../ollama/ollama.client';
import type { OllamaChatMessage } from '../ollama/ollama.types';
import { OpenClawSessionStore } from '../sessions/openclaw-session.store';

/**
 * Component 3 host — Path B OpenClaw-aligned agent turn via native Ollama /api/chat.
 *
 * Uses OpenClaw-shaped config from .env, filesystem JSONL transcripts, and a
 * primary + fallback model chain. When OLLAMA_BASE_URL is unset, returns a stub
 * reply so the pipeline remains testable without a live LLM.
 */
@Injectable()
export class AgentRuntimeService implements AgentRuntimePort, OnModuleInit {
  private readonly logger = new Logger('AgentRuntime');
  private historyLimit = 40;
  private systemPrompt = '';

  constructor(
    @Inject(OpenClawConfigService)
    private readonly openClawConfig: OpenClawConfigService,
    @Inject(OllamaClient)
    private readonly ollama: OllamaClient,
    @Inject(OpenClawSessionStore)
    private readonly sessions: OpenClawSessionStore,
  ) {}

  onModuleInit(): void {
    const env = process.env;
    const historyLimit = Number.parseInt(env.OLLAMA_HISTORY_LIMIT ?? '40', 10);
    if (Number.isFinite(historyLimit) && historyLimit > 0) {
      this.historyLimit = historyLimit;
    }
    this.systemPrompt = (env.AGENT_SYSTEM_PROMPT ?? '').trim();

    if (this.openClawConfig.isReady()) {
      const config = this.openClawConfig.getConfig();
      this.sessions.configure({
        stateDir: config.paths.stateDir,
        agentId: config.agents.list[0]?.id ?? 'main',
        historyLimit: this.historyLimit,
      });
    }
  }

  async runTurn(input: TurnInput): Promise<TurnResult> {
    const userText = input.message.text?.trim() ?? '';
    if (!this.openClawConfig.isReady()) {
      this.logger.warn(
        `runTurn stub (OLLAMA_BASE_URL not set) for ${input.route.sessionKey}`,
      );
      return {
        replies: [
          {
            text: `[stub agent:${input.route.agentId}] received: ${userText}`,
          },
        ],
      };
    }

    const config = this.openClawConfig.getConfig();
    const ollamaConfig = buildOllamaClientConfigFromEnv(process.env);
    const modelChain = [
      config.agents.defaults.model.primary,
      ...(config.agents.defaults.model.fallbacks ?? []),
    ];

    await this.sessions.save({
      sessionKey: input.route.sessionKey,
      data: {
        ...(input.session?.data ?? {}),
        channel: input.route.channel,
        chatId: input.route.chatId,
      },
      updatedAt: Date.now(),
    });

    if (userText) {
      await this.sessions.appendMessage(input.route.sessionKey, 'user', userText);
    }

    const history = await this.sessions.getChatHistory(input.route.sessionKey);
    const messages = buildChatMessages(this.systemPrompt, history);

    let lastError: unknown;
    for (const modelRef of modelChain) {
      try {
        const assistantText = await this.ollama.chat(ollamaConfig, modelRef, messages);
        await this.sessions.appendMessage(
          input.route.sessionKey,
          'assistant',
          assistantText,
        );
        return { replies: [{ text: assistantText }] };
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `model ${modelRef} failed for ${input.route.sessionKey}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const detail =
      lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown');
    const tried = modelChain.map((ref) => toModelRef(ref)).join(', ');
    return {
      replies: [
        {
          text: `Sorry, the agent could not reach Ollama (tried: ${tried}). ${detail}`,
        },
      ],
    };
  }
}

function buildChatMessages(
  systemPrompt: string,
  history: OllamaChatMessage[],
): OllamaChatMessage[] {
  const messages: OllamaChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push(...history);
  return messages;
}
