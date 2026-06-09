import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SessionState } from '../../common/types';
import type { OllamaChatMessage } from '../ollama/ollama.types';
import {
  createMessageLine,
  createSessionHeader,
  parseTranscriptLine,
  transcriptToChatMessages,
  type TranscriptLine,
} from './openclaw-transcript';

type SessionIndexEntry = {
  sessionId: string;
  sessionKey: string;
  updatedAt: number;
  data: Record<string, unknown>;
};

type SessionIndex = Record<string, SessionIndexEntry>;

@Injectable()
export class OpenClawSessionStore implements OnModuleInit {
  private readonly logger = new Logger(OpenClawSessionStore.name);

  private stateDir = '';
  private agentId = 'main';
  private historyLimit = 40;

  onModuleInit(): void {
    const stateDir = expandHome(process.env.NESTIFY_STATE_DIR ?? '~/.nestify-claw');
    const agentId = (process.env.AGENT_ID ?? 'main').trim() || 'main';
    const historyLimit = Number.parseInt(process.env.OLLAMA_HISTORY_LIMIT ?? '40', 10);
    this.configure({
      stateDir,
      agentId,
      historyLimit:
        Number.isFinite(historyLimit) && historyLimit > 0 ? historyLimit : undefined,
    });
  }

  configure(params: { stateDir: string; agentId: string; historyLimit?: number }): void {
    this.stateDir = params.stateDir;
    this.agentId = params.agentId;
    if (params.historyLimit && params.historyLimit > 0) {
      this.historyLimit = params.historyLimit;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.stateDir);
  }

  async load(sessionKey: string): Promise<SessionState | null> {
    const index = await this.readIndex();
    const entry = index[sessionKey];
    if (!entry) {
      return null;
    }
    return {
      sessionKey: entry.sessionKey,
      data: { ...entry.data, sessionId: entry.sessionId },
      updatedAt: entry.updatedAt,
    };
  }

  async save(state: SessionState): Promise<void> {
    const sessionId =
      typeof state.data.sessionId === 'string' && state.data.sessionId
        ? state.data.sessionId
        : randomUUID();

    const index = await this.readIndex();
    index[state.sessionKey] = {
      sessionId,
      sessionKey: state.sessionKey,
      updatedAt: state.updatedAt,
      data: { ...state.data, sessionId },
    };
    await this.writeIndex(index);
    await this.ensureTranscriptHeader(sessionId, state.sessionKey);
  }

  async appendMessage(
    sessionKey: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): Promise<void> {
    const sessionId = await this.resolveSessionId(sessionKey);
    const transcriptPath = this.transcriptPath(sessionId);
    const line = JSON.stringify(createMessageLine(role, content));
    await appendFile(transcriptPath, `${line}\n`, 'utf8');
  }

  async getChatHistory(sessionKey: string): Promise<OllamaChatMessage[]> {
    const sessionId = await this.resolveSessionId(sessionKey);
    const lines = await this.readTranscript(sessionId);
    return transcriptToChatMessages(lines, this.historyLimit);
  }

  private async resolveSessionId(sessionKey: string): Promise<string> {
    const existing = await this.load(sessionKey);
    if (existing?.data.sessionId && typeof existing.data.sessionId === 'string') {
      return existing.data.sessionId;
    }
    const sessionId = randomUUID();
    await this.save({
      sessionKey,
      data: { sessionId },
      updatedAt: Date.now(),
    });
    return sessionId;
  }

  private sessionsDir(): string {
    return path.join(this.stateDir, 'agents', this.agentId, 'sessions');
  }

  private indexPath(): string {
    return path.join(this.sessionsDir(), 'sessions.json');
  }

  private transcriptPath(sessionId: string): string {
    return path.join(this.sessionsDir(), `${sessionId}.jsonl`);
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.sessionsDir(), { recursive: true });
  }

  private async readIndex(): Promise<SessionIndex> {
    await this.ensureDir();
    try {
      const raw = await readFile(this.indexPath(), 'utf8');
      const parsed = JSON.parse(raw) as SessionIndex;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  private async writeIndex(index: SessionIndex): Promise<void> {
    await this.ensureDir();
    await writeFile(this.indexPath(), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  }

  private async ensureTranscriptHeader(sessionId: string, sessionKey: string): Promise<void> {
    const transcriptPath = this.transcriptPath(sessionId);
    try {
      await readFile(transcriptPath, 'utf8');
      return;
    } catch {
      // create new transcript
    }
    const header = JSON.stringify(createSessionHeader(sessionId, sessionKey));
    await writeFile(transcriptPath, `${header}\n`, 'utf8');
    this.logger.debug(`created transcript ${sessionId} for ${sessionKey}`);
  }

  private async readTranscript(sessionId: string): Promise<TranscriptLine[]> {
    try {
      const raw = await readFile(this.transcriptPath(sessionId), 'utf8');
      return raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map(parseTranscriptLine)
        .filter((line): line is TranscriptLine => line !== null);
    } catch {
      return [];
    }
  }
}

function expandHome(pathValue: string): string {
  if (pathValue.startsWith('~/')) {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
    return `${home}${pathValue.slice(1)}`;
  }
  return pathValue;
}
